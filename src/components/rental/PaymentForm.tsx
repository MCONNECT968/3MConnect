import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Receipt } from 'lucide-react';
import { RentalPayment, PaymentStatus, PaymentMethod, RentalContract, Client, Property } from '../../types';
import useLocalStorage from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/localStorage';

interface PaymentFormProps {
  onSubmit: (data: Partial<RentalPayment>) => void;
  onClose: () => void;
  initialData?: Partial<RentalPayment>;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [rentalContracts, setRentalContracts] = useLocalStorage<RentalContract[]>(STORAGE_KEYS.RENTAL_CONTRACTS, []);
  const [clients, setClients] = useLocalStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
  const [properties, setProperties] = useLocalStorage<Property[]>(STORAGE_KEYS.PROPERTIES, []);
  
  const [formData, setFormData] = useState<Partial<RentalPayment>>(
    initialData || {
      contractId: '',
      amount: 0,
      dueDate: new Date(),
      paidDate: undefined,
      status: PaymentStatus.PENDING,
      paymentMethod: undefined,
      receiptNumber: '',
      notes: '',
      lateFee: 0,
    }
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'dueDate' || name === 'paidDate') {
      setFormData({
        ...formData,
        [name]: value ? new Date(value) : undefined,
      });
    } else if (name === 'amount' || name === 'lateFee') {
      setFormData({
        ...formData,
        [name]: Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.contractId || !formData.amount || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Auto-generate receipt number if payment is marked as paid
    if (formData.status === PaymentStatus.PAID && !formData.receiptNumber) {
      const receiptNumber = `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      formData.receiptNumber = receiptNumber;
    }

    onSubmit(formData);
  };

  const getSelectedContract = () => {
    return rentalContracts.find(c => c.id === formData.contractId);
  };

  const getTenantInfo = () => {
    const contract = getSelectedContract();
    if (!contract) return null;
    return clients.find(c => c.id === contract.tenantId);
  };

  const getPropertyInfo = () => {
    const contract = getSelectedContract();
    if (!contract) return null;
    return properties.find(p => p.id === contract.propertyId);
  };

  const formatDateForInput = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  };

  const generateReceiptNumber = () => {
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    setFormData({
      ...formData,
      receiptNumber,
    });
  };

  const setMonthlyRent = () => {
    const contract = getSelectedContract();
    if (contract) {
      setFormData({
        ...formData,
        amount: contract.monthlyRent,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Payment' : 'Record New Payment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contract Selection */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Receipt size={20} />
              Contract Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Rental Contract *
              </label>
              {rentalContracts.length === 0 ? (
                <div className="flex flex-col gap-2">
                  <select
                    name="contractId"
                    value={formData.contractId}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">No contracts available</option>
                  </select>
                  <a 
                    href="/rental-management" 
                    target="_blank" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Create a rental contract first
                  </a>
                </div>
              ) : (
                <select
                  name="contractId"
                  value={formData.contractId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a contract...</option>
                  {rentalContracts.map((contract) => {
                    const tenant = clients.find(c => c.id === contract.tenantId);
                    const property = properties.find(p => p.id === contract.propertyId);
                    return (
                      <option key={contract.id} value={contract.id}>
                        {tenant?.name || 'Unknown'} - {property?.title || 'Unknown'} ({contract.monthlyRent.toLocaleString()} MAD/month)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {getSelectedContract() && (
              <div className="mt-4 p-4 bg-white rounded border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Tenant</p>
                    <p className="text-gray-600">{getTenantInfo()?.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Property</p>
                    <p className="text-gray-600">{getPropertyInfo()?.title}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Monthly Rent</p>
                    <p className="text-gray-600">{getSelectedContract()!.monthlyRent.toLocaleString()} MAD</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Payment Due</p>
                    <p className="text-gray-600">{getSelectedContract()!.paymentDay}th of each month</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={setMonthlyRent}
                  className="mt-3 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Use Monthly Rent Amount
                </button>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} />
              Payment Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (MAD) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate ? formatDateForInput(formData.dueDate) : ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {Object.values(PaymentStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {formData.status === PaymentStatus.PAID && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid Date
                  </label>
                  <input
                    type="date"
                    name="paidDate"
                    value={formData.paidDate ? formatDateForInput(formData.paidDate) : ''}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {formData.status === PaymentStatus.PAID && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select method...</option>
                    {Object.values(PaymentMethod).map((method) => (
                      <option key={method} value={method}>
                        {method.replace('_', ' ').charAt(0).toUpperCase() + method.replace('_', ' ').slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.status === PaymentStatus.PAID && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="receiptNumber"
                      value={formData.receiptNumber || ''}
                      onChange={handleInputChange}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter receipt number"
                    />
                    <button
                      type="button"
                      onClick={generateReceiptNumber}
                      className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Late Fee (MAD)
                </label>
                <input
                  type="number"
                  name="lateFee"
                  value={formData.lateFee}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this payment..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {initialData ? 'Update Payment' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;