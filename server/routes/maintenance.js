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
    
    // Create maintenance photos directory
    const photosDir = path.join(uploadDir, 'maintenance');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }
    
    cb(null, photosDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all maintenance requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, category, propertyId, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT m.*, 
        p.title as property_title, p.location as property_location,
        c.name as tenant_name, c.phone as tenant_phone
      FROM maintenance_requests m
      LEFT JOIN properties p ON m.property_id = p.id
      LEFT JOIN clients c ON m.tenant_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND m.priority = ?';
      params.push(priority);
    }

    if (category) {
      query += ' AND m.category = ?';
      params.push(category);
    }

    if (propertyId) {
      query += ' AND m.property_id = ?';
      params.push(propertyId);
    }

    query += ' ORDER BY m.reported_date DESC LIMIT ? OFFSET ?';
    // Convert limit and offset to integers and ensure they're valid numbers
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [requests] = await pool.execute(query, params);

    // Get photos for each request
    for (let request of requests) {
      const [photos] = await pool.execute(
        'SELECT file_path FROM maintenance_photos WHERE request_id = ?',
        [request.id]
      );
      request.photos = photos.map(photo => photo.file_path);
    }

    res.json(requests);
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create maintenance request
router.post('/', [
  authenticateToken,
  upload.array('photos', 10),
  body('propertyId').notEmpty(),
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('category').isIn(['plumbing', 'electrical', 'heating', 'appliances', 'structural', 'cleaning', 'garden', 'security', 'other']),
  body('priority').isIn(['low', 'medium', 'high', 'emergency']),
  body('status').isIn(['reported', 'assigned', 'in_progress', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      propertyId,
      contractId,
      tenantId,
      title,
      description,
      category,
      priority,
      status,
      reportedDate,
      scheduledDate,
      completedDate,
      cost,
      assignedTo,
      notes
    } = req.body;

    // Insert maintenance request
    const [result] = await pool.execute(`
      INSERT INTO maintenance_requests (
        property_id, contract_id, tenant_id, title, description,
        category, priority, status, reported_date, scheduled_date,
        completed_date, cost, assigned_to, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      propertyId, contractId, tenantId, title, description,
      category, priority, status, reportedDate || new Date(), scheduledDate,
      completedDate, cost, assignedTo, notes
    ]);

    const requestId = result.insertId;

    // Handle file uploads
    const files = req.files;
    if (files && files.length > 0) {
      for (const file of files) {
        await pool.execute(
          'INSERT INTO maintenance_photos (request_id, file_path, file_size, created_at) VALUES (?, ?, ?, NOW())',
          [requestId, `/uploads/maintenance/${file.filename}`, file.size]
        );
      }
    }

    // Create alert for emergency or high priority requests
    if (priority === 'emergency' || priority === 'high') {
      await pool.execute(`
        INSERT INTO rental_alerts (
          type, contract_id, message, priority, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        'maintenance_required',
        contractId,
        `Maintenance request: ${title} (${priority} priority)`,
        priority === 'emergency' ? 'urgent' : 'high',
        false
      ]);
    }

    res.status(201).json({
      id: requestId,
      message: 'Maintenance request created successfully'
    });
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get maintenance request by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [requests] = await pool.execute(`
      SELECT m.*, 
        p.title as property_title, p.location as property_location,
        c.name as tenant_name, c.phone as tenant_phone, c.email as tenant_email
      FROM maintenance_requests m
      LEFT JOIN properties p ON m.property_id = p.id
      LEFT JOIN clients c ON m.tenant_id = c.id
      WHERE m.id = ?
    `, [req.params.id]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    const request = requests[0];

    // Get photos
    const [photos] = await pool.execute(
      'SELECT file_path FROM maintenance_photos WHERE request_id = ?',
      [request.id]
    );
    request.photos = photos.map(photo => photo.file_path);

    res.json(request);
  } catch (error) {
    console.error('Get maintenance request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update maintenance request
router.put('/:id', [
  authenticateToken,
  upload.array('photos', 10),
  body('title').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('category').optional().isIn(['plumbing', 'electrical', 'heating', 'appliances', 'structural', 'cleaning', 'garden', 'security', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'emergency']),
  body('status').optional().isIn(['reported', 'assigned', 'in_progress', 'completed', 'cancelled'])
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
      'property_id', 'contract_id', 'tenant_id', 'title', 'description',
      'category', 'priority', 'status', 'reported_date', 'scheduled_date',
      'completed_date', 'cost', 'assigned_to', 'notes'
    ];

    // Map frontend camelCase to database snake_case
    const fieldMapping = {
      propertyId: 'property_id',
      contractId: 'contract_id',
      tenantId: 'tenant_id',
      reportedDate: 'reported_date',
      scheduledDate: 'scheduled_date',
      completedDate: 'completed_date',
      assignedTo: 'assigned_to'
    };

    Object.keys(req.body).forEach(key => {
      const dbField = fieldMapping[key] || key;
      if (allowedFields.includes(dbField)) {
        updates.push(`${dbField} = ?`);
        params.push(req.body[key]);
      }
    });

    if (updates.length === 0 && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // If there are field updates, execute the update query
    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(req.params.id);

      const [result] = await pool.execute(
        `UPDATE maintenance_requests SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Maintenance request not found' });
      }
    }

    // Handle file uploads
    const files = req.files;
    if (files && files.length > 0) {
      for (const file of files) {
        await pool.execute(
          'INSERT INTO maintenance_photos (request_id, file_path, file_size, created_at) VALUES (?, ?, ?, NOW())',
          [req.params.id, `/uploads/maintenance/${file.filename}`, file.size]
        );
      }
    }

    // If status changed to completed, set completed_date if not provided
    if (req.body.status === 'completed') {
      const [checkCompleted] = await pool.execute(
        'SELECT completed_date FROM maintenance_requests WHERE id = ?',
        [req.params.id]
      );
      
      if (!checkCompleted[0].completed_date) {
        await pool.execute(
          'UPDATE maintenance_requests SET completed_date = NOW() WHERE id = ?',
          [req.params.id]
        );
      }
    }

    res.json({ message: 'Maintenance request updated successfully' });
  } catch (error) {
    console.error('Update maintenance request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete maintenance request
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Get photos to delete files
    const [photos] = await pool.execute(
      'SELECT file_path FROM maintenance_photos WHERE request_id = ?',
      [req.params.id]
    );

    // Delete photo files
    for (const photo of photos) {
      const filePath = path.join(__dirname, '..', photo.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete photos from database
    await pool.execute(
      'DELETE FROM maintenance_photos WHERE request_id = ?',
      [req.params.id]
    );

    // Delete maintenance request
    const [result] = await pool.execute(
      'DELETE FROM maintenance_requests WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }

    res.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;