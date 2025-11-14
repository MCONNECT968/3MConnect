export interface Property {
  id: string;
  propertyId: string; // Manual property ID
  title: string;
  type: PropertyType;
  condition: PropertyCondition;
  transactionType: TransactionType;
  surface: number;
  price: number;
  location: string;
  status: PropertyStatus;
  description: string;
  features: string[];
  photos: string[];
  videos: string[];
  rooms?: number;
  ownerId?: string; // Connected client ID
  createdAt: Date;
  updatedAt: Date;
}

export enum PropertyType {
  APARTMENT = 'apartment',
  DUPLEX = 'duplex',
  HOUSE = 'house',
  BUILDING = 'building',
  VILLA = 'villa',
  PREMISES = 'premises',
  OFFICE = 'office',
  LAND = 'land'
}

export enum PropertyCondition {
  NEW = 'new',
  RENOVATED = 'renovated',
  GOOD_CONDITION = 'good_condition',
  TO_RENOVATE = 'to_renovate'
}

export enum TransactionType {
  SALE = 'sale',
  RENTAL = 'rental',
  SEASONAL_RENTAL = 'seasonal_rental'
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  PENDING = 'pending',
  SOLD = 'sold',
  RENTED = 'rented',
  ARCHIVED = 'archived'
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  address?: string;
  role: ClientRole;
  status: ClientStatus;
  tags: string[];
  interactions: Interaction[];
  needs?: ClientNeeds;
  properties?: string[]; // Property IDs owned by this client
  budget?: number;
  preferredContactMethod: ContactMethod;
  notes?: string;
  source?: string; // How they found us
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ClientRole {
  TENANT = 'tenant',
  OWNER = 'owner',
  BUYER = 'buyer'
}

export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROSPECT = 'prospect',
  CONVERTED = 'converted',
  ARCHIVED = 'archived'
}

export enum ContactMethod {
  PHONE = 'phone',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  IN_PERSON = 'in_person'
}

export interface Interaction {
  id: string;
  type: InteractionType;
  date: Date;
  notes: string;
  outcome?: InteractionOutcome;
  followUpDate?: Date;
  duration?: number; // in minutes
  location?: string;
  attachments?: string[];
}

export enum InteractionType {
  CALL = 'call',
  APPOINTMENT = 'appointment',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  PROPERTY_VIEWING = 'property_viewing',
  CONTRACT_SIGNING = 'contract_signing',
  FOLLOW_UP = 'follow_up',
  COMPLAINT = 'complaint',
  PAYMENT = 'payment'
}

export enum InteractionOutcome {
  SUCCESSFUL = 'successful',
  NO_ANSWER = 'no_answer',
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not_interested',
  FOLLOW_UP_REQUIRED = 'follow_up_required',
  CONVERTED = 'converted',
  CANCELLED = 'cancelled'
}

export interface ClientNeeds {
  id: string;
  propertyType: PropertyType[];
  minSurface: number;
  maxSurface: number;
  minPrice: number;
  maxPrice: number;
  locations: string[];
  features: string[];
  notes: string;
  urgency: UrgencyLevel;
  timeline?: string;
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  password: string;
}

export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  ASSISTANT = 'assistant'
}

export interface DashboardMetrics {
  activeListings: number;
  activeRentals: number;
  newClients: number;
  pendingTasks: number;
}

export enum SortOption {
  DATE_CREATED_ASC = 'date_created_asc',
  DATE_CREATED_DESC = 'date_created_desc',
  TYPE = 'type',
  PRICE_LOW_HIGH = 'price_low_high',
  PRICE_HIGH_LOW = 'price_high_low',
  SURFACE = 'surface'
}

export enum ClientSortOption {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  DATE_CREATED_ASC = 'date_created_asc',
  DATE_CREATED_DESC = 'date_created_desc',
  LAST_INTERACTION = 'last_interaction',
  ROLE = 'role',
  STATUS = 'status'
}

export enum UserSortOption {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  DATE_CREATED_ASC = 'date_created_asc',
  DATE_CREATED_DESC = 'date_created_desc',
  LAST_LOGIN = 'last_login',
  ROLE = 'role'
}

// Calendar and Visit Types
export interface PropertyVisit {
  id: string;
  propertyId: string;
  clientId: string;
  agentId?: string;
  scheduledDate: Date;
  duration: number; // in minutes
  status: VisitStatus;
  type: VisitType;
  notes?: string;
  outcome?: VisitOutcome;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}

export enum VisitType {
  FIRST_VIEWING = 'first_viewing',
  SECOND_VIEWING = 'second_viewing',
  FINAL_INSPECTION = 'final_inspection',
  PROPERTY_EVALUATION = 'property_evaluation',
  MAINTENANCE_CHECK = 'maintenance_check',
  HANDOVER = 'handover'
}

export enum VisitOutcome {
  INTERESTED = 'interested',
  VERY_INTERESTED = 'very_interested',
  NOT_INTERESTED = 'not_interested',
  NEEDS_MORE_TIME = 'needs_more_time',
  WANTS_SECOND_VIEWING = 'wants_second_viewing',
  READY_TO_PROCEED = 'ready_to_proceed',
  PRICE_NEGOTIATION = 'price_negotiation'
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  location: string;
  type: 'visit' | 'appointment' | 'meeting' | 'reminder';
  relatedVisitId?: string;
  relatedClientId?: string;
  relatedPropertyId?: string;
}

// Rental Management Types
export interface RentalContract {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  status: RentalStatus;
  paymentDay: number; // Day of month when rent is due
  contractTerms: string;
  specialConditions?: string;
  documents: RentalDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export enum RentalStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed'
}

export interface RentalPayment {
  id: string;
  contractId: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  notes?: string;
  lateFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  LATE = 'late',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  CARD = 'card',
  MOBILE_PAYMENT = 'mobile_payment'
}

export interface RentalDocument {
  id: string;
  contractId: string;
  type: DocumentType;
  name: string;
  url: string;
  uploadDate: Date;
  size: number;
}

export enum DocumentType {
  CONTRACT = 'contract',
  RECEIPT = 'receipt',
  INVENTORY = 'inventory',
  INSURANCE = 'insurance',
  IDENTITY = 'identity',
  INCOME_PROOF = 'income_proof',
  OTHER = 'other'
}

export interface RentalAlert {
  id: string;
  type: AlertType;
  contractId: string;
  message: string;
  priority: AlertPriority;
  isRead: boolean;
  createdAt: Date;
  dueDate?: Date;
}

export enum AlertType {
  PAYMENT_DUE = 'payment_due',
  PAYMENT_OVERDUE = 'payment_overdue',
  CONTRACT_EXPIRING = 'contract_expiring',
  MAINTENANCE_REQUIRED = 'maintenance_required',
  DOCUMENT_EXPIRING = 'document_expiring',
  RENT_INCREASE = 'rent_increase'
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  contractId?: string;
  tenantId?: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  cost?: number;
  assignedTo?: string;
  photos: string[];
  notes?: string;
}

export enum MaintenanceCategory {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HEATING = 'heating',
  APPLIANCES = 'appliances',
  STRUCTURAL = 'structural',
  CLEANING = 'cleaning',
  GARDEN = 'garden',
  SECURITY = 'security',
  OTHER = 'other'
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency'
}

export enum MaintenanceStatus {
  REPORTED = 'reported',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}