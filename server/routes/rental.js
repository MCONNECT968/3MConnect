const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Create rental documents directory
    const docsDir = path.join(uploadDir, 'rental_documents');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    cb(null, docsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all rental contracts
router.get('/contracts', authenticateToken, async (req, res) => {
  try {
    const { status, propertyId, tenantId, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT c.*, 
        p.title as property_title, p.location as property_location,
        t.name as tenant_name, t.phone as tenant_phone,
        o.name as owner_name, o.phone as owner_phone
      FROM rental_contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN clients t ON c.tenant_id = t.id
      LEFT JOIN clients o ON c.owner_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (propertyId) {
      query += ' AND c.property_id = ?';
      params.push(propertyId);
    }

    if (tenantId) {
      query += ' AND c.tenant_id = ?';
      params.push(tenantId);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    // Convert limit and offset to integers and ensure they're valid numbers
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [contracts] = await pool.execute(query, params);

    // Get documents for each contract
    for (let contract of contracts) {
      const [documents] = await pool.execute(
        'SELECT * FROM rental_documents WHERE contract_id = ?',
        [contract.id]
      );
      contract.documents = documents;
    }

    res.json(contracts);
  } catch (error) {
    console.error('Get rental contracts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create rental contract
router.post('/contracts', [
  authenticateToken,
  body('propertyId').notEmpty(),
  body('tenantId').notEmpty(),
  body('ownerId').notEmpty(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('monthlyRent').isFloat({ min: 0 }),
  body('deposit').isFloat({ min: 0 }),
  body('status').isIn(['active', 'pending', 'expired', 'terminated', 'renewed']),
  body('paymentDay').isInt({ min: 1, max: 31 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      propertyId,
      tenantId,
      ownerId,
      startDate,
      endDate,
      monthlyRent,
      deposit,
      status,
      paymentDay,
      contractTerms,
      specialConditions
    } = req.body;

    // Insert contract
    const [result] = await pool.execute(`
      INSERT INTO rental_contracts (
        property_id, tenant_id, owner_id, start_date, end_date,
        monthly_rent, deposit, status, payment_day, contract_terms,
        special_conditions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      propertyId, tenantId, ownerId, startDate, endDate,
      monthlyRent, deposit, status, paymentDay, contractTerms,
      specialConditions
    ]);

    // Update property status if contract is active
    if (status === 'active') {
      await pool.execute(
        'UPDATE properties SET status = ? WHERE id = ?',
        ['rented', propertyId]
      );
    }

    res.status(201).json({
      id: result.insertId,
      message: 'Rental contract created successfully'
    });
  } catch (error) {
    console.error('Create rental contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rental contract by ID
router.get('/contracts/:id', authenticateToken, async (req, res) => {
  try {
    const [contracts] = await pool.execute(`
      SELECT c.*, 
        p.title as property_title, p.location as property_location,
        t.name as tenant_name, t.phone as tenant_phone, t.email as tenant_email,
        o.name as owner_name, o.phone as owner_phone, o.email as owner_email
      FROM rental_contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN clients t ON c.tenant_id = t.id
      LEFT JOIN clients o ON c.owner_id = o.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (contracts.length === 0) {
      return res.status(404).json({ error: 'Rental contract not found' });
    }

    const contract = contracts[0];

    // Get documents
    const [documents] = await pool.execute(
      'SELECT * FROM rental_documents WHERE contract_id = ?',
      [contract.id]
    );
    contract.documents = documents;

    res.json(contract);
  } catch (error) {
    console.error('Get rental contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update rental contract
router.put('/contracts/:id', [
  authenticateToken,
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('monthlyRent').optional().isFloat({ min: 0 }),
  body('deposit').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'pending', 'expired', 'terminated', 'renewed']),
  body('paymentDay').optional().isInt({ min: 1, max: 31 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get current contract to check for status change
    const [currentContract] = await pool.execute(
      'SELECT status, property_id FROM rental_contracts WHERE id = ?',
      [req.params.id]
    );

    if (currentContract.length === 0) {
      return res.status(404).json({ error: 'Rental contract not found' });
    }

    const updates = [];
    const params = [];

    // Fields that can be updated
    const allowedFields = [
      'property_id', 'tenant_id', 'owner_id', 'start_date', 'end_date',
      'monthly_rent', 'deposit', 'status', 'payment_day', 'contract_terms',
      'special_conditions'
    ];

    // Map frontend camelCase to database snake_case
    const fieldMapping = {
      propertyId: 'property_id',
      tenantId: 'tenant_id',
      ownerId: 'owner_id',
      startDate: 'start_date',
      endDate: 'end_date',
      monthlyRent: 'monthly_rent',
      paymentDay: 'payment_day',
      contractTerms: 'contract_terms',
      specialConditions: 'special_conditions'
    };

    Object.keys(req.body).forEach(key => {
      const dbField = fieldMapping[key] || key;
      if (allowedFields.includes(dbField)) {
        updates.push(`${dbField} = ?`);
        params.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const [result] = await pool.execute(
      `UPDATE rental_contracts SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Rental contract not found' });
    }

    // Update property status if contract status changed
    if (req.body.status && req.body.status !== currentContract[0].status) {
      const propertyId = req.body.propertyId || currentContract[0].property_id;
      
      if (req.body.status === 'active') {
        await pool.execute(
          'UPDATE properties SET status = ? WHERE id = ?',
          ['rented', propertyId]
        );
      } else if (req.body.status === 'terminated' || req.body.status === 'expired') {
        await pool.execute(
          'UPDATE properties SET status = ? WHERE id = ?',
          ['available', propertyId]
        );
      }
    }

    res.json({ message: 'Rental contract updated successfully' });
  } catch (error) {
    console.error('Update rental contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete rental contract
router.delete('/contracts/:id', authenticateToken, async (req, res) => {
  try {
    // Get contract to update property status
    const [contract] = await pool.execute(
      'SELECT property_id, status FROM rental_contracts WHERE id = ?',
      [req.params.id]
    );

    if (contract.length === 0) {
      return res.status(404).json({ error: 'Rental contract not found' });
    }

    // Delete contract documents
    await pool.execute(
      'DELETE FROM rental_documents WHERE contract_id = ?',
      [req.params.id]
    );

    // Delete contract payments
    await pool.execute(
      'DELETE FROM rental_payments WHERE contract_id = ?',
      [req.params.id]
    );

    // Delete contract
    const [result] = await pool.execute(
      'DELETE FROM rental_contracts WHERE id = ?',
      [req.params.id]
    );

    // Update property status if contract was active
    if (contract[0].status === 'active') {
      await pool.execute(
        'UPDATE properties SET status = ? WHERE id = ?',
        ['available', contract[0].property_id]
      );
    }

    res.json({ message: 'Rental contract deleted successfully' });
  } catch (error) {
    console.error('Delete rental contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload contract document
router.post('/contracts/:id/documents', [
  authenticateToken,
  upload.single('document'),
  body('type').isIn(['contract', 'receipt', 'inventory', 'insurance', 'identity', 'income_proof', 'other']),
  body('name').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type, name, description } = req.body;
    const filePath = `/uploads/rental_documents/${req.file.filename}`;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    const [result] = await pool.execute(`
      INSERT INTO rental_documents (
        contract_id, type, name, file_path, file_size, mime_type,
        description, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      req.params.id, type, name, filePath, fileSize, mimeType,
      description, req.user.id
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Document uploaded successfully',
      document: {
        id: result.insertId,
        name,
        type,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        description
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all rental payments
router.get('/payments', authenticateToken, async (req, res) => {
  try {
    const { status, contractId, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*, 
        c.property_id, c.tenant_id, c.monthly_rent,
        pr.title as property_title, pr.location as property_location,
        t.name as tenant_name, t.phone as tenant_phone
      FROM rental_payments p
      LEFT JOIN rental_contracts c ON p.contract_id = c.id
      LEFT JOIN properties pr ON c.property_id = pr.id
      LEFT JOIN clients t ON c.tenant_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (contractId) {
      query += ' AND p.contract_id = ?';
      params.push(contractId);
    }

    query += ' ORDER BY p.due_date DESC LIMIT ? OFFSET ?';
    // Convert limit and offset to integers and ensure they're valid numbers
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [payments] = await pool.execute(query, params);

    res.json(payments);
  } catch (error) {
    console.error('Get rental payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create rental payment
router.post('/payments', [
  authenticateToken,
  body('contractId').notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('dueDate').isISO8601(),
  body('status').isIn(['pending', 'paid', 'late', 'overdue', 'partial', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      contractId,
      amount,
      dueDate,
      paidDate,
      status,
      paymentMethod,
      receiptNumber,
      notes,
      lateFee = 0
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO rental_payments (
        contract_id, amount, due_date, paid_date, status,
        payment_method, receipt_number, notes, late_fee,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      contractId, amount, dueDate, paidDate, status,
      paymentMethod, receiptNumber, notes, lateFee
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Create rental payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rental payment by ID
router.get('/payments/:id', authenticateToken, async (req, res) => {
  try {
    const [payments] = await pool.execute(`
      SELECT p.*, 
        c.property_id, c.tenant_id, c.monthly_rent,
        pr.title as property_title, pr.location as property_location,
        t.name as tenant_name, t.phone as tenant_phone, t.email as tenant_email
      FROM rental_payments p
      LEFT JOIN rental_contracts c ON p.contract_id = c.id
      LEFT JOIN properties pr ON c.property_id = pr.id
      LEFT JOIN clients t ON c.tenant_id = t.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payments[0]);
  } catch (error) {
    console.error('Get rental payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update rental payment
router.put('/payments/:id', [
  authenticateToken,
  body('amount').optional().isFloat({ min: 0 }),
  body('dueDate').optional().isISO8601(),
  body('status').optional().isIn(['pending', 'paid', 'late', 'overdue', 'partial', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = [];
    const params = [];

    // Fields that can be updated
    const allowedFields = [
      'contract_id', 'amount', 'due_date', 'paid_date', 'status',
      'payment_method', 'receipt_number', 'notes', 'late_fee'
    ];

    // Map frontend camelCase to database snake_case
    const fieldMapping = {
      contractId: 'contract_id',
      dueDate: 'due_date',
      paidDate: 'paid_date',
      paymentMethod: 'payment_method',
      receiptNumber: 'receipt_number',
      lateFee: 'late_fee'
    };

    Object.keys(req.body).forEach(key => {
      const dbField = fieldMapping[key] || key;
      if (allowedFields.includes(dbField)) {
        updates.push(`${dbField} = ?`);
        params.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const [result] = await pool.execute(
      `UPDATE rental_payments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment updated successfully' });
  } catch (error) {
    console.error('Update rental payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete rental payment
router.delete('/payments/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM rental_payments WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete rental payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all rental alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { priority, isRead, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT a.*, 
        c.property_id, c.tenant_id,
        p.title as property_title,
        t.name as tenant_name
      FROM rental_alerts a
      LEFT JOIN rental_contracts c ON a.contract_id = c.id
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN clients t ON c.tenant_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (priority) {
      query += ' AND a.priority = ?';
      params.push(priority);
    }

    if (isRead !== undefined) {
      query += ' AND a.is_read = ?';
      params.push(isRead === 'true');
    }

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    // Convert limit and offset to integers and ensure they're valid numbers
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [alerts] = await pool.execute(query, params);

    res.json(alerts);
  } catch (error) {
    console.error('Get rental alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark alert as read
router.put('/alerts/:id/read', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'UPDATE rental_alerts SET is_read = true WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;