const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing users first
    await pool.execute('DELETE FROM users');

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('admin123', 12);
    
    await pool.execute(`
      INSERT INTO users (id, name, email, password, role, phone, is_active, created_at, updated_at) 
      VALUES (UUID(), 'Admin User', 'admin@3mconnect.com', ?, 'admin', '+212 600 000 000', true, NOW(), NOW())
    `, [hashedAdminPassword]);

    // Create agent user
    const agentPassword = await bcrypt.hash('agent123', 12);
    
    await pool.execute(`
      INSERT INTO users (id, name, email, password, role, phone, is_active, created_at, updated_at) 
      VALUES (UUID(), 'Agent User', 'agent@3mconnect.com', ?, 'agent', '+212 600 000 001', true, NOW(), NOW())
    `, [agentPassword]);

    console.log('✅ Database seeded successfully!');
    console.log('📧 Admin login: admin@3mconnect.com / admin123');
    console.log('📧 Agent login: agent@3mconnect.com / agent123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();