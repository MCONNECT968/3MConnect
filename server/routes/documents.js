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
    
    // Create documents directory
    const docsDir = path.join(uploadDir, 'documents');
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
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

// Get all documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, category, status, relatedEntityType, relatedEntityId, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT d.*, u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ' AND d.type = ?';
      params.push(type);
    }

    if (category) {
      query += ' AND d.category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    if (relatedEntityType) {
      query += ' AND d.related_entity_type = ?';
      params.push(relatedEntityType);
    }

    if (relatedEntityId) {
      query += ' AND d.related_entity_id = ?';
      params.push(relatedEntityId);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    // Convert limit and offset to integers and ensure they're valid numbers
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [documents] = await pool.execute(query, params);

    // Parse JSON fields
    documents.forEach(doc => {
      doc.tags = doc.tags ? JSON.parse(doc.tags) : [];
    });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload document
router.post('/', [
  authenticateToken,
  upload.single('document'),
  body('name').notEmpty(),
  body('type').isIn(['pdf', 'image', 'video', 'spreadsheet', 'document', 'other']),
  body('category').isIn(['contract', 'receipt', 'inventory', 'insurance', 'identity', 'income_proof', 'property_photos', 'maintenance', 'legal', 'marketing', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      name,
      type,
      category,
      relatedEntityType,
      relatedEntityId,
      description,
      isPublic = false,
      tags = '[]',
      expiryDate
    } = req.body;

    const filePath = `/uploads/documents/${req.file.filename}`;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    const [result] = await pool.execute(`
      INSERT INTO documents (
        name, type, category, file_path, file_size, mime_type,
        related_entity_type, related_entity_id, uploaded_by, is_public,
        tags, description, expiry_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name, type, category, filePath, fileSize, mimeType,
      relatedEntityType, relatedEntityId, req.user.id, isPublic === 'true',
      tags, description, expiryDate, 'active'
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Document uploaded successfully',
      document: {
        id: result.insertId,
        name,
        type,
        category,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        description,
        is_public: isPublic === 'true',
        tags: JSON.parse(tags),
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get document by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [documents] = await pool.execute(`
      SELECT d.*, u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ?
    `, [req.params.id]);

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];
    
    // Parse JSON fields
    document.tags = document.tags ? JSON.parse(document.tags) : [];

    // Increment download count
    await pool.execute(
      'UPDATE documents SET download_count = download_count + 1 WHERE id = ?',
      [req.params.id]
    );

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update document
router.put('/:id', [
  authenticateToken,
  body('name').optional().notEmpty(),
  body('type').optional().isIn(['pdf', 'image', 'video', 'spreadsheet', 'document', 'other']),
  body('category').optional().isIn(['contract', 'receipt', 'inventory', 'insurance', 'identity', 'income_proof', 'property_photos', 'maintenance', 'legal', 'marketing', 'other']),
  body('status').optional().isIn(['active', 'archived', 'deleted'])
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
      'name', 'type', 'category', 'related_entity_type', 'related_entity_id',
      'is_public', 'description', 'expiry_date', 'status'
    ];

    // Map frontend camelCase to database snake_case
    const fieldMapping = {
      relatedEntityType: 'related_entity_type',
      relatedEntityId: 'related_entity_id',
      isPublic: 'is_public',
      expiryDate: 'expiry_date'
    };

    Object.keys(req.body).forEach(key => {
      const dbField = fieldMapping[key] || key;
      if (allowedFields.includes(dbField)) {
        updates.push(`${dbField} = ?`);
        params.push(req.body[key]);
      }
    });

    // Handle tags separately (JSON field)
    if (req.body.tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(req.body.tags));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const [result] = await pool.execute(
      `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Get document to delete file
    const [documents] = await pool.execute(
      'SELECT file_path FROM documents WHERE id = ?',
      [req.params.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', documents[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete document from database
    const [result] = await pool.execute(
      'DELETE FROM documents WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;