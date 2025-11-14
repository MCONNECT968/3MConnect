// Utility functions for storing and retrieving data from localStorage

// Date reviver function to convert ISO date strings back to Date objects
const dateReviver = (key: string, value: any): any => {
  // Check if the value is a string that looks like an ISO date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
    return new Date(value);
  }
  return value;
};

// Generic function to get data from localStorage
export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item, dateReviver) : defaultValue;
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Generic function to save data to localStorage
export const saveToLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Storage keys
export const STORAGE_KEYS = {
  PROPERTIES: 'crm_properties',
  CLIENTS: 'crm_clients',
  USERS: 'crm_users',
  RENTAL_CONTRACTS: 'crm_rental_contracts',
  RENTAL_PAYMENTS: 'crm_rental_payments',
  RENTAL_ALERTS: 'crm_rental_alerts',
  MAINTENANCE_REQUESTS: 'crm_maintenance_requests',
  PROPERTY_VISITS: 'crm_property_visits',
  DOCUMENTS: 'crm_documents'
};