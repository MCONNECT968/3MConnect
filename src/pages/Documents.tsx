import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowDownUp, FileText, Download, Upload, Eye, Edit, Trash2, Share2, Folder, File, Image, Video, Archive, Calendar, User, Building, Tag, Star, Clock, CheckCircle, AlertCircle, FolderOpen, FileImage, FileVideo, File as FilePdf, FileSpreadsheet, FileCode, ExternalLink, Copy, Send, Mail, MessageCircle, Phone } from 'lucide-react';
import { clients, properties } from '../data/mockData';
import { rentalContracts } from '../data/rentalData';
import api from '../config/api';
import { useNotifications } from '../contexts/NotificationContext';

// Document Types
interface Document {
  id: string;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  size: number;
  url: string;
  uploadDate: Date;
  lastModified: Date;
  uploadedBy: string;
  relatedEntityType?: 'property' | 'client' | 'contract' | 'maintenance';
  relatedEntityId?: string;
  tags: string[];
  description?: string;
  isPublic: boolean;
  downloadCount: number;
  version: number;
  status: 'active' | 'archived' | 'deleted';
  expiryDate?: Date;
}

enum DocumentType {
  PDF = 'pdf',
  IMAGE = 'image',
  VIDEO = 'video',
  SPREADSHEET = 'spreadsheet',
  DOCUMENT = 'document',
  OTHER = 'other'
}

enum DocumentCategory {
  CONTRACT = 'contract',
  RECEIPT = 'receipt',
  INVENTORY = 'inventory',
  INSURANCE = 'insurance',
  IDENTITY = 'identity',
  INCOME_PROOF = 'income_proof',
  PROPERTY_PHOTOS = 'property_photos',
  MAINTENANCE = 'maintenance',
  LEGAL = 'legal',
  MARKETING = 'marketing',
  OTHER = 'other'
}

