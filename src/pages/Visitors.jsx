import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { visitorsAPI } from '../utils/apiService';
import {
  Search,
  Filter,
  UserCheck,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Download,
  Mail,
  Badge,
  Building2,
  Plus,
  UserPlus,
  Power,
  PowerOff,
  TrendingUp,
  Activity
} from 'lucide-react';

const Visitors = () => {
  const navigate = useNavigate();
  const { user, companyId } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);
  const [pagination, setPagination] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitorStats, setVisitorStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [newVisitor, setNewVisitor] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization: '',
    designation: '',
    city: '',
    country: ''
  });

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return false; // Email is now required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return false; // Phone is required
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const digitCount = phone.replace(/\D/g, '').length;
    return phoneRegex.test(phone) && digitCount === 10;
  };

  const validateRequired = (value) => {
    return value && value.trim().length > 0;
  };

  useEffect(() => {
    fetchVisitors();
    fetchVisitorStats();
  }, [currentPage, searchTerm, companyId, statusFilter]);

  const fetchVisitorStats = async () => {
    try {
      const stats = await visitorsAPI.getVisitorStats();
      setVisitorStats(stats);
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
    }
  };

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm || undefined,
        company_id: companyId
      };
      
      const response = await visitorsAPI.getVisitors(params);
      console.log('Visitors API Response:', response);
      console.log('Response keys:', Object.keys(response));
      
      // Handle different response structures
      let visitorsData = [];
      
      if (Array.isArray(response)) {
        visitorsData = response;
        console.log('Response is directly an array');
      } else if (response.visitors && Array.isArray(response.visitors)) {
        visitorsData = response.visitors;
        console.log('Using visitors field');
      } else if (response.data && Array.isArray(response.data)) {
        visitorsData = response.data;
        console.log('Using data field');
      } else {
        console.log('No valid array found in response');
      }
      
      console.log('Final visitors data:', visitorsData);
      console.log('Visitors length:', visitorsData.length);
      
      if (visitorsData.length > 0) {
        console.log('First visitor structure:', visitorsData[0]);
        console.log('First visitor keys:', Object.keys(visitorsData[0]));
      }
      
      // Apply status filtering
      let filteredVisitors = visitorsData;
      if (statusFilter !== 'all') {
        filteredVisitors = visitorsData.filter(visitor => {
          const isLikelyDeleted = !visitor.full_name && !visitor.email && !visitor.organization;
          return statusFilter === 'active' ? !isLikelyDeleted : isLikelyDeleted;
        });
        console.log(`Applied ${statusFilter} filter: ${filteredVisitors.length} visitors remaining`);
      }
      
      // Use filtered visitors
      setVisitors(filteredVisitors);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setVisitors([]);
      setPagination({});
      showError('Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const validationErrors = [];
    
    if (!validateRequired(newVisitor.full_name)) {
      validationErrors.push('Full name is required');
    }
    
    if (!validateEmail(newVisitor.email)) {
      validationErrors.push('Please enter a valid email address');
    }
    
    if (!validatePhone(newVisitor.phone)) {
      validationErrors.push('Please enter a valid phone number (exactly 10 digits)');
    }
    
    if (validationErrors.length > 0) {
      showError(validationErrors.join('; '));
      return;
    }

    try {
      setIsSubmitting(true);
      const visitorData = {
        ...newVisitor
      };
      
      const response = await visitorsAPI.createVisitor(visitorData);
      
      showSuccess('Visitor checked in successfully');
      setShowCreateForm(false);
      setNewVisitor({
        full_name: '',
        email: '',
        phone: '',
        organization: '',
        designation: '',
        city: '',
        country: ''
      });
      fetchVisitors();
    } catch (error) {
      showError('Failed to check in visitor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVisitor = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const validationErrors = [];
    
    if (!validateRequired(selectedVisitor.full_name)) {
      validationErrors.push('Full name is required');
    }
    
    if (!validateEmail(selectedVisitor.email)) {
      validationErrors.push('Please enter a valid email address');
    }
    
    if (!validatePhone(selectedVisitor.phone)) {
      validationErrors.push('Please enter a valid phone number (exactly 10 digits)');
    }
    
    if (validationErrors.length > 0) {
      showError(validationErrors.join('; '));
      return;
    }

    try {
      setIsSubmitting(true);
      await visitorsAPI.updateVisitor(selectedVisitor.id, selectedVisitor);
      showSuccess('Visitor updated successfully');
      setShowEditForm(false);
      setSelectedVisitor(null);
      fetchVisitors();
    } catch (error) {
      showError('Failed to update visitor');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handleViewVisitor = (visitor) => {
    navigate(`/visitors/${visitor.id}`);
  };

  const handleEditVisitor = (visitor) => {
    setSelectedVisitor(visitor);
    setShowEditForm(true);
  };

  const handleToggleVisitorStatus = async (visitor) => {
    const isActive = !visitor.full_name && !visitor.email && !visitor.organization;
    const action = isActive ? 'activate' : 'deactivate';
    const confirmMessage = isActive 
      ? `Are you sure you want to activate ${visitor.full_name || 'this visitor'}?`
      : `Are you sure you want to deactivate ${visitor.full_name || 'this visitor'}? They will no longer appear in active lists.`;
    
    if (confirm(confirmMessage)) {
      try {
        const result = await visitorsAPI.updateVisitor(visitor.id, {
          is_deleted: isActive ? false : true,
          status: isActive ? 'active' : 'inactive',
          deleted_at: isActive ? null : new Date().toISOString(),
          // Clear data when deactivating, restore when activating
          full_name: isActive ? 'Restored Visitor' : null,
          email: isActive ? 'restored@example.com' : null,
          organization: isActive ? 'Restored Org' : null,
          designation: isActive ? 'Restored' : null,
          city: isActive ? 'Restored City' : null,
          country: isActive ? 'Restored Country' : null
        });
        
        showSuccess(`Visitor ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchVisitors();
      } catch (error) {
        console.error('Error toggling visitor status:', error);
        showError(`Failed to ${action} visitor`);
      }
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Visitor Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage visitor check-ins and track their information
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Check In Visitor
          </button>
        </div>
      </div>

      {/* Visitor Stats */}
      {visitorStats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="bg-blue-50 border-l-4 border-l-blue-600 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Total Visitors
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {visitorStats.total_visitors}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {visitorStats.visitors_last_30_days} this month
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-l-green-600 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Today's Visitors
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {visitorStats.visitors_today}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {visitorStats.visitors_today > 0 ? 'New visitors today' : 'No new visitors today'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border-l-4 border-l-purple-600 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Last 7 Days
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {visitorStats.visitors_last_7_days}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      Recent activity
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border-l-4 border-l-orange-600 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Monthly Trend
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round((visitorStats.visitors_last_30_days / 30) * 10) / 10}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-blue-600">
                      Avg per day
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            {/* <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button> */}
          </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  statusFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({visitors.length})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('active');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  statusFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => {
                  setStatusFilter('inactive');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  statusFilter === 'inactive'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Showing {visitors.length} visitors
          </div>
        </div>
      </div>

      {/* Visitors list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Visitors ({pagination.total_records || 0})
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No visitors found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Get started by checking in a new visitor'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {console.log('Rendering visitors:', visitors)}
                {visitors.map((visitor, index) => {
                  console.log(`Visitor ${index}:`, visitor);
                  console.log(`Visitor ${index} keys:`, Object.keys(visitor));
                  console.log(`Visitor ${index} check_in_time:`, visitor.check_in_time);
                  console.log(`Visitor ${index} status:`, visitor.status);
                  console.log(`Visitor ${index} purpose:`, visitor.purpose);
                  
                  // Check if visitor appears to be deleted (mostly null/undefined values)
                  const isLikelyDeleted = !visitor.full_name && !visitor.email && !visitor.organization;
                  
                  return (
                  <tr key={visitor.id} className={`hover:bg-gray-50 ${isLikelyDeleted ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {visitor.full_name || 'Unknown'}
                        {isLikelyDeleted && <span className="ml-2 text-xs text-orange-600">(Inactive)</span>}
                      </div>
                      <div className="text-sm text-gray-500">{visitor.organization || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{visitor.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{visitor.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{visitor.designation || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isLikelyDeleted 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {isLikelyDeleted ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{visitor.city || 'N/A'}, {visitor.country || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {visitor.created_at ? new Date(visitor.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewVisitor(visitor)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditVisitor(visitor)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Visitor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleVisitorStatus(visitor)}
                          className={`${isLikelyDeleted ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'}`}
                          title={isLikelyDeleted ? 'Activate Visitor' : 'Deactivate Visitor'}
                        >
                          {isLikelyDeleted ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.total_pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * 10, pagination.total_records)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total_records}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {currentPage} / {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.total_pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Visitor Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateForm(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateVisitor}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Check In New Visitor
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={newVisitor.full_name}
                            onChange={(e) => setNewVisitor({ ...newVisitor, full_name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter visitor's full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email *</label>
                          <input
                            type="email"
                            required
                            value={newVisitor.email}
                            onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone *</label>
                          <input
                            type="tel"
                            required
                            value={newVisitor.phone}
                            onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Organization</label>
                          <input
                            type="text"
                            value={newVisitor.organization}
                            onChange={(e) => setNewVisitor({ ...newVisitor, organization: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter organization name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Designation</label>
                          <input
                            type="text"
                            value={newVisitor.designation}
                            onChange={(e) => setNewVisitor({ ...newVisitor, designation: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter designation"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">City</label>
                          <input
                            type="text"
                            value={newVisitor.city}
                            onChange={(e) => setNewVisitor({ ...newVisitor, city: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter city"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Country</label>
                          <input
                            type="text"
                            value={newVisitor.country}
                            onChange={(e) => setNewVisitor({ ...newVisitor, country: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter country"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Checking In...' : 'Check In Visitor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Visitor Modal */}
      {showEditForm && selectedVisitor && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateVisitor}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Edit Visitor
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={selectedVisitor.full_name || ''}
                            onChange={(e) => setSelectedVisitor({ ...selectedVisitor, full_name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter visitor's full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email *</label>
                          <input
                            type="email"
                            required
                            value={selectedVisitor.email || ''}
                            onChange={(e) => setSelectedVisitor({ ...selectedVisitor, email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone *</label>
                          <input
                            type="tel"
                            required
                            value={selectedVisitor.phone || ''}
                            onChange={(e) => setSelectedVisitor({ ...selectedVisitor, phone: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Organization</label>
                          <input
                            type="text"
                            value={selectedVisitor.organization || ''}
                            onChange={(e) => setSelectedVisitor({ ...selectedVisitor, organization: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter organization name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Designation</label>
                          <input
                            type="text"
                            value={selectedVisitor.designation || ''}
                            onChange={(e) => setSelectedVisitor({ ...selectedVisitor, designation: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter designation"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">City</label>
                          <input
                            type="text"
                            value={selectedVisitor.city || ''}
                            onChange={(e) => setSelectedVisitor({ ...selectedVisitor, city: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter city"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Country</label>
                          <input
                            type="text"
                            value={selectedVisitor.country || ''}
                            onChange={(e) => setSelectedVisitor({ ...selectedVisitor, country: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter country"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Visitor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setSelectedVisitor(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitors;
