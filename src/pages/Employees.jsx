import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { usersAPI } from '../utils/apiService';
import {
  Search,
  Filter,
  UserCheck,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  Mail,
  Building2,
  Plus,
  UserPlus,
  Trash2,
  Users,
  Shield,
  AlertTriangle
} from 'lucide-react';

const Employees = () => {
  const navigate = useNavigate();
  const { user, companyId, isCompanyAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  // For company admins, default to employee role only
  const [filterRole, setFilterRole] = useState(isCompanyAdmin ? 'employee' : 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm, filterRole, companyId]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!newEmployee.full_name?.trim()) {
      errors.full_name = 'Full name is required';
    } else if (newEmployee.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    if (!newEmployee.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(newEmployee.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!newEmployee.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(newEmployee.phone)) {
      errors.phone = 'Phone number must be 10 digits starting with 6, 7, 8, or 9';
    }

    if (!newEmployee.password?.trim()) {
      errors.password = 'Password is required';
    } else if (newEmployee.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setNewEmployee(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEditInputChange = (field, value) => {
    setSelectedEmployee(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (editFormErrors[field]) {
      setEditFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEditForm = () => {
    const errors = {};
    
    if (!selectedEmployee?.full_name?.trim()) {
      errors.full_name = 'Full name is required';
    } else if (selectedEmployee.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    if (!selectedEmployee?.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(selectedEmployee.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (selectedEmployee?.phone && !validatePhone(selectedEmployee.phone)) {
      errors.phone = 'Phone number must be 10 digits starting with 6, 7, 8, or 9';
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm || undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        company_id: companyId
      };
      
      const response = await usersAPI.getUsers(params);
      console.log('Employees API Response:', response);
      
      // Handle different response structures
      if (response && response.users) {
        setEmployees(response.users);
        setPagination(response.pagination || {});
      } else if (Array.isArray(response)) {
        setEmployees(response);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showError('Failed to fetch employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    
    // Validate form first
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Map frontend fields to backend fields
      const employeeData = {
        full_name: newEmployee.full_name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        password: newEmployee.password,
        role: 'employee', // Always employee for company admin
        company_id: companyId
      };
      
      console.log('Creating employee with data:', employeeData);
      console.log('Company ID:', companyId);
      
      const response = await usersAPI.createUser(employeeData);
      console.log('Create employee response:', response);
      
      showSuccess('Employee created successfully');
      setShowCreateForm(false);
      setNewEmployee({
        full_name: '',
        email: '',
        phone: '',
        password: ''
      });
      setFormErrors({});
      fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // Handle specific error messages
      if (error.response?.status === 409) {
        showError('An employee with this email already exists');
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.errors) {
          // Handle validation errors from backend
          const backendErrors = {};
          Object.keys(errorData.errors).forEach(field => {
            backendErrors[field] = errorData.errors[field][0];
          });
          setFormErrors(backendErrors);
          showError('Please correct the validation errors');
        } else {
          showError(errorData?.message || 'Invalid data provided');
        }
      } else if (error.response?.status === 403) {
        showError('You do not have permission to create employees');
      } else if (error.response?.status === 422) {
        const errorData = error.response?.data;
        if (errorData?.error?.includes('email')) {
          setFormErrors({ email: 'This email is already registered' });
          showError('Email already exists');
        } else if (errorData?.error?.includes('phone')) {
          setFormErrors({ phone: 'This phone number is already registered' });
          showError('Phone number already exists');
        } else {
          showError(errorData?.error || 'Validation failed');
        }
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Failed to create employee. Please try again.';
        showError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    
    // Validate form first
    if (!validateEditForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Map frontend fields to backend fields
      const employeeData = {
        full_name: selectedEmployee.full_name,
        email: selectedEmployee.email,
        phone: selectedEmployee.phone,
        role: selectedEmployee.role,
        // Map status to is_active for backend compatibility
        is_active: selectedEmployee.status === 'active'
      };
      
      console.log('Updating employee with data:', employeeData);
      console.log('Original selectedEmployee:', selectedEmployee);
      
      const response = await usersAPI.updateUser(selectedEmployee.id, employeeData);
      console.log('Update employee response:', response);
      
      showSuccess('Employee updated successfully');
      setShowEditForm(false);
      setSelectedEmployee(null);
      setEditFormErrors({});
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      
      // Handle specific error messages
      if (error.response?.status === 409) {
        setEditFormErrors({ email: 'This email is already registered' });
        showError('Email already exists');
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.errors) {
          // Handle validation errors from backend
          const backendErrors = {};
          Object.keys(errorData.errors).forEach(field => {
            backendErrors[field] = errorData.errors[field][0];
          });
          setEditFormErrors(backendErrors);
          showError('Please correct the validation errors');
        } else {
          showError(errorData?.message || 'Invalid data provided');
        }
      } else if (error.response?.status === 403) {
        showError('You do not have permission to update employees');
      } else if (error.response?.status === 422) {
        const errorData = error.response?.data;
        if (errorData?.error?.includes('email')) {
          setEditFormErrors({ email: 'This email is already registered' });
          showError('Email already exists');
        } else if (errorData?.error?.includes('phone')) {
          setEditFormErrors({ phone: 'This phone number is already registered' });
          showError('Phone number already exists');
        } else {
          showError(errorData?.error || 'Validation failed');
        }
      } else if (error.response?.data?.error === 'Insufficient permissions') {
        showError('You do not have permission to update employees. Please contact your system administrator.');
      } else if (error.response?.data?.error === 'Validation failed') {
        showError('Unable to update employee due to validation errors. Please check all fields and try again.');
      } else if (error.response?.data?.error === 'Route not found') {
        showError('Update functionality is not available for company admins. Employee management modifications require platform admin access.');
      } else if (error.response?.status === 404) {
        showError('Employee update endpoints are not available. Please contact your system administrator for employee modifications.');
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Failed to update employee. Please try again.';
        showError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateEmployee = async (employee) => {
    if (confirm(`Are you sure you want to deactivate ${employee.full_name}?`)) {
      try {
        await usersAPI.deactivateUser(employee.id);
        showSuccess('Employee deactivated successfully');
        fetchEmployees();
      } catch (error) {
        console.error('Error deactivating employee:', error);
        
        // Handle specific permission errors
        if (error.response?.data?.error === 'Insufficient permissions') {
          showError('You do not have permission to deactivate employees. Please contact your system administrator.');
        } else if (error.response?.data?.error === 'Validation failed') {
          showError('Unable to deactivate employee due to validation errors. Please try again.');
        } else {
          showError('Failed to deactivate employee');
        }
      }
    }
  };

  const handleDeleteEmployee = async (employee) => {
    if (confirm(`Are you sure you want to deactivate ${employee.full_name}? This will deactivate their account and they will no longer be able to access the system.`)) {
      try {
        await usersAPI.deactivateUser(employee.id);
        showSuccess('Employee deactivated successfully');
        fetchEmployees();
      } catch (error) {
        console.error('Error deactivating employee:', error);
        
        // Handle specific permission errors
        if (error.response?.data?.error === 'Insufficient permissions') {
          showError('You do not have permission to deactivate employees. Please contact your system administrator.');
        } else if (error.response?.data?.error === 'Validation failed') {
          showError('Unable to deactivate employee due to validation errors. Please try again.');
        } else if (error.response?.data?.error === 'Route not found') {
          showError('Deactivate functionality is not available. Please contact your system administrator for employee deactivation.');
        } else {
          showError(error.message || 'Failed to deactivate employee');
        }
      }
    }
  };

  const getStatusColor = (isActive) => {
    if (isActive === true) return 'bg-green-100 text-green-800';
    if (isActive === false) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'company_admin': return 'bg-purple-100 text-purple-800';
      case 'employee': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditEmployee = (employee) => {
    // Map backend fields to frontend fields
    const frontendEmployee = {
      ...employee,
      status: employee.is_active === true ? 'active' : 'inactive'
    };
    setSelectedEmployee(frontendEmployee);
    setShowEditForm(true);
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
            Employee Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your company employees and their access
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg mr-3">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <div className="text-sm">
              <div className="font-medium text-blue-900">
                {pagination.total || employees.length} Employees
              </div>
              <div className="text-blue-700">
                {employees.filter(emp => emp.is_active === true).length} Active
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Employee
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
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
          {/* Role filter - only show for platform admins */}
          {!isCompanyAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All Roles</option>
                <option value="company_admin">Company Admin</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Employees table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {employee.id?.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.email}</div>
                      <div className="text-sm text-gray-500">
                        {employee.phone || employee.mobile || employee.phone_number || employee.contact || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(employee.role)}`}>
                        {employee.role?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{employee.company_name}</div>
                        <div className="text-gray-500">{employee.company_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.is_active)}`}>
                        {employee.is_active === true ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {employee.role === 'employee' && (
                          <>
                            <button
                              onClick={() => handleEditEmployee(employee)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.total_pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * (pagination.per_page || 10) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * (pagination.per_page || 10), pagination.total || 0)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total || 0}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.total_pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Employee Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowCreateForm(false)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateEmployee}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Add New Employee</h3>
                    <p className="mt-1 text-sm text-gray-500">Create a new employee account for your company</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newEmployee.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          formErrors.full_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter full name"
                      />
                      {formErrors.full_name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.full_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={newEmployee.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          formErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter email"
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={newEmployee.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          if (value.length <= 10) {
                            handleInputChange('phone', value);
                          }
                        }}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          formErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter 10-digit mobile number"
                      />
                      {formErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Enter 10-digit number starting with 6, 7, 8, or 9</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        value={newEmployee.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          formErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter password (min 6 characters)"
                      />
                      {formErrors.password && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Employee'}
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

      {/* Edit Employee Modal */}
      {showEditForm && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowEditForm(false)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateEmployee}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit Employee</h3>
                    <p className="mt-1 text-sm text-gray-500">Update employee information</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={selectedEmployee.full_name}
                        onChange={(e) => handleEditInputChange('full_name', e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          editFormErrors.full_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {editFormErrors.full_name && (
                        <p className="mt-1 text-sm text-red-600">{editFormErrors.full_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={selectedEmployee.email}
                        onChange={(e) => handleEditInputChange('email', e.target.value)}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          editFormErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {editFormErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{editFormErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={selectedEmployee.phone || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          if (value.length <= 10) {
                            handleEditInputChange('phone', value);
                          }
                        }}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          editFormErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter 10-digit mobile number"
                      />
                      {editFormErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">{editFormErrors.phone}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Enter 10-digit number starting with 6, 7, 8, or 9 (optional)</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Employee'}
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

export default Employees;
