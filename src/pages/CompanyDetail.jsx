import { useState, useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { useNotification } from '../contexts/NotificationContext';

import { useAuth } from '../contexts/AuthContext';

import { companiesAPI } from '../utils/apiService';

import {

  Building2,

  UserCheck,

  Users,

  Calendar,

  QrCode,

  FileText,

  ArrowLeft,

  Edit,

  Ban,

  CheckCircle,

  AlertTriangle,

  Clock,

  Eye,

  Settings as SettingsIcon,

  Trash2,

  X

} from 'lucide-react';



const CompanyDetail = () => {

  const { id } = useParams();

  const navigate = useNavigate();

  const { showSuccess, showError } = useNotification();

  const { user } = useAuth(); // Get current user info

  const [company, setCompany] = useState(null);

  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({

    name: '',

    company_code: '',

    contact_email: '',

    contact_phone: '',

    description: ''

  });



  // Check if user has platform admin permissions

  const isPlatformAdmin = user?.role === 'platform_admin';



  // Placeholder for audit logs - would be fetched from API

  const companyAuditLogs = [

    { id: 1, timestamp: new Date().toISOString(), action: 'Company viewed', resource: 'Company Details', status: 'success', details: `Viewed company details for ${id}` }

  ];



  useEffect(() => {

    fetchCompanyDetails();

  }, [id]);



  const fetchCompanyDetails = async () => {

    try {

      setLoading(true);

      const response = await companiesAPI.getCompany(id);

      setCompany(response);

    } catch (error) {

      if (error.response?.status === 404) {

        // If direct endpoint fails, try getting from companies list and filtering

        try {

          const companiesResponse = await companiesAPI.getCompanies();

          const company = companiesResponse.companies?.find(c => c.id === id);

          if (company) {

            setCompany(company);

          } else {

            showError('Company not found or access denied');

            navigate('/companies');

          }

        } catch (listError) {

          showError('Company not found or access denied');

          navigate('/companies');

        }

      } else {

        showError('Failed to fetch company details');

        navigate('/companies');

      }

    } finally {

      setLoading(false);

    }

  };



  const getStatusColor = (status) => {

    console.log('Getting color for status:', status, 'Type:', typeof status);

    // Handle different possible status formats

    const normalizedStatus = String(status).toLowerCase().trim();

    console.log('Normalized status:', normalizedStatus);

    

    if (normalizedStatus === 'active' || normalizedStatus === 'true') {

      return 'bg-green-100 text-green-800';

    } else {

      return 'bg-red-100 text-red-800';

    }

  };



  const getPlanColor = (plan) => {

    switch (plan) {

      case 'Enterprise': return 'bg-purple-100 text-purple-800';

      case 'Professional': return 'bg-blue-100 text-blue-800';

      case 'Basic': return 'bg-gray-100 text-gray-800';

      default: return 'bg-gray-100 text-gray-800';

    }

  };



  const getAuditLogStatusIcon = (status) => {

    switch (status) {

      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;

      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;

      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;

      default: return <Clock className="h-4 w-4 text-gray-500" />;

    }

  };



  const handleBack = () => {

    navigate('/companies');

  };



  const handleEdit = () => {

    setEditForm({

      name: company.name,

      company_code: company.company_code,

      contact_email: company.contact_email,

      contact_phone: company.contact_phone,

      description: company.description || ''

    });

    setShowEditModal(true);

  };



  const handleEditSubmit = async (e) => {

    e.preventDefault();

    

    if (!editForm.name.trim() || !editForm.company_code.trim() || !editForm.contact_email.trim()) {

      showError('Please fill in all required fields');

      return;

    }



    setIsSubmitting(true);

    

    try {

      await companiesAPI.updateCompany(id, editForm);

      showSuccess('Company updated successfully');

      

      // Refresh company data

      fetchCompanyDetails();

      setShowEditModal(false);

    } catch (error) {

      showError('Failed to update company');

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleEditChange = (e) => {

    setEditForm({

      ...editForm,

      [e.target.name]: e.target.value

    });

  };



  const handleDisable = async () => {

    const normalizedStatus = String(company?.status).toLowerCase().trim();

    const action = normalizedStatus === 'active' || normalizedStatus === 'true' ? 'deactivate' : 'enable';

    

    if (confirm(`Are you sure you want to ${action} ${company?.name}?`)) {

      setIsSubmitting(true);

      

      try {

        if (normalizedStatus === 'active' || normalizedStatus === 'true') {

          // Try the dedicated deactivate endpoint first

          try {

            console.log('Attempting to deactivate company:', id);

            const response = await companiesAPI.deactivateCompany(id);

            console.log('Deactivate response:', response);

            showSuccess('Company deactivated successfully');

          } catch (deactivateError) {

            console.error('Deactivate endpoint failed:', deactivateError);

            console.error('Deactivate error response:', deactivateError.response?.data);

            

            // Use the same approach as edit - send all company data with updated status

            try {

              console.log('Trying full company data update with inactive status');

              const updateData = {

                name: company.name,

                company_code: company.company_code,

                contact_email: company.contact_email,

                contact_phone: company.contact_phone,

                description: company.description || '',

                status: 'inactive'

              };

              console.log('Sending update data:', updateData);

              const updateResponse = await companiesAPI.updateCompany(id, updateData);

              console.log('Full update response:', updateResponse);

              showSuccess('Company deactivated successfully');

            } catch (fullError) {

              console.error('Full update failed:', fullError);

              console.error('Full update error response:', fullError.response?.data);

              throw fullError;

            }

          }

        } else {

          // Try enable endpoint first

          try {

            console.log('Attempting to enable company:', id);

            const response = await companiesAPI.enableCompany(id);

            console.log('Enable response:', response);

            showSuccess('Company enabled successfully');

          } catch (enableError) {

            console.error('Enable endpoint failed:', enableError);

            console.error('Enable error response:', enableError.response?.data);

            

            // Use the same approach as edit - send all company data with updated status

            try {

              console.log('Trying full company data update with active status');

              const updateData = {

                name: company.name,

                company_code: company.company_code,

                contact_email: company.contact_email,

                contact_phone: company.contact_phone,

                description: company.description || '',

                status: 'active'

              };

              console.log('Sending update data:', updateData);

              const updateResponse = await companiesAPI.updateCompany(id, updateData);

              console.log('Full update response:', updateResponse);

              showSuccess('Company enabled successfully');

            } catch (fullError) {

              console.error('Full update failed:', fullError);

              console.error('Full update error response:', fullError.response?.data);

              throw fullError;

            }

          }

        }

        

        // Refresh company data

        fetchCompanyDetails();

      } catch (error) {

        console.error('Enable/disable error:', error);

        console.error('Enable/disable error response:', error.response);

        console.error('Enable/disable error response data:', error.response?.data);

        if (error.response?.status === 403) {

          showError('Access denied. Only Platform Admins can enable/disable companies.');

        } else if (error.response?.status === 404) {

          showError('Enable/disable functionality not available. Please contact administrator.');

        } else if (error.response?.status === 500) {

          const errorData = error.response?.data;

          console.log('500 Error Data:', errorData);

          if (errorData?.error) {

            showError(`Server error: ${errorData.error}`);

          } else {

            showError('Server error occurred. Please try again or contact administrator.');

          }

        } else {

          showError(`Failed to ${action} company`);

        }

      } finally {

        setIsSubmitting(false);

      }

    }

  };




  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <div className="text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>

          <p className="mt-4 text-gray-600">Loading company details...</p>

        </div>

      </div>

    );

  }



  if (!company) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <div className="text-center">

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h2>

          <p className="text-gray-600 mb-4">The requested company could not be found.</p>

          <button onClick={handleBack} className="btn btn-primary">

            <ArrowLeft className="h-4 w-4 mr-2" />

            Back to Companies

          </button>

        </div>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="md:flex md:items-center md:justify-between">

        <div className="flex items-center space-x-4">

          <button

            onClick={handleBack}

            className="btn btn-secondary"

          >

            <ArrowLeft className="h-4 w-4 mr-2" />

            

          </button>

          <div>

            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">

              {company.name}

            </h1>

            <p className="mt-1 text-sm text-gray-500">

              Company details and management

            </p>

          </div>

        </div>

        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">

          {isPlatformAdmin && (

            <button
              onClick={handleEdit}
              className="btn btn-secondary flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>

          )}

          <button

            onClick={handleDisable}

            disabled={isSubmitting}

            className={`btn flex items-center ${String(company?.status).toLowerCase().trim() === 'active' || String(company?.status).toLowerCase().trim() === 'true' ? 'btn-secondary text-red-600 hover:text-red-700' : 'btn-secondary text-green-600 hover:text-green-700'} disabled:opacity-50 disabled:cursor-not-allowed`}

          >

            <Ban className="h-4 w-4 mr-2" />

            {isSubmitting ? 'Processing...' : (String(company?.status).toLowerCase().trim() === 'active' || String(company?.status).toLowerCase().trim() === 'true' ? 'Deactivate' : 'Enable')}

          </button>

        </div>

      </div>



      {/* Company Profile Section */}

      <div className="card">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-lg font-medium text-gray-900 flex items-center">

            <Building2 className="h-5 w-5 mr-2 text-gray-500" />

            Company Profile

          </h2>

          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>

            {company.status}

          </span>

        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="space-y-4">

            <div>

              <label className="block text-sm font-medium text-gray-700">Company Name</label>

              <p className="mt-1 text-sm text-gray-900">{company.name}</p>

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Company Code</label>

              <p className="mt-1 text-sm text-gray-900">{company.company_code}</p>

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Contact Email</label>

              <p className="mt-1 text-sm text-gray-900">{company.contact_email}</p>

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Contact Phone</label>

              <p className="mt-1 text-sm text-gray-900">{company.contact_phone}</p>

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Status</label>

              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(company.status)}`}>

                {company.status}

              </span>

            </div>

          </div>



          <div className="space-y-4">

            <div>

              <label className="block text-sm font-medium text-gray-700">Created Date</label>

              <p className="mt-1 text-sm text-gray-900">{new Date(company.created_at).toLocaleDateString('en-GB')}</p>

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Updated Date</label>

              <p className="mt-1 text-sm text-gray-900">{new Date(company.updated_at).toLocaleDateString('en-GB')}</p>

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Total Users</label>

              <p className="mt-1 text-sm text-gray-900">{company.total_users || 0}</p>

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Company Admins</label>

              <p className="mt-1 text-sm text-gray-900">{company.company_admins || 0}</p>

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Employees</label>

              <p className="mt-1 text-sm text-gray-900">{company.employees || 0}</p>

            </div>

          </div>

        </div>



        <div className="mt-6">

          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>

          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{company.description || 'No description available'}</p>

        </div>

      </div>



      {/* Usage Metrics Section */}

      <div className="card">

        <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">

          <UserCheck className="h-5 w-5 mr-2 text-gray-500" />

          Usage Metrics

        </h2>



        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="text-center p-4 bg-blue-50 rounded-lg">

            <div className="flex items-center justify-center mb-2">

              <Users className="h-8 w-8 text-blue-600" />

            </div>

            <div className="text-2xl font-bold text-gray-900">{company.total_users || 0}</div>

            <div className="text-sm text-gray-600">Total Users</div>

            <div className="text-xs text-green-600 mt-1">Active users</div>

          </div>



          <div className="text-center p-4 bg-green-50 rounded-lg">

            <div className="flex items-center justify-center mb-2">

              <FileText className="h-8 w-8 text-green-600" />

            </div>

            <div className="text-2xl font-bold text-gray-900">{company.total_leads || 0}</div>

            <div className="text-sm text-gray-600">Total Leads</div>

            <div className="text-xs text-green-600 mt-1">Generated leads</div>

          </div>



          <div className="text-center p-4 bg-purple-50 rounded-lg">

            <div className="flex items-center justify-center mb-2">

              <Calendar className="h-8 w-8 text-purple-600" />

            </div>

            <div className="text-2xl font-bold text-gray-900">

              {company.total_leads > 0 ? Math.round(((company.total_leads / (company.total_users || 1)) * 100)) : 0}%

            </div>

            <div className="text-sm text-gray-600">Leads per User</div>

            <div className="text-xs text-green-600 mt-1">Efficiency rate</div>

          </div>

        </div>

      </div>



      {/* Registration QR Preview Section */}

      <div className="card">

        <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">

          <QrCode className="h-5 w-5 mr-2 text-gray-500" />

          Registration QR Code

        </h2>



        <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">

          <div className="flex-shrink-0">

            <div className="w-48 h-48 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">

              <div className="text-center">

                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />

                <p className="text-xs text-gray-500">QR Code Preview</p>

                <p className="text-xs text-gray-400 mt-1">Interactive QR would be here</p>

              </div>

            </div>

          </div>



          <div className="flex-1 space-y-4">

            <div>

              <h3 className="text-sm font-medium text-gray-900">QR Code Details</h3>

              <div className="mt-2 space-y-2">

                <div className="flex justify-between text-sm">

                  <span className="text-gray-600">Company:</span>

                  <span className="font-medium">{company.name}</span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-gray-600">Domain:</span>

                  <span className="font-medium">{company.domain}</span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-gray-600">Generated:</span>

                  <span className="font-medium">{new Date().toLocaleDateString('en-GB')}</span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-gray-600">Status:</span>

                  <span className="font-medium text-green-600">Active</span>

                </div>

              </div>

            </div>



            <div className="flex space-x-3">

              <button className="btn btn-primary text-sm">

                <QrCode className="h-4 w-4 mr-2" />

                Regenerate QR

              </button>

              <button className="btn btn-secondary text-sm">

                <Eye className="h-4 w-4 mr-2" />

                Preview Registration

              </button>

            </div>

          </div>

        </div>

      </div>



      {/* Company-level Audit Logs Section */}

      <div className="card">

        <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">

          <FileText className="h-5 w-5 mr-2 text-gray-500" />

          Company Audit Logs

        </h2>



        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-gray-300">

            <thead className="bg-gray-50">

              <tr>

                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">

                  Timestamp

                </th>

                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">

                  Action

                </th>

                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">

                  Resource

                </th>

                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">

                  Status

                </th>

                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">

                  Details

                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">

              {companyAuditLogs.slice(0, 10).map((log) => (

                <tr key={log.id} className="hover:bg-gray-50">

                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">

                    <div className="flex items-center">

                      <Clock className="h-4 w-4 text-gray-400 mr-2" />

                      {new Date(log.timestamp).toLocaleString()}

                    </div>

                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">

                    {log.action}

                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">

                    {log.resource}

                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-sm">

                    <div className="flex items-center">

                      {getAuditLogStatusIcon(log.status)}

                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${

                        log.status === 'success' ? 'bg-green-100 text-green-800' :

                        log.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :

                        'bg-red-100 text-red-800'

                      }`}>

                        {log.status}

                      </span>

                    </div>

                  </td>

                  <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">

                    {log.details}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>



        <div className="mt-4 text-center">

          <button className="btn btn-secondary text-sm">

            <FileText className="h-4 w-4 mr-2" />

            View All Audit Logs

          </button>

        </div>

      </div>



      {/* Edit Modal */}

      {showEditModal && (

        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

          <div className="flex items-center justify-center min-h-screen px-4">

            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-lg font-medium text-gray-900">Edit Company</h3>

                <button

                  onClick={() => setShowEditModal(false)}

                  className="text-gray-400 hover:text-gray-600"

                >

                  <X className="h-6 w-6" />

                </button>

              </div>



              <form onSubmit={handleEditSubmit} className="space-y-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700">Company Name</label>

                  <input

                    type="text"

                    name="name"

                    value={editForm.name}

                    onChange={handleEditChange}

                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"

                    required

                  />

                </div>



                <div>

                  <label className="block text-sm font-medium text-gray-700">Company Code</label>

                  <input

                    type="text"

                    name="company_code"

                    value={editForm.company_code}

                    onChange={handleEditChange}

                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"

                    required

                  />

                </div>



                <div>

                  <label className="block text-sm font-medium text-gray-700">Contact Email</label>

                  <input

                    type="email"

                    name="contact_email"

                    value={editForm.contact_email}

                    onChange={handleEditChange}

                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"

                    required

                  />

                </div>



                <div>

                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>

                  <input

                    type="tel"

                    name="contact_phone"

                    value={editForm.contact_phone}

                    onChange={handleEditChange}

                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"

                  />

                </div>



                <div>

                  <label className="block text-sm font-medium text-gray-700">Description</label>

                  <textarea

                    name="description"

                    value={editForm.description}

                    onChange={handleEditChange}

                    rows={3}

                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"

                  />

                </div>



                <div className="flex justify-end space-x-3 pt-4">

                  <button

                    type="button"

                    onClick={() => setShowEditModal(false)}

                    className="btn btn-secondary"

                  >

                    Cancel

                  </button>

                  <button

                    type="submit"

                    disabled={isSubmitting}

                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"

                  >

                    {isSubmitting ? (

                      <>

                        <Clock className="h-4 w-4 mr-2 animate-spin" />

                        Updating...

                      </>

                    ) : (

                      <>

                  

                        Update Company

                      </>

                    )}

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



export default CompanyDetail;