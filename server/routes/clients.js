const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all clients
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM clients WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    // Convert limit and offset to integers and ensure they're valid numbers
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    console.log('Executing query:', query, 'with params:', params);
    const [clients] = await pool.execute(query, params);

    // Parse JSON fields and get interactions
    const formattedClients = await Promise.all(clients.map(async (client) => {
      try {
        // Get interactions
        const [interactions] = await pool.execute(
          'SELECT * FROM interactions WHERE client_id = ? ORDER BY date DESC',
          [client.id]
        );

        // Get client needs
        const [needs] = await pool.execute(
          'SELECT * FROM client_needs WHERE client_id = ?',
          [client.id]
        );

        return {
          ...client,
          tags: client.tags ? JSON.parse(client.tags) : [],
          interactions: interactions.map(interaction => ({
            ...interaction,
            attachments: interaction.attachments ? JSON.parse(interaction.attachments) : []
          })),
          needs: needs.length > 0 ? {
            ...needs[0],
            property_types: needs[0].property_types ? JSON.parse(needs[0].property_types) : [],
            locations: needs[0].locations ? JSON.parse(needs[0].locations) : [],
            features: needs[0].features ? JSON.parse(needs[0].features) : []
          } : null
        };
      } catch (parseError) {
        console.error('Error parsing client data:', parseError, client);
        return {
          ...client,
          tags: [],
          interactions: [],
          needs: null
        };
      }
    }));

    res.json(formattedClients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create client
router.post('/', [
  authenticateToken,
  body('name').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty(),
  body('role').isIn(['tenant', 'owner', 'buyer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, email, phone, secondary_phone, address, role, status = 'prospect',
      tags = [], budget, preferred_contact_method = 'phone', notes, source,
      assigned_agent, needs
    } = req.body;

    console.log('Creating client with data:', { name, email, phone, role, tags });

    // Insert client
    const [result] = await pool.execute(`
      INSERT INTO clients (
        name, email, phone, secondary_phone, address, role, status,
        tags, budget, preferred_contact_method, notes, source, assigned_agent,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name, email, phone, secondary_phone, address, role, status,
      JSON.stringify(Array.isArray(tags) ? tags : []), budget, preferred_contact_method, notes, source, assigned_agent
    ]);

    const clientId = result.insertId;
    console.log('Client created with ID:', clientId);

    // Insert client needs if provided
    if (needs && (role === 'buyer' || role === 'tenant')) {
      console.log('Inserting client needs:', needs);
      
      // Ensure property_types is an array and properly stringified
      const propertyTypes = Array.isArray(needs.property_types || needs.propertyType) 
        ? needs.property_types || needs.propertyType 
        : [];
        
      // Ensure locations is an array and properly stringified
      const locations = Array.isArray(needs.locations) ? needs.locations : [];
      
      // Ensure features is an array and properly stringified
      const features = Array.isArray(needs.features) ? needs.features : [];
      
      await pool.execute(`
        INSERT INTO client_needs (
          client_id, property_types, min_surface, max_surface, min_price, max_price,
          locations, features, notes, urgency, timeline, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        clientId, 
        JSON.stringify(propertyTypes), 
        needs.min_surface || needs.minSurface || 0, 
        needs.max_surface || needs.maxSurface || 0,
        needs.min_price || needs.minPrice || 0, 
        needs.max_price || needs.maxPrice || 0, 
        JSON.stringify(locations),
        JSON.stringify(features), 
        needs.notes || '', 
        needs.urgency || 'medium', 
        needs.timeline || ''
      ]);
      
      console.log('Client needs inserted successfully');
    }

    res.status(201).json({
      id: clientId,
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Create client error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add interaction
router.post('/:id/interactions', [
  authenticateToken,
  body('type').isIn(['call', 'appointment', 'whatsapp', 'email', 'property_viewing', 'contract_signing', 'follow_up', 'complaint', 'payment']),
  body('notes').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      type, notes, outcome, follow_up_date, duration, location, attachments = []
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO interactions (
        client_id, user_id, type, date, notes, outcome, follow_up_date,
        duration, location, attachments, created_at
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, NOW())
    `, [
      req.params.id, req.user.id, type, notes, outcome,
      follow_up_date, duration, location, JSON.stringify(attachments)
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Interaction added successfully'
    });
  } catch (error) {
    console.error('Add interaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get client by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [clients] = await pool.execute(
      'SELECT * FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = clients[0];

    // Get interactions
    const [interactions] = await pool.execute(
      'SELECT * FROM interactions WHERE client_id = ? ORDER BY date DESC',
      [client.id]
    );

    // Get client needs
    const [needs] = await pool.execute(
      'SELECT * FROM client_needs WHERE client_id = ?',
      [client.id]
    );

    // Format response
    const formattedClient = {
      ...client,
      tags: client.tags ? JSON.parse(client.tags) : [],
      interactions: interactions.map(interaction => ({
        ...interaction,
        attachments: interaction.attachments ? JSON.parse(interaction.attachments) : []
      })),
      needs: needs.length > 0 ? {
        ...needs[0],
        property_types: needs[0].property_types ? JSON.parse(needs[0].property_types) : [],
        locations: needs[0].locations ? JSON.parse(needs[0].locations) : [],
        features: needs[0].features ? JSON.parse(needs[0].features) : []
      } : null
    };

    res.json(formattedClient);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update client
router.put('/:id', [
  authenticateToken,
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['tenant', 'owner', 'buyer']),
  body('status').optional().isIn(['active', 'inactive', 'prospect', 'converted', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = [];
    const params = [];

    Object.keys(req.body).forEach(key => {
      if (key === 'tags') {
        updates.push(`${key} = ?`);
        params.push(JSON.stringify(req.body[key]));
      } else if (key !== 'needs' && req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const [result] = await pool.execute(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Update client needs if provided
    if (req.body.needs) {
      const { needs } = req.body;
      
      // Check if needs already exist
      const [existingNeeds] = await pool.execute(
        'SELECT id FROM client_needs WHERE client_id = ?',
        [req.params.id]
      );

      // Ensure property_types is an array and properly stringified
      const propertyTypes = Array.isArray(needs.property_types || needs.propertyType) 
        ? needs.property_types || needs.propertyType 
        : [];
        
      // Ensure locations is an array and properly stringified
      const locations = Array.isArray(needs.locations) ? needs.locations : [];
      
      // Ensure features is an array and properly stringified
      const features = Array.isArray(needs.features) ? needs.features : [];

      if (existingNeeds.length > 0) {
        // Update existing needs
        await pool.execute(`
          UPDATE client_needs SET
            property_types = ?,
            min_surface = ?,
            max_surface = ?,
            min_price = ?,
            max_price = ?,
            locations = ?,
            features = ?,
            notes = ?,
            urgency = ?,
            timeline = ?,
            updated_at = NOW()
          WHERE client_id = ?
        `, [
          JSON.stringify(propertyTypes),
          needs.min_surface || needs.minSurface || 0,
          needs.max_surface || needs.maxSurface || 0,
          needs.min_price || needs.minPrice || 0,
          needs.max_price || needs.maxPrice || 0,
          JSON.stringify(locations),
          JSON.stringify(features),
          needs.notes || '',
          needs.urgency || 'medium',
          needs.timeline || '',
          req.params.id
        ]);
      } else {
        // Insert new needs
        await pool.execute(`
          INSERT INTO client_needs (
            client_id, property_types, min_surface, max_surface, min_price, max_price,
            locations, features, notes, urgency, timeline, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          req.params.id,
          JSON.stringify(propertyTypes),
          needs.min_surface || needs.minSurface || 0,
          needs.max_surface || needs.maxSurface || 0,
          needs.min_price || needs.minPrice || 0,
          needs.max_price || needs.maxPrice || 0,
          JSON.stringify(locations),
          JSON.stringify(features),
          needs.notes || '',
          needs.urgency || 'medium',
          needs.timeline || ''
        ]);
      }
    }

    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Update client error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete client
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Deleting client with ID:', req.params.id);
    
    // Delete client needs
    await pool.execute(
      'DELETE FROM client_needs WHERE client_id = ?',
      [req.params.id]
    );

    // Delete client interactions
    await pool.execute(
      'DELETE FROM interactions WHERE client_id = ?',
      [req.params.id]
    );

    // Delete client
    const [result] = await pool.execute(
      'DELETE FROM clients WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      console.log('Client not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Client not found' });
    }

    console.log('Client deleted successfully with ID:', req.params.id);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;