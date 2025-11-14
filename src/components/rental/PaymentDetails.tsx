import React from 'react';
import { X, DollarSign, Calendar, Receipt, Download } from 'lucide-react';
import { RentalPayment } from '../../types';
import { rentalContracts } from '../../data/rentalData';
import { clients, properties } from '../../data/mockData';

interface PaymentDetailsProps {
  payment: RentalPayment;
  onClose: () => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ payment, onClose }) => {
  const contract = rentalContracts.find(c => c.id === payment.contractId);
  const tenant = contract ? clients.find(c => c.id === contract.tenantId) : null;
  const property = contract ? properties.find(p => p.id === contract.propertyId) : null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadReceipt = () => {
    alert(`Downloading receipt ${payment.receiptNumber || payment.id}...`);
  };

  const handleGenerateReceipt = () => {
    alert('Generating new receipt...');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold">Payment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Overview */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
              <DollarSign size={20} />
              Payment Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Amount</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(payment.amount)}</p>
                {payment.lateFee && payment.lateFee > 0 && (
                  <p className="text-sm text-red-600">+ {formatCurrency(payment.lateFee)} late fee</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Property & Tenant Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Property</h3>
              {property && (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{property.title}</p>
                  <p className="text-gray-600">{property.location}</p>
                  <p className="text-gray-600">{property.surface} m² • {property.type}</p>
                </div>
              )}
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Tenant</h3>
              {tenant && (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{tenant.name}</p>
                  <p className="text-gray-600">{tenant.email}</p>
                  <p className="text-gray-600">{tenant.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Payment Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Due Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(payment.dueDate)}</p>
              </div>
              {payment.paidDate && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Paid Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(payment.paidDate)}</p>
                </div>
              )}
              {payment.paymentMethod && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Method</p>
                  <p className="text-gray-900 capitalize">{payment.paymentMethod.replace('_', ' ')}</p>
                </div>
              )}
              {payment.receiptNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Receipt Number</p>
                  <p className="text-gray-900">{payment.receiptNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="bg-amber-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-amber-900 mb-3">Notes</h3>
              <p className="text-gray-700">{payment.notes}</p>
            </div>
          )}

          {/* Receipt Actions */}
          {payment.status === 'paid' && (
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <Receipt size={20} />
                Receipt Actions
              </h3>
              <div className="flex gap-3">
                {payment.receiptNumber ? (
                  <button
                    onClick={handleDownloadReceipt}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    <Download size={16} />
                    Download Receipt
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateReceipt}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <Receipt size={16} />
                    Generate Receipt
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Created</p>
                <p className="text-gray-600">{formatDate(payment.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Last Updated</p>
                <p className="text-gray-600">{formatDate(payment.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;