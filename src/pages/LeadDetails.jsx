import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Building2, Mail, Phone, User, Tag, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { leadsAPI } from '../utils/apiService';

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      console.log('LeadDetails - Fetching lead for ID:', id);
      const response = await leadsAPI.getLead(id);
      console.log('LeadDetails - Received lead data:', response);
      setLead(response);
    } catch (error) {
      console.error('LeadDetails - Error fetching lead details:', error);
      showError('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadsAPI.deleteLead(id);
        showSuccess('Lead deleted successfully');
        navigate('/leads');
      } catch (error) {
        console.error('Error deleting lead:', error);
        showError('Failed to delete lead');
      }
    }
  };

  const handleEditLead = () => {
    navigate(`/leads/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Lead not found</h3>
        <p className="text-gray-600 mb-4">The lead you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/leads')}
          className="btn btn-primary"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  console.log('LeadDetails - Rendering with lead data:', lead);

  // Debug: Show field access
  if (lead) {
    console.log('Field access test:');
    console.log('lead.lead?.visitor_name:', lead.lead?.visitor_name);
    console.log('lead.lead?.visitor_email:', lead.lead?.visitor_email);
    console.log('lead.lead?.visitor_phone:', lead.lead?.visitor_phone);
    console.log('lead.lead?.visitor_designation:', lead.lead?.visitor_designation);
    console.log('lead.lead?.organization:', lead.lead?.organization);
    console.log('lead.lead?.city:', lead.lead?.city);
    console.log('lead.lead?.country:', lead.lead?.country);
    console.log('lead.lead?.company_name:', lead.lead?.company_name);
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/leads')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leads
        </button>
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lead Details</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Lead ID: {lead.lead?.id || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Lead Information */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-600" />
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900">{lead.lead?.visitor_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{lead.lead?.visitor_email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{lead.lead?.visitor_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <p className="text-gray-900">{lead.lead?.visitor_designation || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visitor ID</label>
                    <p className="text-gray-900 text-sm">{lead.lead?.visitor_id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Organization & Location */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary-600" />
                  Organization & Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization</label>
                    <p className="text-gray-900">{lead.lead?.organization || lead.lead?.visitor_organization || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <p className="text-gray-900">{lead.lead?.city || lead.lead?.visitor_city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <p className="text-gray-900">{lead.lead?.country || lead.lead?.visitor_country || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <p className="text-gray-900">{lead.lead?.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company ID</label>
                    <p className="text-gray-900 text-sm">{lead.lead?.company_id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Lead Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-primary-600" />
                  Lead Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interests</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      lead.lead?.interests === 'Hot' ? 'bg-red-100 text-red-800' :
                      lead.lead?.interests === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                      lead.lead?.interests === 'Cold' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.lead?.interests || 'Not Specified'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {lead.lead?.follow_up_date ? new Date(lead.lead.follow_up_date).toLocaleDateString() : 'Not Set'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created Date</label>
                    <p className="text-gray-900">
                      {lead.lead?.created_at ? new Date(lead.lead.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employee Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-600" />
                  Assigned Employee
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee Name</label>
                    <p className="text-gray-900">{lead.lead?.employee_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee Email</label>
                    <p className="text-gray-900">{lead.lead?.employee_email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <p className="text-gray-900 text-sm">{lead.lead?.employee_id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary-600" />
                  Notes
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {lead.lead?.notes || 'No notes available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
