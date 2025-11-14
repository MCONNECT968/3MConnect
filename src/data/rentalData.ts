import {
  RentalContract,
  RentalPayment,
  RentalAlert,
  MaintenanceRequest,
  RentalStatus,
  PaymentStatus,
  PaymentMethod,
  AlertType,
  AlertPriority,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  DocumentType
} from '../types';

// Mock rental contracts
export const rentalContracts: RentalContract[] = [
  {
    id: '1',
    propertyId: '4', // Cozy Duplex
    tenantId: '3', // Ahmed Tazi
    ownerId: '2', // Fatima Benali
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    monthlyRent: 8000,
    deposit: 16000,
    status: RentalStatus.ACTIVE,
    paymentDay: 1,
    contractTerms: 'Standard residential lease agreement with 12-month term. Tenant responsible for utilities. No pets allowed.',
    specialConditions: 'Tenant has option to renew for additional year at 5% increase.',
    documents: [
      {
        id: '1',
        contractId: '1',
        type: DocumentType.CONTRACT,
        name: 'Rental_Contract_Ahmed_Tazi.pdf',
        url: '/documents/contracts/rental_contract_1.pdf',
        uploadDate: new Date('2024-01-01'),
        size: 2048000
      },
      {
        id: '2',
        contractId: '1',
        type: DocumentType.INVENTORY,
        name: 'Property_Inventory_Duplex.pdf',
        url: '/documents/inventories/inventory_1.pdf',
        uploadDate: new Date('2024-01-01'),
        size: 1024000
      }
    ],
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    propertyId: '1', // Modern Apartment
    tenantId: '5', // Youssef El Amrani
    ownerId: '2', // Fatima Benali
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
    monthlyRent: 12000,
    deposit: 24000,
    status: RentalStatus.ACTIVE,
    paymentDay: 1,
    contractTerms: 'Furnished apartment rental. Includes utilities except internet. 12-month lease.',
    specialConditions: 'Tenant responsible for maintaining furniture in good condition.',
    documents: [
      {
        id: '3',
        contractId: '2',
        type: DocumentType.CONTRACT,
        name: 'Rental_Contract_Youssef_ElAmrani.pdf',
        url: '/documents/contracts/rental_contract_2.pdf',
        uploadDate: new Date('2024-02-01'),
        size: 2048000
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '3',
    propertyId: '3', // Commercial Office
    tenantId: '1', // Mohammed Alami (business rental)
    ownerId: '4', // Sophia Mansouri
    startDate: new Date('2023-06-01'),
    endDate: new Date('2026-05-31'),
    monthlyRent: 15000,
    deposit: 45000,
    status: RentalStatus.ACTIVE,
    paymentDay: 5,
    contractTerms: 'Commercial lease for office space. 3-year term with annual rent review.',
    specialConditions: 'Tenant may make modifications with landlord approval. Rent increases capped at 3% annually.',
    documents: [
      {
        id: '4',
        contractId: '3',
        type: DocumentType.CONTRACT,
        name: 'Commercial_Lease_Mohammed_Alami.pdf',
        url: '/documents/contracts/commercial_lease_3.pdf',
        uploadDate: new Date('2023-06-01'),
        size: 3072000
      }
    ],
    createdAt: new Date('2023-05-15'),
    updatedAt: new Date('2023-06-01')
  }
];

// Mock rental payments
export const rentalPayments: RentalPayment[] = [
  // Ahmed Tazi payments (Contract 1)
  {
    id: '1',
    contractId: '1',
    amount: 8000,
    dueDate: new Date('2024-01-01'),
    paidDate: new Date('2024-01-01'),
    status: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    receiptNumber: 'REC-2024-001',
    notes: 'First month rent payment',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    contractId: '1',
    amount: 8000,
    dueDate: new Date('2024-02-01'),
    paidDate: new Date('2024-02-03'),
    status: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.CASH,
    receiptNumber: 'REC-2024-002',
    notes: 'Paid 2 days late',
    lateFee: 100,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-03')
  },
  {
    id: '3',
    contractId: '1',
    amount: 8000,
    dueDate: new Date('2024-03-01'),
    paidDate: new Date('2024-02-28'),
    status: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    receiptNumber: 'REC-2024-003',
    notes: 'Paid early',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-02-28')
  },
  {
    id: '4',
    contractId: '1',
    amount: 8000,
    dueDate: new Date('2024-04-01'),
    status: PaymentStatus.PENDING,
    notes: 'Upcoming payment',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01')
  },

  // Youssef El Amrani payments (Contract 2)
  {
    id: '5',
    contractId: '2',
    amount: 12000,
    dueDate: new Date('2024-02-01'),
    paidDate: new Date('2024-02-01'),
    status: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    receiptNumber: 'REC-2024-004',
    notes: 'First month rent payment',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '6',
    contractId: '2',
    amount: 12000,
    dueDate: new Date('2024-03-01'),
    paidDate: new Date('2024-03-01'),
    status: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    receiptNumber: 'REC-2024-005',
    notes: 'On time payment',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: '7',
    contractId: '2',
    amount: 12000,
    dueDate: new Date('2024-04-01'),
    status: PaymentStatus.PENDING,
    notes: 'Upcoming payment',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01')
  },

  // Mohammed Alami payments (Contract 3)
  {
    id: '8',
    contractId: '3',
    amount: 15000,
    dueDate: new Date('2024-01-05'),
    paidDate: new Date('2024-01-05'),
    status: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    receiptNumber: 'REC-2024-006',
    notes: 'Commercial rent payment',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: '9',
    contractId: '3',
    amount: 15000,
    dueDate: new Date('2024-02-05'),
    paidDate: new Date('2024-02-05'),
    status: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    receiptNumber: 'REC-2024-007',
    notes: 'Commercial rent payment',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05')
  },
  {
    id: '10',
    contractId: '3',
    amount: 15000,
    dueDate: new Date('2024-03-05'),
    status: PaymentStatus.LATE,
    notes: 'Payment overdue by 10 days',
    lateFee: 500,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-15')
  }
];

// Mock rental alerts
export const rentalAlerts: RentalAlert[] = [
  {
    id: '1',
    type: AlertType.PAYMENT_OVERDUE,
    contractId: '3',
    message: 'Mohammed Alami - Commercial rent payment is 10 days overdue (15,000 MAD)',
    priority: AlertPriority.HIGH,
    isRead: false,
    createdAt: new Date('2024-03-15'),
    dueDate: new Date('2024-03-05')
  },
  {
    id: '2',
    type: AlertType.PAYMENT_DUE,
    contractId: '1',
    message: 'Ahmed Tazi - Rent payment due tomorrow (8,000 MAD)',
    priority: AlertPriority.MEDIUM,
    isRead: false,
    createdAt: new Date('2024-03-31'),
    dueDate: new Date('2024-04-01')
  },
  {
    id: '3',
    type: AlertType.PAYMENT_DUE,
    contractId: '2',
    message: 'Youssef El Amrani - Rent payment due tomorrow (12,000 MAD)',
    priority: AlertPriority.MEDIUM,
    isRead: false,
    createdAt: new Date('2024-03-31'),
    dueDate: new Date('2024-04-01')
  },
  {
    id: '4',
    type: AlertType.CONTRACT_EXPIRING,
    contractId: '1',
    message: 'Ahmed Tazi - Rental contract expires in 9 months (Dec 31, 2024)',
    priority: AlertPriority.LOW,
    isRead: true,
    createdAt: new Date('2024-03-01'),
    dueDate: new Date('2024-12-31')
  },
  {
    id: '5',
    type: AlertType.MAINTENANCE_REQUIRED,
    contractId: '2',
    message: 'Youssef El Amrani - Reported heating issue in apartment',
    priority: AlertPriority.HIGH,
    isRead: false,
    createdAt: new Date('2024-03-20')
  }
];

// Mock maintenance requests
export const maintenanceRequests: MaintenanceRequest[] = [
  {
    id: '1',
    propertyId: '1',
    contractId: '2',
    tenantId: '5',
    title: 'Heating System Not Working',
    description: 'The heating system in the apartment is not working properly. Temperature is not reaching the set level.',
    category: MaintenanceCategory.HEATING,
    priority: MaintenancePriority.HIGH,
    status: MaintenanceStatus.REPORTED,
    reportedDate: new Date('2024-03-20'),
    photos: [
      'https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg'
    ],
    notes: 'Tenant reports issue started 3 days ago'
  },
  {
    id: '2',
    propertyId: '4',
    contractId: '1',
    tenantId: '3',
    title: 'Kitchen Faucet Leak',
    description: 'Kitchen faucet is leaking continuously. Water dripping from the base.',
    category: MaintenanceCategory.PLUMBING,
    priority: MaintenancePriority.MEDIUM,
    status: MaintenanceStatus.IN_PROGRESS,
    reportedDate: new Date('2024-03-15'),
    scheduledDate: new Date('2024-03-22'),
    assignedTo: 'Ahmed Plumber',
    cost: 250,
    photos: [
      'https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg'
    ],
    notes: 'Plumber scheduled for Friday morning'
  },
  {
    id: '3',
    propertyId: '3',
    contractId: '3',
    tenantId: '1',
    title: 'Office Light Fixture Replacement',
    description: 'Main office light fixture is flickering and needs replacement.',
    category: MaintenanceCategory.ELECTRICAL,
    priority: MaintenancePriority.LOW,
    status: MaintenanceStatus.COMPLETED,
    reportedDate: new Date('2024-03-10'),
    scheduledDate: new Date('2024-03-18'),
    completedDate: new Date('2024-03-18'),
    assignedTo: 'Hassan Electrician',
    cost: 180,
    photos: [],
    notes: 'Replaced with LED fixture. Work completed successfully.'
  }
];