import { useState, useEffect } from 'react';
import { companyAdminAPI, companiesAPI } from '../utils/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Plus,
  Building2,
  Mail,
  Phone,
  Shield
} from 'lucide-react';

const CompanyAdmin = () => {
  const { user, companyId, isPlatformAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [companyAdmins, setCompanyAdmins] = useState([]);
  const [pagination, setPagination] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [companies, setCompanies] = useState([]);

  const [newAdmin, setNewAdmin] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    company_id: '',
    role: 'company_admin'
  });

  useEffect(() => {
    fetchCompanyAdmins();
    fetchCompanies();
  }, [currentPage, searchTerm, filterCompany]);

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getCompanies();
      console.log('Companies response:', response);
      console.log('Companies data:', response.companies);
      console.log('Companies length:', response.companies?.length);
      
      // Check for duplicate IDs
      if (response.companies && response.companies.length > 0) {
        const ids = response.companies.map(c => c.id);
        const uniqueIds = [...new Set(ids)];
        if (ids.length !== uniqueIds.length) {
          console.warn('Duplicate company IDs found:', ids);
        }
      }
      
      setCompanies(response.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const fetchCompanyAdmins = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm || undefined,
        company_id: filterCompany !== 'all' ? filterCompany : undefined,
      };
      
      const response = await companyAdminAPI.getCompanyAdmins(params);
      console.log('Full API response:', response);
      console.log('Response keys:', Object.keys(response));
      console.log('Company admins response:', response.company_admins);
      console.log('Company admins data:', response.company_admins);
      console.log('Company admins length:', response.company_admins?.length);
      
      // Try different possible field names
      let adminsData = [];
      
      if (Array.isArray(response)) {
        // Response is directly an array
        adminsData = response;
        console.log('Response is directly an array');
      } else if (response.company_admins && Array.isArray(response.company_admins)) {
        adminsData = response.company_admins;
        console.log('Using company_admins field');
      } else if (response.admins && Array.isArray(response.admins)) {
        adminsData = response.admins;
        console.log('Using admins field');
      } else if (response.data && Array.isArray(response.data)) {
        adminsData = response.data;
        console.log('Using data field');
      } else {
        console.log('No valid array found in response');
      }
      
      console.log('Final admins data:', adminsData);
      console.log('Admins data type:', typeof adminsData);
      console.log('Is array?', Array.isArray(adminsData));
      console.log('Admins length:', adminsData.length);
      
      setCompanyAdmins(adminsData);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching company admins:', error);
      setCompanyAdmins([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.full_name.trim() || !newAdmin.email.trim() || !newAdmin.password.trim() || !newAdmin.company_id) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Creating company admin with data:', {
        full_name: newAdmin.full_name,
        email: newAdmin.email,
        company_id: newAdmin.company_id
      });
      
      const adminData = {
        full_name: newAdmin.full_name,
        email: newAdmin.email,
        password: newAdmin.password,
        company_id: newAdmin.company_id
      };
      
      console.log('Full admin data being sent:', adminData);
      
      const response = await companyAdminAPI.createCompanyAdmin(adminData);
      console.log('Company admin creation response:', response);
      
      showSuccess('Company admin created successfully');
      setShowCreateForm(false);
      setNewAdmin({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        company_id: '',
        role: 'company_admin'
      });
      fetchCompanyAdmins();
    } catch (error) {
      console.error('Error creating company admin:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Log detailed validation errors
      if (error.response?.data?.details) {
        console.log('Validation details:', error.response.data.details);
        error.response.data.details.forEach((detail, index) => {
          console.log(`Detail ${index}:`, detail);
        });
      }
      
      let errorMessage = 'Failed to create company admin';
      if (error.response?.data) {
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          // Show specific validation errors
          errorMessage = error.response.data.details.map(detail => detail.message || detail).join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show specific message for 500 errors
      if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while creating company admin. This may be a temporary issue or the endpoint may not be fully implemented yet.';
      }
      
      showError(`Failed to create company admin: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (id, adminData) => {
    try {
      await companyAdminAPI.updateCompanyAdmin(id, adminData);
      showSuccess('Company admin updated successfully');
      fetchCompanyAdmins();
    } catch (error) {
      console.error('Error updating company admin:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update company admin';
      showError(`Failed to update company admin: ${errorMessage}`);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm('Are you sure you want to delete this company admin? This action cannot be undone.')) {
      try {
        console.log('Attempting to delete company admin with ID:', id);
        // Note: Delete API not specified, so we'll show a message
        showError('Delete functionality is not available for company admins.');
      } catch (error) {
        console.error('Error deleting company admin:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete company admin';
        showError(`Failed to delete company admin: ${errorMessage}`);
      }
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin({
      id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      password: '', // Don't pre-fill password for security
      company_id: admin.company_id
    });
    setShowEditForm(true);
  };

  const handleUpdateAdminSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmin.full_name.trim() || !editingAdmin.email.trim() || !editingAdmin.company_id) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Updating company admin with data:', {
        full_name: editingAdmin.full_name,
        email: editingAdmin.email,
        company_id: editingAdmin.company_id
      });
      
      const adminData = {
        full_name: editingAdmin.full_name,
        email: editingAdmin.email,
        company_id: editingAdmin.company_id
      };
      
      // Only include password if it's provided
      if (editingAdmin.password.trim()) {
        adminData.password = editingAdmin.password;
      }
      
      console.log('Full admin data being sent for update:', adminData);
      
      await companyAdminAPI.updateCompanyAdmin(editingAdmin.id, adminData);
      console.log('Company admin update response received');
      
      showSuccess('Company admin updated successfully');
      setShowEditForm(false);
      setEditingAdmin(null);
      fetchCompanyAdmins();
    } catch (error) {
      console.error('Error updating company admin:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Log detailed validation errors
      if (error.response?.data?.details) {
        console.log('Validation details:', error.response.data.details);
        error.response.data.details.forEach((detail, index) => {
          console.log(`Detail ${index}:`, detail);
        });
      }
      
      let errorMessage = 'Failed to update company admin';
      if (error.response?.data) {
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          // Show specific validation errors
          errorMessage = error.response.data.details.map(detail => detail.message || detail).join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show specific message for 500 errors
      if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while updating company admin. This may be a temporary issue or the endpoint may not be fully implemented yet.';
      }
      
      showError(`Failed to update company admin: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'company_admin': return 'bg-blue-100 text-blue-800';
      case 'platform_admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Company Admin Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage company administrators and their permissions
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Company Admin
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Search */}
          <div>
            <label htmlFor="search" className="sr-only">Search admins</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm"
                placeholder="Search by name, email, or company..."
              />
            </div>
          </div>

          {/* Company filter */}
          <div>
            <label htmlFor="company-filter" className="sr-only">Filter by company</label>
            <select
              id="company-filter"
              name="company-filter"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500 sm:text-sm sm:leading-6"
            >
              <option value="all">All Companies</option>
              {companies.map((company, index) => (
                <option key={`filter-${company.id}-${index}`} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Company Admins Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="ml-3 text-gray-600">Loading company admins...</p>
          </div>
        ) : companyAdmins.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No company admins found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterCompany !== 'all' ? 'Try adjusting your filters' : 'Get started by creating a new company admin'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Admin
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Contact
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Company
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {console.log('Rendering company admins:', companyAdmins)}
                  {companyAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{admin.full_name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">ID: {admin.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{admin.email || 'N/A'}</span>
                          </div>
                          {admin.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{admin.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{admin.company_name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{admin.company_code || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(admin.role)}`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {admin.role || 'unknown'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="flex flex-col space-y-1">
                          {admin.is_active !== undefined && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              admin.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Admin: {admin.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                          {admin.company_status && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              admin.company_status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              Company: {admin.company_status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit Admin"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Admin (Note: Delete functionality may not be available)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="btn btn-secondary">Previous</button>
                <button className="btn btn-secondary">Next</button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{companyAdmins.length}</span> of{' '}
                    <span className="font-medium">{pagination.total || companyAdmins.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      Previous
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      1
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Company Admin Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateForm(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateAdmin}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Create New Company Admin
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={newAdmin.full_name}
                            onChange={(e) => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter admin full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email *</label>
                          <input
                            type="email"
                            required
                            value={newAdmin.email}
                            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="tel"
                            value={newAdmin.phone}
                            onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Password *</label>
                          <input
                            type="password"
                            required
                            value={newAdmin.password}
                            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Company *</label>
                          <select
                            required
                            value={newAdmin.company_id}
                            onChange={(e) => setNewAdmin({ ...newAdmin, company_id: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          >
                            <option value="">Select a company</option>
                            {companies.map((company, index) => (
                              <option key={`create-${company.id}-${index}`} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
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
                    {isSubmitting ? 'Creating...' : 'Create Admin'}
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

      {/* Edit Company Admin Modal */}
      {showEditForm && editingAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowEditForm(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateAdminSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Edit Company Admin
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={editingAdmin.full_name}
                            onChange={(e) => setEditingAdmin({ ...editingAdmin, full_name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter admin full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email *</label>
                          <input
                            type="email"
                            required
                            value={editingAdmin.email}
                            onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="tel"
                            value={editingAdmin.phone}
                            onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">New Password</label>
                          <input
                            type="password"
                            value={editingAdmin.password}
                            onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Leave blank to keep current password"
                          />
                          <p className="mt-1 text-xs text-gray-500">Leave blank to keep current password</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Company *</label>
                          <select
                            required
                            value={editingAdmin.company_id}
                            onChange={(e) => setEditingAdmin({ ...editingAdmin, company_id: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          >
                            <option value="">Select a company</option>
                            {companies.map((company, index) => (
                              <option key={`edit-${company.id}-${index}`} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
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
                    {isSubmitting ? 'Updating...' : 'Update Admin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
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

export default CompanyAdmin;