// Folder Interface
interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  createdDate: Date;
  documentCount: number;
  color: string;
  description?: string;
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Rental_Contract_Ahmed_Tazi.pdf',
      type: DocumentType.PDF,
      category: DocumentCategory.CONTRACT,
      size: 2048000,
      url: '/documents/contracts/rental_contract_1.pdf',
      uploadDate: new Date('2024-01-01'),
      lastModified: new Date('2024-01-01'),
      uploadedBy: 'Admin',
      relatedEntityType: 'contract',
      relatedEntityId: '1',
      tags: ['rental', 'contract', 'ahmed-tazi'],
      description: 'Annual rental contract for duplex property',
      isPublic: false,
      downloadCount: 5,
      version: 1,
      status: 'active'
    },
    {
      id: '2',
      name: 'Property_Photos_Modern_Apartment.zip',
      type: DocumentType.OTHER,
      category: DocumentCategory.PROPERTY_PHOTOS,
      size: 15728640,
      url: '/documents/photos/property_photos_1.zip',
      uploadDate: new Date('2024-01-15'),
      lastModified: new Date('2024-01-20'),
      uploadedBy: 'Agent Smith',
      relatedEntityType: 'property',
      relatedEntityId: '1',
      tags: ['photos', 'apartment', 'marketing'],
      description: 'High-resolution photos for property listing',
      isPublic: true,
      downloadCount: 23,
      version: 2,
      status: 'active'
    },
    {
      id: '3',
      name: 'Insurance_Policy_Villa_Rabat.pdf',
      type: DocumentType.PDF,
      category: DocumentCategory.INSURANCE,
      size: 1024000,
      url: '/documents/insurance/insurance_villa_2.pdf',
      uploadDate: new Date('2024-02-10'),
      lastModified: new Date('2024-02-10'),
      uploadedBy: 'Admin',
      relatedEntityType: 'property',
      relatedEntityId: '2',
      tags: ['insurance', 'villa', 'policy'],
      description: 'Property insurance policy documentation',
      isPublic: false,
      downloadCount: 3,
      version: 1,
      status: 'active',
      expiryDate: new Date('2025-02-10')
    },
    {
      id: '4',
      name: 'Maintenance_Report_March_2024.pdf',
      type: DocumentType.PDF,
      category: DocumentCategory.MAINTENANCE,
      size: 512000,
      url: '/documents/maintenance/report_march_2024.pdf',
      uploadDate: new Date('2024-03-31'),
      lastModified: new Date('2024-03-31'),
      uploadedBy: 'Maintenance Team',
      tags: ['maintenance', 'report', 'march-2024'],
      description: 'Monthly maintenance activities report',
      isPublic: false,
      downloadCount: 8,
      version: 1,
      status: 'active'
    }
  ]);

  const [folders] = useState<DocumentFolder[]>([
    {
      id: '1',
      name: 'Contracts',
      createdDate: new Date('2024-01-01'),
      documentCount: 12,
      color: 'blue',
      description: 'All rental and sale contracts'
    },
    {
      id: '2',
      name: 'Property Photos',
      createdDate: new Date('2024-01-01'),
      documentCount: 45,
      color: 'green',
      description: 'Marketing photos and property images'
    },
    {
      id: '3',
      name: 'Legal Documents',
      createdDate: new Date('2024-01-01'),
      documentCount: 8,
      color: 'red',
      description: 'Legal documents and certificates'
    },
    {
      id: '4',
      name: 'Insurance',
      createdDate: new Date('2024-01-01'),
      documentCount: 6,
      color: 'purple',
      description: 'Insurance policies and claims'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    status: '',
    relatedEntity: '',
    uploadedBy: '',
    dateRange: '',
    size: '',
  });
  const { success, error } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    type: DocumentType.PDF,
    category: DocumentCategory.OTHER,
    description: '',
    tags: '',
    isPublic: false,
    relatedEntityType: '',
    relatedEntityId: ''
  });

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/documents');
        if (response.data) {
          // Convert dates to Date objects
          const formattedDocuments = response.data.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            category: doc.category,
            size: doc.file_size,
            url: doc.file_path,
            uploadDate: new Date(doc.created_at),
            lastModified: new Date(doc.updated_at),
            uploadedBy: doc.uploaded_by_name || doc.uploaded_by,
            relatedEntityType: doc.related_entity_type,
            relatedEntityId: doc.related_entity_id,
            tags: doc.tags || [],
            description: doc.description,
            isPublic: doc.is_public === 1,
            downloadCount: doc.download_count || 0,
            version: doc.version || 1,
            status: doc.status || 'active',
            expiryDate: doc.expiry_date ? new Date(doc.expiry_date) : undefined
          }));
          setDocuments(formattedDocuments);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        // Keep using mock data
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleUploadFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setUploadFormData({
        ...uploadFormData,
        [name]: checkbox.checked
      });
    } else {
      setUploadFormData({
        ...uploadFormData,
        [name]: value
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
      
      // Auto-set name if not already set
      if (!uploadFormData.name) {
        setUploadFormData({
          ...uploadFormData,
          name: e.target.files[0].name
        });
      }
      
      // Auto-detect type
      const fileType = e.target.files[0].type;
      let docType = DocumentType.OTHER;
      
      if (fileType.includes('pdf')) {
        docType = DocumentType.PDF;
      } else if (fileType.includes('image')) {
        docType = DocumentType.IMAGE;
      } else if (fileType.includes('video')) {
        docType = DocumentType.VIDEO;
      } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
        docType = DocumentType.SPREADSHEET;
      } else if (fileType.includes('document') || fileType.includes('word')) {
        docType = DocumentType.DOCUMENT;
      }
      
      setUploadFormData({
        ...uploadFormData,
        type: docType
      });
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      error('Upload Error', 'Please select a file to upload');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('name', uploadFormData.name);
      formData.append('type', uploadFormData.type);
      formData.append('category', uploadFormData.category);
      formData.append('description', uploadFormData.description || '');
      formData.append('isPublic', uploadFormData.isPublic ? 'true' : 'false');
      
      // Parse tags
      const tags = uploadFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      formData.append('tags', JSON.stringify(tags));
      
      if (uploadFormData.relatedEntityType && uploadFormData.relatedEntityId) {
        formData.append('relatedEntityType', uploadFormData.relatedEntityType);
        formData.append('relatedEntityId', uploadFormData.relatedEntityId);
      }
      
      // Try to upload via API
      let newDocId;
      try {
        const response = await api.post('/documents', formData);
        newDocId = response.data.document.id;
        
        // Add the new document to state
        const newDocument: Document = {
          id: newDocId,
          name: uploadFormData.name,
          type: uploadFormData.type,
          category: uploadFormData.category,
          size: uploadFile.size,
          url: response.data.document.file_path,
          uploadDate: new Date(),
          lastModified: new Date(),
          uploadedBy: 'Current User',
          relatedEntityType: uploadFormData.relatedEntityType as any,
          relatedEntityId: uploadFormData.relatedEntityId,
          tags: tags,
          description: uploadFormData.description,
          isPublic: uploadFormData.isPublic,
          downloadCount: 0,
          version: 1,
          status: 'active'
        };
        
        setDocuments([newDocument, ...documents]);
      } catch (apiError) {
        console.warn('API document upload failed:', apiError);
        throw new Error('Failed to upload document');
      }
      
      setShowUploadForm(false);
      setUploadFile(null);
      setUploadFormData({
        name: '',
        type: DocumentType.PDF,
        category: DocumentCategory.OTHER,
        description: '',
        tags: '',
        isPublic: false,
        relatedEntityType: '',
        relatedEntityId: ''
      });
      
      success('Document Uploaded', 'The document has been successfully uploaded.');
    } catch (err) {
      console.error('Error uploading document:', err);
      error('Upload Error', 'Failed to upload document. Please try again.');
    }
  };

  const getFileIcon = (type: DocumentType) => {
    switch (type) {
      case DocumentType.PDF:
        return <FilePdf size={20} className="text-red-600" />;
      case DocumentType.IMAGE:
        return <FileImage size={20} className="text-blue-600" />;
      case DocumentType.VIDEO:
        return <FileVideo size={20} className="text-purple-600" />;
      case DocumentType.SPREADSHEET:
        return <FileSpreadsheet size={20} className="text-green-600" />;
      case DocumentType.DOCUMENT:
        return <FileText size={20} className="text-blue-600" />;
      default:
        return <File size={20} className="text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getRelatedEntityName = (doc: Document) => {
    if (!doc.relatedEntityType || !doc.relatedEntityId) return null;
    
    switch (doc.relatedEntityType) {
      case 'property':
        const property = properties.find(p => p.id === doc.relatedEntityId);
        return property?.title;
      case 'client':
        const client = clients.find(c => c.id === doc.relatedEntityId);
        return client?.name;
      case 'contract':
        const contract = rentalContracts.find(c => c.id === doc.relatedEntityId);
        const tenant = contract ? clients.find(c => c.id === contract.tenantId) : null;
        return tenant ? `Contract - ${tenant.name}` : 'Contract';
      default:
        return null;
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Try to update download count via API
      try {
        await api.get(`/documents/${doc.id}`);
      } catch (apiError) {
        console.warn('API document download failed:', apiError);
      }
      
      // Update local state
      const updatedDocuments = documents.map(d => 
        d.id === doc.id ? { ...d, downloadCount: d.downloadCount + 1 } : d
      );
      setDocuments(updatedDocuments);
      
      // Create download link
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      success('Download Started', 'Your document download has started.');
    } catch (err) {
      console.error('Error downloading document:', err);
      error('Download Error', 'Failed to download document. Please try again.');
    }
  };

  const handleShare = async (doc: Document) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc.name,
          text: doc.description || 'Document from 3Mconnect',
          url: doc.url,
        });
      } catch (error) {
        // If Web Share API fails, fall back to clipboard
        try {
          await navigator.clipboard.writeText(doc.url);
          success('Link Copied', 'Document link copied to clipboard!');
        } catch (clipboardError) {
          error('Share Error', 'Unable to share or copy link. Please copy the URL manually.');
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(doc.url);
        success('Link Copied', 'Document link copied to clipboard!');
      } catch (err) {
        error('Share Error', 'Unable to copy link to clipboard. Please copy the URL manually.');
      }
    }
  };

  const handleDelete = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        // Try to delete via API
        try {
          await api.delete(`/documents/${docId}`);
        } catch (apiError) {
          console.warn('API document deletion failed:', apiError);
        }
        
        // Update local state
        const updatedDocuments = documents.filter(d => d.id !== docId);
        setDocuments(updatedDocuments);
        setSelectedDocument(null);
        
        success('Document Deleted', 'The document has been successfully deleted.');
      } catch (err) {
        console.error('Error deleting document:', err);
        error('Delete Error', 'Failed to delete document. Please try again.');
      }
    }
  };

  const getDocumentStats = () => {
    const total = documents.filter(d => d.status === 'active').length;
    const totalSize = documents.filter(d => d.status === 'active').reduce((sum, d) => sum + d.size, 0);
    const contracts = documents.filter(d => d.category === DocumentCategory.CONTRACT && d.status === 'active').length;
    const photos = documents.filter(d => d.category === DocumentCategory.PROPERTY_PHOTOS && d.status === 'active').length;
    const expiringSoon = documents.filter(d => {
      if (!d.expiryDate || d.status !== 'active') return false;
      const daysUntilExpiry = Math.floor((d.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    return { total, totalSize, contracts, photos, expiringSoon };
  };

  const stats = getDocumentStats();

  const applyFilters = () => {
    let filteredDocs = documents.filter(d => d.status === 'active');

    if (searchTerm) {
      filteredDocs = filteredDocs.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.type) {
      filteredDocs = filteredDocs.filter(doc => doc.type === filters.type);
    }

    if (filters.category) {
      filteredDocs = filteredDocs.filter(doc => doc.category === filters.category);
    }

    if (filters.uploadedBy) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.uploadedBy.toLowerCase().includes(filters.uploadedBy.toLowerCase())
      );
    }

    return filteredDocs;
  };

  const filteredDocuments = applyFilters();

  const resetFilters = () => {
    setFilters({
      type: '',
      category: '',
      status: '',
      relatedEntity: '',
      uploadedBy: '',
      dateRange: '',
      size: '',
    });
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Document Management</h1>
          <p className="text-gray-600 mt-1">Organize and manage all your property documents</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload size={18} />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => alert('Bulk upload functionality would be implemented here')}
            className="flex items-center gap-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
          >
            <Archive size={18} />
            <span>Bulk Upload</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Documents</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Archive size={20} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">Total Size</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatFileSize(stats.totalSize)}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Contracts</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.contracts}</p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Image size={20} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Photos</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{stats.photos}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} className="text-red-600" />
            <span className="text-sm font-medium text-red-900">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.expiringSoon}</p>
        </div>
      </div>

      {/* Folders Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Folder size={20} className="text-blue-600" />
          Quick Access Folders
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedFolder === folder.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FolderOpen size={24} className={`text-${folder.color}-600`} />
                <div>
                  <h3 className="font-medium text-gray-900">{folder.name}</h3>
                  <p className="text-sm text-gray-600">{folder.documentCount} documents</p>
                </div>
              </div>
              {folder.description && (
                <p className="text-xs text-gray-500 mt-2">{folder.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents by name, description, or tags..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
                showFilters || getActiveFiltersCount() > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              <span>Filters</span>
              {getActiveFiltersCount() > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md">
              <ArrowDownUp size={18} />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="border-none outline-none bg-transparent text-sm"
              >
                <option value="date_desc">Date (Newest)</option>
                <option value="date_asc">Date (Oldest)</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="size_desc">Size (Largest)</option>
                <option value="size_asc">Size (Smallest)</option>
              </select>
            </div>

            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
              >
                <FileText size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
              >
                <Folder size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {Object.values(DocumentType).map((type) => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {Object.values(DocumentCategory).map((category) => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded By</label>
                <input
                  type="text"
                  name="uploadedBy"
                  value={filters.uploadedBy}
                  onChange={handleFilterChange}
                  placeholder="User name"
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  name="dateRange"
                  value={filters.dateRange}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Documents List/Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or upload your first document.
            </p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Upload Document
            </button>
          </div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredDocuments.map((doc) => {
            const relatedEntityName = getRelatedEntityName(doc);
            
            if (viewMode === 'grid') {
              return (
                <div key={doc.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                        <p className="text-sm text-gray-600">{formatFileSize(doc.size)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleShare(doc)}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                        title="Share"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium capitalize">{doc.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uploaded:</span>
                      <span className="font-medium">{formatDate(doc.uploadDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Downloads:</span>
                      <span className="font-medium">{doc.downloadCount}</span>
                    </div>
                  </div>

                  {doc.tags.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{doc.tags.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div key={doc.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {getFileIcon(doc.type)}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatFileSize(doc.size)}</span>
                          <span className="capitalize">{doc.category.replace('_', ' ')}</span>
                          <span>{formatDate(doc.uploadDate)}</span>
                          <span>by {doc.uploadedBy}</span>
                          {relatedEntityName && (
                            <span className="text-blue-600">→ {relatedEntityName}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Download size={14} />
                          <span>{doc.downloadCount}</span>
                        </div>
                        {doc.isPublic && (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Public</span>
                        )}
                        {doc.expiryDate && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">
                            Expires {formatDate(doc.expiryDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setSelectedDocument(doc)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleShare(doc)}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                        title="Share"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => alert('Edit functionality would be implemented here')}
                        className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {doc.description && (
                    <div className="mt-3 pl-8">
                      <p className="text-sm text-gray-600">{doc.description}</p>
                    </div>
                  )}

                  {doc.tags.length > 0 && (
                    <div className="mt-3 pl-8">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-semibold">Upload Document</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors mb-6">
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {!uploadFile ? (
                  <>
                    <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Document</h3>
                    <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
                    <label htmlFor="document-upload" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer inline-block">
                      Choose File
                    </label>
                  </>
                ) : (
                  <>
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">File Selected</h3>
                    <p className="text-gray-600 mb-2">{uploadFile.name}</p>
                    <p className="text-gray-500 mb-4">{formatFileSize(uploadFile.size)}</p>
                    <div className="flex justify-center gap-2">
                      <label htmlFor="document-upload" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors cursor-pointer inline-block">
                        Change File
                      </label>
                      <button 
                        type="button" 
                        className="bg-red-100 text-red-600 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
                        onClick={() => setUploadFile(null)}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
                  <input
                    type="text"
                    name="name"
                    value={uploadFormData.name}
                    onChange={handleUploadFormChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter document name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                    <select
                      name="type"
                      value={uploadFormData.type}
                      onChange={handleUploadFormChange}
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.values(DocumentType).map((type) => (
                        <option key={type} value={type}>
                          {type.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={uploadFormData.category}
                      onChange={handleUploadFormChange}
                      className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.values(DocumentCategory).map((category) => (
                        <option key={category} value={category}>
                          {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={uploadFormData.description}
                    onChange={handleUploadFormChange}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={uploadFormData.tags}
                    onChange={handleUploadFormChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="isPublic" 
                    name="isPublic"
                    checked={uploadFormData.isPublic}
                    onChange={handleUploadFormChange}
                    className="h-4 w-4 text-blue-600 rounded" 
                  />
                  <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                    Make this document publicly accessible
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={!uploadFile || !uploadFormData.name}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-semibold">Document Details</h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                {getFileIcon(selectedDocument.type)}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedDocument.name}</h3>
                  <p className="text-gray-600">{formatFileSize(selectedDocument.size)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium">{selectedDocument.type.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <p className="font-medium capitalize">{selectedDocument.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Uploaded:</span>
                  <p className="font-medium">{formatDate(selectedDocument.uploadDate)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Last Modified:</span>
                  <p className="font-medium">{formatDate(selectedDocument.lastModified)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Uploaded By:</span>
                  <p className="font-medium">{selectedDocument.uploadedBy}</p>
                </div>
                <div>
                  <span className="text-gray-600">Downloads:</span>
                  <p className="font-medium">{selectedDocument.downloadCount}</p>
                </div>
              </div>
              
              {selectedDocument.description && (
                <div>
                  <span className="text-gray-600 text-sm">Description:</span>
                  <p className="mt-1">{selectedDocument.description}</p>
                </div>
              )}
              
              {selectedDocument.tags.length > 0 && (
                <div>
                  <span className="text-gray-600 text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDocument.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleDownload(selectedDocument)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() => handleShare(selectedDocument)}
                  className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;