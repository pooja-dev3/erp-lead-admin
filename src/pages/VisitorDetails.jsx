import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Badge,
  MapPin,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { visitorsAPI } from '../utils/apiService';
import { useNotification } from '../contexts/NotificationContext';

const VisitorDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showSuccess, showError } = useNotification();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch visitor data from API
  useEffect(() => {
    fetchVisitorDetails();
  }, [id]);

  const fetchVisitorDetails = async () => {
    try {
      setLoading(true);
      // Since we don't have a getVisitorById endpoint, we'll get all visitors and find the one we need
      const response = await visitorsAPI.getVisitors();
      
      let visitorsData = [];
      if (Array.isArray(response)) {
        visitorsData = response;
      } else if (response.visitors && Array.isArray(response.visitors)) {
        visitorsData = response.visitors;
      } else if (response.data && Array.isArray(response.data)) {
        visitorsData = response.data;
      }
      
      const foundVisitor = visitorsData.find(v => v.id === id);
      
      if (foundVisitor) {
        setVisitor(foundVisitor);
      } else {
        showError('Visitor not found');
        navigate('/visitors');
      }
    } catch (error) {
      showError('Failed to fetch visitor details');
      navigate('/visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/visitors');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'checked_in':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-blue-100 text-blue-800';
      case 'registered':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'checked_in':
        return <CheckCircle className="h-4 w-4" />;
      case 'checked_out':
        return <AlertCircle className="h-4 w-4" />;
      case 'registered':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getProfileCompleteness = (visitor) => {
    const fields = [
      visitor.full_name,
      visitor.email,
      visitor.phone,
      visitor.organization,
      visitor.designation,
      visitor.city,
      visitor.country
    ];

    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getCompletenessColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletenessBg = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Visitor not found</h2>
          <p className="text-gray-600 mt-2">The visitor you're looking for doesn't exist.</p>
          <button onClick={handleBack} className="btn btn-primary mt-4">
            Back to Visitors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Visitors
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{visitor.full_name || 'Unknown'}</h1>
            <p className="text-sm text-gray-600">Visitor ID: {visitor.id}</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 ${getStatusColor(visitor.status)}`}>
        <div className="flex items-center">
          {getStatusIcon(visitor.status)}
          <span className="ml-2 font-medium capitalize">
            {visitor.status ? visitor.status.replace('_', ' ') : 'Registered'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'profile', name: 'Profile', current: activeTab === 'profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                tab.current
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visitor Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Visitor Profile</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Profile Completeness</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getCompletenessBg(getProfileCompleteness(visitor))} transition-all duration-300`}
                        style={{ width: `${getProfileCompleteness(visitor)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${getCompletenessColor(getProfileCompleteness(visitor))}`}>
                      {getProfileCompleteness(visitor)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{visitor.full_name || 'Unknown'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{visitor.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{visitor.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{visitor.organization || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Badge className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{visitor.designation || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City / Country</label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{visitor.city || 'N/A'}, {visitor.country || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">
                        {visitor.created_at ? new Date(visitor.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorDetails;
