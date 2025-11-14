import React from 'react';
import { X, FileText, User, Home, Calendar, DollarSign, Download, Edit } from 'lucide-react';
import { RentalContract } from '../../types';
import { clients, properties } from '../../data/mockData';

interface RentalContractDetailsProps {
  contract: RentalContract;
  onClose: () => void;
}

const RentalContractDetails: React.FC<RentalContractDetailsProps> = ({ contract, onClose }) => {
  const property = properties.find(p => p.id === contract.propertyId);
  const tenant = clients.find(c => c.id === contract.tenantId);
  const owner = clients.find(c => c.id === contract.ownerId);

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

  const getContractDuration = () => {
    const diffTime = contract.endDate.getTime() - contract.startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    return `${months} months`;
  };

  const handleDownloadDocument = (document: any) => {
    // Simulate document download
    alert(`Downloading ${document.name}...`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-semibold">Rental Contract Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Contract Overview */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Contract Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Contract ID</p>
                <p className="text-lg font-semibold text-blue-900">{contract.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  contract.status === 'active' ? 'bg-green-100 text-green-800' :
                  contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Duration</p>
                <p className="text-lg font-semibold text-blue-900">{getContractDuration()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Monthly Rent</p>
                <p className="text-lg font-semibold text-blue-900">{formatCurrency(contract.monthlyRent)}</p>
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
              <Home size={20} />
              Property Information
            </h3>
            {property && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Property</p>
                  <p className="text-lg font-semibold text-gray-900">{property.title}</p>
                  <p className="text-gray-600">{property.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Details</p>
                  <p className="text-gray-600">{property.surface} m² • {property.type}</p>
                  <p className="text-gray-600">{property.rooms} rooms</p>
                </div>
              </div>
            )}
          </div>

          {/* Parties Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenant */}
            <div className="bg-amber-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <User size={20} />
                Tenant
              </h3>
              {tenant && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-lg font-semibold text-gray-900">{tenant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact</p>
                    <p className="text-gray-600">{tenant.email}</p>
                    <p className="text-gray-600">{tenant.phone}</p>
                  </div>
                  {tenant.address && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address</p>
                      <p className="text-gray-600">{tenant.address}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Owner */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <User size={20} />
                Owner
              </h3>
              {owner && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-lg font-semibold text-gray-900">{owner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact</p>
                    <p className="text-gray-600">{owner.email}</p>
                    <p className="text-gray-600">{owner.phone}</p>
                  </div>
                  {owner.address && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address</p>
                      <p className="text-gray-600">{owner.address}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contract Terms */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Contract Terms
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Start Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(contract.startDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">End Date</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(contract.endDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Security Deposit</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(contract.deposit)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Payment Due</p>
                <p className="text-lg font-semibold text-gray-900">{contract.paymentDay}th of each month</p>
              </div>
            </div>

            {contract.contractTerms && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Contract Terms</p>
                <div className="bg-white p-4 rounded border">
                  <p className="text-gray-700">{contract.contractTerms}</p>
                </div>
              </div>
            )}

            {contract.specialConditions && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Special Conditions</p>
                <div className="bg-white p-4 rounded border">
                  <p className="text-gray-700">{contract.specialConditions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          {contract.documents.length > 0 && (
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Contract Documents
              </h3>
              <div className="space-y-3">
                {contract.documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between bg-white p-4 rounded border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded">
                        <FileText size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{document.name}</p>
                        <p className="text-sm text-gray-600">
                          {document.type.replace('_', ' ').charAt(0).toUpperCase() + document.type.replace('_', ' ').slice(1)} • 
                          {formatDate(document.uploadDate)} • 
                          {(document.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(document)}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contract Metadata */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Contract History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Created</p>
                <p className="text-gray-600">{formatDate(contract.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Last Updated</p>
                <p className="text-gray-600">{formatDate(contract.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalContractDetails;