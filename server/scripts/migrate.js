const { pool } = require('../config/database');

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'agent', 'assistant') DEFAULT 'agent',
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
  )`,
  
  // Clients table
  `CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    secondary_phone VARCHAR(50),
    address TEXT,
    role ENUM('tenant', 'owner', 'buyer') NOT NULL,
    status ENUM('active', 'inactive', 'prospect', 'converted', 'archived') DEFAULT 'prospect',
    tags JSON,
    budget DECIMAL(15,2),
    preferred_contact_method ENUM('phone', 'email', 'whatsapp', 'in_person') DEFAULT 'phone',
    notes TEXT,
    source VARCHAR(255),
    assigned_agent VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_role (role),
    INDEX idx_status (status),
    FOREIGN KEY (assigned_agent) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Properties table
  `CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    type ENUM('apartment', 'duplex', 'house', 'building', 'villa', 'premises', 'office', 'land') NOT NULL,
    condition_status ENUM('new', 'renovated', 'good_condition', 'to_renovate') NOT NULL,
    transaction_type ENUM('sale', 'rental', 'seasonal_rental') NOT NULL,
    surface INT NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status ENUM('available', 'pending', 'sold', 'rented', 'archived') DEFAULT 'available',
    description TEXT,
    features JSON,
    rooms INT DEFAULT 0,
    owner_id VARCHAR(36),
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_property_id (property_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_location (location),
    INDEX idx_price (price),
    FOREIGN KEY (owner_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Property Media table
  `CREATE TABLE IF NOT EXISTS property_media (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id VARCHAR(36) NOT NULL,
    type ENUM('photo', 'video') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_property_id (property_id),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
  )`,

  // Client needs table
  `CREATE TABLE IF NOT EXISTS client_needs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    client_id VARCHAR(36) NOT NULL,
    property_types JSON NOT NULL,
    min_surface INT NOT NULL,
    max_surface INT NOT NULL,
    min_price DECIMAL(15,2) NOT NULL,
    max_price DECIMAL(15,2) NOT NULL,
    locations JSON,
    features JSON,
    notes TEXT,
    urgency ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    timeline VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  )`,

  // Interactions table
  `CREATE TABLE IF NOT EXISTS interactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    client_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    type ENUM('call', 'appointment', 'whatsapp', 'email', 'property_viewing', 'contract_signing', 'follow_up', 'complaint', 'payment') NOT NULL,
    date TIMESTAMP NOT NULL,
    notes TEXT NOT NULL,
    outcome ENUM('successful', 'no_answer', 'interested', 'not_interested', 'follow_up_required', 'converted', 'cancelled'),
    follow_up_date TIMESTAMP NULL,
    duration INT,
    location VARCHAR(255),
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_client_id (client_id),
    INDEX idx_type (type),
    INDEX idx_date (date),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Property visits table
  `CREATE TABLE IF NOT EXISTS property_visits (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    agent_id VARCHAR(36),
    scheduled_date TIMESTAMP NOT NULL,
    duration INT DEFAULT 60,
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled') DEFAULT 'scheduled',
    type ENUM('first_viewing', 'second_viewing', 'final_inspection', 'property_evaluation', 'maintenance_check', 'handover') DEFAULT 'first_viewing',
    notes TEXT,
    outcome ENUM('interested', 'very_interested', 'not_interested', 'needs_more_time', 'wants_second_viewing', 'ready_to_proceed', 'price_negotiation'),
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_property_id (property_id),
    INDEX idx_client_id (client_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_status (status),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Rental contracts table
  `CREATE TABLE IF NOT EXISTS rental_contracts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'pending', 'expired', 'terminated', 'renewed') DEFAULT 'pending',
    payment_day INT DEFAULT 1,
    contract_terms TEXT,
    special_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_property_id (property_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES clients(id) ON DELETE CASCADE
  )`,

  // Rental documents table
  `CREATE TABLE IF NOT EXISTS rental_documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    contract_id VARCHAR(36) NOT NULL,
    type ENUM('contract', 'receipt', 'inventory', 'insurance', 'identity', 'income_proof', 'other') NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contract_id (contract_id),
    FOREIGN KEY (contract_id) REFERENCES rental_contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
  )`,

  // Rental payments table
  `CREATE TABLE IF NOT EXISTS rental_payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    contract_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    status ENUM('pending', 'paid', 'late', 'overdue', 'partial', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('cash', 'bank_transfer', 'check', 'card', 'mobile_payment'),
    receipt_number VARCHAR(100),
    notes TEXT,
    late_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_contract_id (contract_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status),
    FOREIGN KEY (contract_id) REFERENCES rental_contracts(id) ON DELETE CASCADE
  )`,

  // Rental alerts table
  `CREATE TABLE IF NOT EXISTS rental_alerts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    type ENUM('payment_due', 'payment_overdue', 'contract_expiring', 'maintenance_required', 'document_expiring', 'rent_increase') NOT NULL,
    contract_id VARCHAR(36),
    message TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    INDEX idx_contract_id (contract_id),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (contract_id) REFERENCES rental_contracts(id) ON DELETE CASCADE
  )`,

  // Maintenance requests table
  `CREATE TABLE IF NOT EXISTS maintenance_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id VARCHAR(36) NOT NULL,
    contract_id VARCHAR(36),
    tenant_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('plumbing', 'electrical', 'heating', 'appliances', 'structural', 'cleaning', 'garden', 'security', 'other') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'emergency') DEFAULT 'medium',
    status ENUM('reported', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'reported',
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_date TIMESTAMP NULL,
    completed_date TIMESTAMP NULL,
    cost DECIMAL(10,2),
    assigned_to VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_property_id (property_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_id) REFERENCES rental_contracts(id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES clients(id) ON DELETE SET NULL
  )`,

  // Maintenance photos table
  `CREATE TABLE IF NOT EXISTS maintenance_photos (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    request_id VARCHAR(36) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_request_id (request_id),
    FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE
  )`,

  // Documents table
  `CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    type ENUM('pdf', 'image', 'video', 'spreadsheet', 'document', 'other') NOT NULL,
    category VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100),
    related_entity_type ENUM('property', 'client', 'contract', 'maintenance'),
    related_entity_id VARCHAR(36),
    uploaded_by VARCHAR(36),
    is_public BOOLEAN DEFAULT false,
    tags JSON,
    description TEXT,
    download_count INT DEFAULT 0,
    version INT DEFAULT 1,
    status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_related_entity (related_entity_type, related_entity_id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
  )`
];

const runMigrations = async () => {
  try {
    console.log('🚀 Starting database migrations...');
    
    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await pool.execute(migrations[i]);
    }
    
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();