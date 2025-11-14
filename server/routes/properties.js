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
    
    // Create property-specific directory
    const propertyDir = path.join(uploadDir, 'properties');
    if (!fs.existsSync(propertyDir)) {
      fs.mkdirSync(propertyDir, { recursive: true });
    }
    
    cb(null, propertyDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and videos only
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all properties
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, location, minPrice, maxPrice, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*, c.name as owner_name, c.phone as owner_phone, c.email as owner_email
      FROM properties p
      LEFT JOIN clients c ON p.owner_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND p.type = ?';
      params.push(type);
    }

    if (location) {
      query += ' AND p.location LIKE ?';
      params.push(`%${location}%`);
    }

    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    // Convert limit and offset to integers and ensure they're valid numbers
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [properties] = await pool.execute(query, params);

    // Get photos and videos for each property
    for (let property of properties) {
      // Get photos
      const [photos] = await pool.execute(
        'SELECT file_path FROM property_media WHERE property_id = ? AND type = "photo" ORDER BY id',
        [property.id]
      );
      property.photos = photos.map(photo => photo.file_path);

      // Get videos
      const [videos] = await pool.execute(
        'SELECT file_path FROM property_media WHERE property_id = ? AND type = "video" ORDER BY id',
        [property.id]
      );
      property.videos = videos.map(video => video.file_path);

      // Parse features
      property.features = property.features ? JSON.parse(property.features) : [];
    }

    res.json(properties);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get property by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [properties] = await pool.execute(`
      SELECT p.*, c.name as owner_name, c.phone as owner_phone, c.email as owner_email
      FROM properties p
      LEFT JOIN clients c ON p.owner_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = properties[0];
    
    // Get photos
    const [photos] = await pool.execute(
      'SELECT file_path FROM property_media WHERE property_id = ? AND type = "photo" ORDER BY id',
      [property.id]
    );
    property.photos = photos.map(photo => photo.file_path);

    // Get videos
    const [videos] = await pool.execute(
      'SELECT file_path FROM property_media WHERE property_id = ? AND type = "video" ORDER BY id',
      [property.id]
    );
    property.videos = videos.map(video => video.file_path);
    
    // Parse features
    property.features = property.features ? JSON.parse(property.features) : [];

    res.json(property);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create property
router.post('/', [
  authenticateToken,
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ]),
  body('property_id').notEmpty(),
  body('title').notEmpty(),
  body('type').isIn(['apartment', 'duplex', 'house', 'building', 'villa', 'premises', 'office', 'land']),
  body('condition_status').isIn(['new', 'renovated', 'good_condition', 'to_renovate']),
  body('transaction_type').isIn(['sale', 'rental', 'seasonal_rental']),
  body('surface').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('location').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if property_id already exists
    const [existingProperty] = await pool.execute(
      'SELECT id FROM properties WHERE property_id = ?',
      [req.body.property_id]
    );

    if (existingProperty.length > 0) {
      return res.status(400).json({ error: 'Property ID already exists' });
    }

    const {
      property_id,
      title,
      type,
      condition_status,
      transaction_type,
      surface,
      price,
      location,
      description,
      features = [],
      rooms = 0,
      owner_id,
      status = 'available'
    } = req.body;

    // Insert property
    const [result] = await pool.execute(`
      INSERT INTO properties (
        property_id, title, type, condition_status, transaction_type,
        surface, price, location, description, features, rooms, owner_id, 
        created_by, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      property_id, title, type, condition_status, transaction_type,
      surface, price, location, description,
      JSON.stringify(Array.isArray(features) ? features : []), rooms, owner_id,
      req.user.id, status
    ]);

    const propertyId = result.insertId;

    // Handle file uploads
    const files = req.files;
    if (files) {
      // Process photos
      if (files.photos) {
        for (const photo of files.photos) {
          await pool.execute(
            'INSERT INTO property_media (property_id, type, file_path, file_size, created_at) VALUES (?, ?, ?, ?, NOW())',
            [propertyId, 'photo', `/uploads/properties/${photo.filename}`, photo.size]
          );
        }
      }

      // Process videos
      if (files.videos) {
        for (const video of files.videos) {
          await pool.execute(
            'INSERT INTO property_media (property_id, type, file_path, file_size, created_at) VALUES (?, ?, ?, ?, NOW())',
            [propertyId, 'video', `/uploads/properties/${video.filename}`, video.size]
          );
        }
      }
    }

    res.status(201).json({
      id: propertyId,
      message: 'Property created successfully'
    });
  } catch (error) {
    console.error('Create property error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Property ID already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update property
router.put('/:id', [
  authenticateToken,
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ]),
  body('title').optional().notEmpty(),
  body('type').optional().isIn(['apartment', 'duplex', 'house', 'building', 'villa', 'premises', 'office', 'land']),
  body('surface').optional().isInt({ min: 1 }),
  body('price').optional().isFloat({ min: 0 })
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
      'title', 'type', 'condition_status', 'transaction_type', 'surface', 
      'price', 'location', 'description', 'rooms', 'owner_id', 'status'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    });

    // Handle features separately (JSON field)
    if (req.body.features !== undefined) {
      updates.push('features = ?');
      params.push(JSON.stringify(Array.isArray(req.body.features) ? req.body.features : []));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const [result] = await pool.execute(
      `UPDATE properties SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Handle file uploads
    const files = req.files;
    if (files) {
      // Process photos
      if (files.photos && files.photos.length > 0) {
        for (const photo of files.photos) {
          await pool.execute(
            'INSERT INTO property_media (property_id, type, file_path, file_size, created_at) VALUES (?, ?, ?, ?, NOW())',
            [req.params.id, 'photo', `/uploads/properties/${photo.filename}`, photo.size]
          );
        }
      }

      // Process videos
      if (files.videos && files.videos.length > 0) {
        for (const video of files.videos) {
          await pool.execute(
            'INSERT INTO property_media (property_id, type, file_path, file_size, created_at) VALUES (?, ?, ?, ?, NOW())',
            [req.params.id, 'video', `/uploads/properties/${video.filename}`, video.size]
          );
        }
      }
    }

    // Remove media if requested
    if (req.body.remove_media && Array.isArray(req.body.remove_media)) {
      for (const mediaId of req.body.remove_media) {
        // Get the file path first
        const [media] = await pool.execute(
          'SELECT file_path FROM property_media WHERE id = ? AND property_id = ?',
          [mediaId, req.params.id]
        );

        if (media.length > 0) {
          // Delete the file from the filesystem
          const filePath = path.join(__dirname, '..', media[0].file_path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          // Delete from database
          await pool.execute(
            'DELETE FROM property_media WHERE id = ?',
            [mediaId]
          );
        }
      }
    }

    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete property
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Get all media files for this property
    const [media] = await pool.execute(
      'SELECT file_path FROM property_media WHERE property_id = ?',
      [req.params.id]
    );

    // Delete all media files from the filesystem
    for (const item of media) {
      const filePath = path.join(__dirname, '..', item.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete all media records
    await pool.execute(
      'DELETE FROM property_media WHERE property_id = ?',
      [req.params.id]
    );

    // Delete the property
    const [result] = await pool.execute(
      'DELETE FROM properties WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;