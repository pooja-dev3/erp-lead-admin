import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { validateForm, validationRules } from '../utils/validation';
import { companiesAPI } from '../utils/apiService';
import {
  Badge,
  Search,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  FileText,
  User,
  Calendar,
  Plus,
  RefreshCw
} from 'lucide-react';

const BadgeMapping = () => {
  const { user, companyId } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [validationErrors, setValidationErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [badgeMappings, setBadgeMappings] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMapping, setNewMapping] = useState({
    badge_number: '',
    employee_name: '',
    employee_email: '',
    department: '',
    role: ''
  });

  useEffect(() => {
    fetchBadgeMappings();
  }, []);

  const fetchBadgeMappings = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch badge mappings from API
      // For now, we'll use mock data
      setBadgeMappings([
        {
          id: 1,
          badge_number: 'EMP001',
          employee_name: 'John Doe',
          employee_email: 'john.doe@company.com',
          department: 'Sales',
          role: 'Sales Manager',
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          last_used: '2024-01-30T14:30:00Z'
        },
        {
          id: 2,
          badge_number: 'EMP002',
          employee_name: 'Jane Smith',
          employee_email: 'jane.smith@company.com',
          department: 'Marketing',
          role: 'Marketing Specialist',
          status: 'active',
          created_at: '2024-01-16T11:00:00Z',
          last_used: '2024-01-29T09:15:00Z'
        }
      ]);
    } catch (error) {
      showError('Failed to fetch badge mappings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = async (e) => {
    e.preventDefault();
    const errors = validateForm(newMapping, validationRules.badgeMapping);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      // In a real app, you would call API to create badge mapping
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mapping = {
        id: badgeMappings.length + 1,
        ...newMapping,
        status: 'active',
        created_at: new Date().toISOString(),
        last_used: null
      };
      
      setBadgeMappings([mapping, ...badgeMappings]);
      showSuccess('Badge mapping created successfully');
      setShowCreateForm(false);
      setNewMapping({
        badge_number: '',
        employee_name: '',
        employee_email: '',
        department: '',
        role: ''
      });
      setValidationErrors({});
    } catch (error) {
      showError('Failed to create badge mapping');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMapping = async (id, mappingData) => {
    try {
      // In a real app, you would call API to update badge mapping
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBadgeMappings(badgeMappings.map(mapping => 
        mapping.id === id ? { ...mapping, ...mappingData } : mapping
      ));
      showSuccess('Badge mapping updated successfully');
    } catch (error) {
      showError('Failed to update badge mapping');
    }
  };

  const handleDeleteMapping = async (id) => {
    if (!confirm('Are you sure you want to delete this badge mapping?')) return;

    try {
      // In a real app, you would call API to delete badge mapping
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBadgeMappings(badgeMappings.filter(mapping => mapping.id !== id));
      showSuccess('Badge mapping deleted successfully');
    } catch (error) {
      showError('Failed to delete badge mapping');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMappings = badgeMappings.filter(mapping => {
    const matchesSearch = mapping.badge_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.employee_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || mapping.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Badge Mapping
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage employee badge assignments and permissions
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Assign Badge
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search badges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Badge Mappings Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Badge Mappings ({filteredMappings.length})
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredMappings.length === 0 ? (
          <div className="text-center py-12">
            <Badge className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No badge mappings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Get started by assigning a new badge'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Badge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMappings.map((mapping) => (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mapping.badge_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mapping.employee_name}</div>
                      <div className="text-sm text-gray-500">{mapping.employee_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(mapping.status)}`}>
                        {mapping.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mapping.last_used ? new Date(mapping.last_used).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Badge Mapping Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateForm(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateMapping}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Assign New Badge
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Badge Number *</label>
                          <input
                            type="text"
                            required
                            value={newMapping.badge_number}
                            onChange={(e) => setNewMapping({ ...newMapping, badge_number: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="e.g., EMP001"
                          />
                          {validationErrors.badge_number && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.badge_number}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Employee Name *</label>
                          <input
                            type="text"
                            required
                            value={newMapping.employee_name}
                            onChange={(e) => setNewMapping({ ...newMapping, employee_name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                          {validationErrors.employee_name && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.employee_name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email *</label>
                          <input
                            type="email"
                            required
                            value={newMapping.employee_email}
                            onChange={(e) => setNewMapping({ ...newMapping, employee_email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                          {validationErrors.employee_email && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.employee_email}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Department</label>
                          <input
                            type="text"
                            value={newMapping.department}
                            onChange={(e) => setNewMapping({ ...newMapping, department: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role</label>
                          <input
                            type="text"
                            value={newMapping.role}
                            onChange={(e) => setNewMapping({ ...newMapping, role: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                    {isSubmitting ? 'Assigning...' : 'Assign Badge'}
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
    </div>
  );
};

export default BadgeMapping;
