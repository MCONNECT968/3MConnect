const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all visits
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, startDate, endDate, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT v.*, 
        p.title as property_title, p.location as property_location,
        c.name as client_name, c.phone as client_phone,
        u.name as agent_name
      FROM property_visits v
      LEFT JOIN properties p ON v.property_id = p.id
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN users u ON v.agent_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND v.type = ?';
      params.push(type);
    }

    if (startDate) {
      query += ' AND v.scheduled_date >= ?';
      params.push(new Date(startDate));
    }

    if (endDate) {
      query += ' AND v.scheduled_date <= ?';
      params.push(new Date(endDate));
    }

    query += ' ORDER BY v.scheduled_date DESC LIMIT ? OFFSET ?';
    // Convert limit and offset to integers and ensure they're valid numbers
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [visits] = await pool.execute(query, params);

    res.json(visits);
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create visit
router.post('/', [
  authenticateToken,
  body('propertyId').notEmpty(),
  body('clientId').notEmpty(),
  body('scheduledDate').isISO8601(),
  body('duration').isInt({ min: 15 }),
  body('status').isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled']),
  body('type').isIn(['first_viewing', 'second_viewing', 'final_inspection', 'property_evaluation', 'maintenance_check', 'handover'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check for scheduling conflicts
    const visitStartTime = new Date(req.body.scheduledDate);
    const endTime = new Date(visitStartTime.getTime() + req.body.duration * 60000);
    
    const [conflicts] = await pool.execute(`
      SELECT * FROM property_visits 
      WHERE (
        (scheduled_date <= ? AND DATE_ADD(scheduled_date, INTERVAL duration MINUTE) >= ?) OR
        (scheduled_date >= ? AND scheduled_date <= ?)
      )
      AND property_id = ? 
      AND status NOT IN ('cancelled', 'no_show')
    `, [
      endTime, visitStartTime, visitStartTime, endTime, req.body.propertyId
    ]);

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        error: 'Scheduling conflict detected',
        conflicts: conflicts
      });
    }

    const {
      propertyId,
      clientId,
      agentId,
      scheduledDate,
      duration,
      status,
      type,
      notes,
      outcome
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO property_visits (
        property_id, client_id, agent_id, scheduled_date, duration,
        status, type, notes, outcome, reminder_sent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      propertyId, clientId, agentId, scheduledDate, duration,
      status, type, notes, outcome, false
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Visit scheduled successfully'
    });
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get visit by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [visits] = await pool.execute(`
      SELECT v.*, 
        p.title as property_title, p.location as property_location,
        c.name as client_name, c.phone as client_phone,
        u.name as agent_name
      FROM property_visits v
      LEFT JOIN properties p ON v.property_id = p.id
      LEFT JOIN clients c ON v.client_id = c.id
      LEFT JOIN users u ON v.agent_id = u.id
      WHERE v.id = ?
    `, [req.params.id]);

    if (visits.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json(visits[0]);
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update visit
router.put('/:id', [
  authenticateToken,
  body('scheduledDate').optional().isISO8601(),
  body('duration').optional().isInt({ min: 15 }),
  body('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled']),
  body('type').optional().isIn(['first_viewing', 'second_viewing', 'final_inspection', 'property_evaluation', 'maintenance_check', 'handover'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if the visit exists
    const [existingVisit] = await pool.execute(
      'SELECT * FROM property_visits WHERE id = ?',
      [req.params.id]
    );

    if (existingVisit.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Check for scheduling conflicts if date or property is changing
    if (req.body.scheduledDate || req.body.propertyId) {
      const visitStartTime = req.body.scheduledDate ? new Date(req.body.scheduledDate) : new Date(existingVisit[0].scheduled_date);
      const duration = req.body.duration || existingVisit[0].duration;
      const endTime = new Date(visitStartTime.getTime() + duration * 60000);
      const propertyId = req.body.propertyId || existingVisit[0].property_id;
      
      const [conflicts] = await pool.execute(`
        SELECT * FROM property_visits 
        WHERE (
          (scheduled_date <= ? AND DATE_ADD(scheduled_date, INTERVAL duration MINUTE) >= ?) OR
          (scheduled_date >= ? AND scheduled_date <= ?)
        )
        AND property_id = ? 
        AND status NOT IN ('cancelled', 'no_show')
        AND id != ?
      `, [
        endTime, visitStartTime, visitStartTime, endTime, propertyId, req.params.id
      ]);

      if (conflicts.length > 0) {
        return res.status(400).json({ 
          error: 'Scheduling conflict detected',
          conflicts: conflicts
        });
      }
    }

    const updates = [];
    const params = [];

    // Fields that can be updated
    const allowedFields = [
      'property_id', 'client_id', 'agent_id', 'scheduled_date', 'duration',
      'status', 'type', 'notes', 'outcome', 'reminder_sent'
    ];

    // Map frontend camelCase to database snake_case
    const fieldMapping = {
      propertyId: 'property_id',
      clientId: 'client_id',
      agentId: 'agent_id',
      scheduledDate: 'scheduled_date',
      reminderSent: 'reminder_sent'
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
      `UPDATE property_visits SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json({ message: 'Visit updated successfully' });
  } catch (error) {
    console.error('Update visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete visit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM property_visits WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Delete visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;