import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { validateForm, validationRules } from '../utils/validation';
import { companiesAPI, usersAPI } from '../utils/apiService';
import { Building2, FileText, CheckSquare, QrCode, RefreshCw, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const { user, companyId, isPlatformAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState('profile');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (activeTab === 'company-profile' && companyId) {
      fetchCompanyData();
    }
    if (activeTab === 'profile' && user) {
      setUserData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [activeTab, companyId, user]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await companiesAPI.getCompanies({ company_id: companyId });
      if (response.companies && response.companies.length > 0) {
        setCompanyData(response.companies[0]);
      }
    } catch (error) {
      showError('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyUpdate = async (e) => {
    e.preventDefault();
    const errors = validateForm(companyData, validationRules.company);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      await companiesAPI.updateCompany(companyData.id, companyData);
      showSuccess('Company profile updated successfully');
      setValidationErrors({});
    } catch (error) {
      showError('Failed to update company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const errors = validateForm(userData, validationRules.user);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      await usersAPI.updateUser(user.id, userData);
      showSuccess('Profile updated successfully');
      setValidationErrors({});
    } catch (error) {
      showError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: Building2 },
    { id: 'company-profile', name: 'Company Profile', icon: Building2 },
    { id: 'registration-fields', name: 'Registration Fields', icon: FileText },
    { id: 'consent-editor', name: 'Consent Editor', icon: CheckSquare },
    { id: 'qr-settings', name: 'QR Settings', icon: QrCode },
  ];

  const renderProfileTab = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Settings</h3>
      </div>
      <form onSubmit={handleProfileUpdate} className="px-4 py-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={userData?.full_name || ''}
              onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {validationErrors.full_name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.full_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={userData?.email || ''}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={userData?.phone || ''}
              onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {validationErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderCompanyProfileTab = () => {
    if (!companyId) {
      return (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Company Profile</h3>
          <p className="mt-1 text-sm text-gray-500">
            This tab is only available for company admins
          </p>
        </div>
      );
    }

    if (loading && !companyData) {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Company Profile</h3>
        </div>
        <form onSubmit={handleCompanyUpdate} className="px-4 py-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={companyData?.name || ''}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Code</label>
              <input
                type="text"
                value={companyData?.company_code || ''}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={companyData?.email || ''}
                onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={companyData?.phone || ''}
                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={companyData?.address || ''}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={fetchCompanyData}
              className="btn btn-secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Company'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderRegistrationFieldsTab = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Registration Fields</h3>
        <p className="mt-1 text-sm text-gray-500">
          Customize the fields shown during visitor registration
        </p>
        <div className="mt-6">
          <button className="btn btn-secondary">Configure Fields</button>
        </div>
      </div>
    </div>
  );

  const renderConsentEditorTab = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="text-center">
        <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Consent Editor</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage privacy consent and data collection policies
        </p>
        <div className="mt-6">
          <button className="btn btn-secondary">Edit Consent</button>
        </div>
      </div>
    </div>
  );

  const renderQRSettingsTab = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="text-center">
        <QrCode className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">QR Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure QR code generation and display settings
        </p>
        <div className="mt-6">
          <button className="btn btn-secondary">Configure QR</button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'company-profile':
        return renderCompanyProfileTab();
      case 'registration-fields':
        return renderRegistrationFieldsTab();
      case 'consent-editor':
        return renderConsentEditorTab();
      case 'qr-settings':
        return renderQRSettingsTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4 sm:px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
