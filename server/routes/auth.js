const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user from database
    const [users] = await pool.execute(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Your account is inactive. Please contact an administrator.' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    delete user.password;

    res.json({
      token,
      user,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new user (admin only)
router.post('/register', [
  authenticateToken,
  requireRole(['admin']),
  body('name').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'agent', 'assistant'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, phone } = req.body;

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const [result] = await pool.execute(`
      INSERT INTO users (name, email, password, role, phone, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())
    `, [name, email, hashedPassword, role, phone]);

    res.status(201).json({
      id: result.insertId,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, phone, avatar_url, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
router.get('/users', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, phone, avatar_url, is_active, last_login, created_at, updated_at FROM users'
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, phone, avatar_url, is_active, last_login, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only or self)
router.put('/users/:id', [
  authenticateToken,
  body('name').optional().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'agent', 'assistant'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin or updating their own profile
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // If not admin, can't change role
    if (req.user.role !== 'admin' && req.body.role) {
      return res.status(403).json({ error: 'Cannot change role' });
    }

    const { name, email, role, phone, isActive } = req.body;

    // Check if email already exists
    if (email) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.params.id]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }

    if (role && req.user.role === 'admin') {
      updates.push('role = ?');
      params.push(role);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }

    if (isActive !== undefined && req.user.role === 'admin') {
      updates.push('is_active = ?');
      params.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const [result] = await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status (admin only)
router.put('/users/:id/status', [
  authenticateToken,
  requireRole(['admin']),
  body('isActive').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deactivating the last active admin
    if (!isActive && users[0].role === 'admin') {
      const [activeAdmins] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND is_active = true AND id != ?',
        [req.params.id]
      );

      if (activeAdmins[0].count === 0) {
        return res.status(400).json({ error: 'Cannot deactivate the last active admin' });
      }
    }

    const [result] = await pool.execute(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [isActive, req.params.id]
    );

    res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting the last admin
    if (users[0].role === 'admin') {
      const [admins] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND id != ?',
        [req.params.id]
      );

      if (admins[0].count === 0) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', [
  authenticateToken,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset user password (admin only)
router.post('/reset-password/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Hash temporary password
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, req.params.id]
    );

    // In a real app, send email with temporary password
    // For now, just return it in the response (for development only)
    res.json({ 
      message: 'Password reset successfully',
      tempPassword: tempPassword // Remove this in production!
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;