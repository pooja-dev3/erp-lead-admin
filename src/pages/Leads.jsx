import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { leadsAPI, companiesAPI, visitorsAPI } from '../utils/apiService';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Tag,
  FileText,
  Clock,
  User,
  Plus,
  X,
  Phone,
  Mail,
  Building2,
  MapPin,
  Globe,
  Target,
  ChevronDown,
  TrendingUp,
  CalendarCheck
} from 'lucide-react';

const Leads = () => {
  const { user, companyId, isPlatformAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId || '');
  const [createLeadCompanyId, setCreateLeadCompanyId] = useState(''); // Separate state for create modal
  const [leadStats, setLeadStats] = useState(null);
  const [newLead, setNewLead] = useState({
    full_name: '',
    email: '',
    phone: '',
    organization: '',
    designation: '',
    city: '',
    country: '',
    interests: '',
    notes: '',
    follow_up_date: ''
  });
  const [searchPhone, setSearchPhone] = useState('');
  const [searchedVisitor, setSearchedVisitor] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  useEffect(() => {
    fetchLeads();
    fetchLeadStats();
    if (isPlatformAdmin) {
      fetchCompanies();
    }
  }, [currentPage, searchTerm, selectedCompanyId]);

  const fetchLeadStats = async () => {
    try {
      const stats = await leadsAPI.getLeadStats();
      setLeadStats(stats);
    } catch (error) {
      console.error('Error fetching lead stats:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getCompanies();
      if (response.companies) {
        setCompanies(response.companies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      showError('Failed to fetch companies');
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm || undefined,
      };
      
      // Use selectedCompanyId for platform admins, otherwise use companyId
      const effectiveCompanyId = isPlatformAdmin ? selectedCompanyId : companyId;
      if (effectiveCompanyId) {
        params.company_id = effectiveCompanyId;
      }
      
      const response = await leadsAPI.getLeads(params);
      
      // Try different possible response structures
      let leadsData = [];
      
      if (Array.isArray(response)) {
        leadsData = response;
      } else if (response.leads && Array.isArray(response.leads)) {
        leadsData = response.leads;
      } else if (response.data && Array.isArray(response.data)) {
        leadsData = response.data;
      }
      
      setLeads(leadsData);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
      setPagination({});
      showError('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return false; // Email is now required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return false; // Phone is now required
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const digitCount = phone.replace(/\D/g, '').length;
    return phoneRegex.test(phone) && digitCount === 10;
  };

  const validateName = (name) => {
    return name && name.trim().length >= 2;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    return dateString;
  };

  const validateFollowUpDate = (date) => {
    if (!date) return false; // Follow-up date is now required
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    return !isNaN(selectedDate.getTime()) && selectedDate >= today;
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const validationErrors = [];
    
    if (!validateName(newLead.full_name)) {
      validationErrors.push('Full name must be at least 2 characters long');
    }
    
    if (!validateEmail(newLead.email)) {
      validationErrors.push('Please enter a valid email address');
    }
    
    if (!validatePhone(newLead.phone)) {
      validationErrors.push('Please enter a valid phone number (exactly 10 digits)');
    }
    
    if (!validateFollowUpDate(newLead.follow_up_date)) {
      validationErrors.push('Follow-up date is required and must be today or in the future');
    }
    
    // Platform admin specific validation
    if (isPlatformAdmin && !createLeadCompanyId) {
      validationErrors.push('Please select a company');
    }
    
    if (validationErrors.length > 0) {
      showError(validationErrors.join('; '));
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Format the follow_up_date properly for the API
      let formattedFollowUpDate = null;
      if (newLead.follow_up_date) {
        // Convert date string to proper format if needed
        const date = new Date(newLead.follow_up_date);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD (API seems to expect this format)
          formattedFollowUpDate = date.toISOString().split('T')[0];
        }
      }
      
      const leadData = {
        ...newLead,
        follow_up_date: formattedFollowUpDate,
        notes: newLead.notes || 'No notes provided' // Provide default if empty
      };
      
      console.log('Creating lead with data:', JSON.stringify(leadData, null, 2));
      
      // Try sending company_id in headers for platform admins
      const effectiveCompanyId = isPlatformAdmin ? createLeadCompanyId : companyId;
      console.log('=== LEAD CREATION DEBUG ===');
      console.log('User role:', user?.role);
      console.log('isPlatformAdmin:', isPlatformAdmin);
      console.log('createLeadCompanyId:', createLeadCompanyId);
      console.log('companyId:', companyId);
      console.log('effectiveCompanyId:', effectiveCompanyId);
      console.log('newLead state:', newLead);
      console.log('leadData being sent (clean):', JSON.stringify(leadData, null, 2));
      
      if (isPlatformAdmin && !effectiveCompanyId) {
        showError('Please select a company to create leads');
        return;
      }
      
      // Pass company_id as parameter for header-based approach
      const params = effectiveCompanyId ? { company_id: effectiveCompanyId } : {};
      console.log('Sending params for headers:', params);
      console.log('=== END DEBUG ===');
      
      const response = await leadsAPI.createLead(leadData, params);
      console.log('Lead created successfully:', response);
      
      showSuccess('Lead created successfully');
      setShowCreateForm(false);
      setCreateLeadCompanyId(''); // Reset create modal company selection
      setNewLead({
        full_name: '',
        email: '',
        phone: '',
        organization: '',
        designation: '',
        city: '',
        country: '',
        interests: '',
        notes: '',
        follow_up_date: ''
      });
      fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      showError('Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLead = async (id, leadData) => {
    try {
      // Pass company_id parameter for platform admins
      const params = isPlatformAdmin && selectedCompanyId ? { company_id: selectedCompanyId } : {};
      await leadsAPI.updateLead(id, leadData, params);
      showSuccess('Lead updated successfully');
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update lead';
      showError(`Failed to update lead: ${errorMessage}`);
    }
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        console.log('Attempting to delete lead with ID:', id);
        await leadsAPI.deleteLead(id);
        showSuccess('Lead deleted successfully');
        fetchLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        
        if (error.response?.status === 404) {
          showError('Delete functionality is not available. This feature may be under development.');
        } else if (error.response?.status === 500) {
          showError('Server error occurred while deleting lead. Please try again later.');
        } else {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to delete lead';
          showError(`Failed to delete lead: ${errorMessage}`);
        }
      }
    }
  };

  const handleEditLead = (lead) => {
    // Store original values to detect changes
    const leadWithOriginals = {
      ...lead,
      original_visitor_name: lead.visitor_name,
      original_visitor_email: lead.visitor_email,
      original_visitor_phone: lead.visitor_phone,
      original_visitor_organization: lead.visitor_organization,
      original_visitor_designation: lead.visitor_designation,
      original_visitor_city: lead.visitor_city,
      original_visitor_country: lead.visitor_country
    };
    setEditingLead(leadWithOriginals);
    setShowEditForm(true);
  };

  const handleUpdateLeadSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const validationErrors = [];
    
    if (!validateName(editingLead.visitor_name)) {
      validationErrors.push('Full name must be at least 2 characters long');
    }
    
    if (!validateEmail(editingLead.visitor_email)) {
      validationErrors.push('Please enter a valid email address');
    }
    
    if (!validatePhone(editingLead.visitor_phone)) {
      validationErrors.push('Please enter a valid phone number (exactly 10 digits)');
    }
    
    if (!validateFollowUpDate(editingLead.follow_up_date)) {
      validationErrors.push('Follow-up date is required and must be today or in the future');
    }
    
    if (validationErrors.length > 0) {
      showError(validationErrors.join('; '));
      return;
    }

    try {
      setIsSubmitting(true);
      
      // For platform admins, ensure we have a company context
      if (isPlatformAdmin && !selectedCompanyId && !editingLead.company_id) {
        showError('Please select a company from the dropdown before updating leads');
        return;
      }
      
      // Format the follow_up_date properly for the API
      let formattedFollowUpDate = null;
      if (editingLead.follow_up_date) {
        // Convert date string to proper format if needed
        const date = new Date(editingLead.follow_up_date);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD (API seems to expect this format)
          formattedFollowUpDate = date.toISOString().split('T')[0];
        }
      }
      
      // Update visitor contact information first if it has changed
      if (editingLead.visitor_id && 
          (editingLead.visitor_name !== editingLead.original_visitor_name ||
           editingLead.visitor_email !== editingLead.original_visitor_email ||
           editingLead.visitor_phone !== editingLead.original_visitor_phone ||
           editingLead.visitor_organization !== editingLead.original_visitor_organization ||
           editingLead.visitor_designation !== editingLead.original_visitor_designation ||
           editingLead.visitor_city !== editingLead.original_visitor_city ||
           editingLead.visitor_country !== editingLead.original_visitor_country)) {
        
        console.log('Updating visitor contact information...');
        const visitorData = {
          full_name: editingLead.visitor_name,
          email: editingLead.visitor_email,
          phone: editingLead.visitor_phone,
          organization: editingLead.visitor_organization,
          designation: editingLead.visitor_designation,
          city: editingLead.visitor_city,
          country: editingLead.visitor_country
        };
        
        console.log('Visitor data being sent:', JSON.stringify(visitorData, null, 2));
        
        try {
          await visitorsAPI.updateVisitor(editingLead.visitor_id, visitorData);
          console.log('Visitor information updated successfully');
        } catch (visitorError) {
          console.error('Failed to update visitor information:', visitorError);
          // Continue with lead update even if visitor update fails
          console.log('Continuing with lead update...');
        }
      }
      
      const leadData = {};
      
      // Only include fields that have actually changed
      console.log('=== CHANGE DETECTION DEBUG ===');
      console.log('visitor_organization changed:', editingLead.visitor_organization, '!==', editingLead.original_visitor_organization, '=', editingLead.visitor_organization !== editingLead.original_visitor_organization);
      console.log('visitor_designation changed:', editingLead.visitor_designation, '!==', editingLead.original_visitor_designation, '=', editingLead.visitor_designation !== editingLead.original_visitor_designation);
      console.log('visitor_city changed:', editingLead.visitor_city, '!==', editingLead.original_visitor_city, '=', editingLead.visitor_city !== editingLead.original_visitor_city);
      console.log('visitor_country changed:', editingLead.visitor_country, '!==', editingLead.original_visitor_country, '=', editingLead.visitor_country !== editingLead.original_visitor_country);
      
      if (editingLead.visitor_organization !== editingLead.original_visitor_organization) {
        leadData.organization = editingLead.visitor_organization;
        console.log('Adding organization to update:', editingLead.visitor_organization);
      }
      if (editingLead.visitor_designation !== editingLead.original_visitor_designation) {
        leadData.designation = editingLead.visitor_designation;
        console.log('Adding designation to update:', editingLead.visitor_designation);
      }
      if (editingLead.visitor_city !== editingLead.original_visitor_city) {
        leadData.city = editingLead.visitor_city;
        console.log('Adding city to update:', editingLead.visitor_city);
      }
      if (editingLead.visitor_country !== editingLead.original_visitor_country) {
        leadData.country = editingLead.visitor_country;
        console.log('Adding country to update:', editingLead.visitor_country);
      }
      
      // Always include these fields as they might be edited
      leadData.interests = editingLead.interests;
      leadData.notes = editingLead.notes;
      if (editingLead.follow_up_date) {
        leadData.follow_up_date = formatDateForAPI(editingLead.follow_up_date);
      }
      
      console.log('Final leadData:', JSON.stringify(leadData, null, 2));
      console.log('=== END CHANGE DETECTION DEBUG ===');
      
      console.log('=== FRONTEND DATA ANALYSIS ===');
      console.log('editingLead state:', JSON.stringify(editingLead, null, 2));
      console.log('Form field sources:');
      console.log('  - organization source:', editingLead.visitor_organization || editingLead.organization);
      console.log('  - designation source:', editingLead.visitor_designation || editingLead.designation);
      console.log('  - city source:', editingLead.visitor_city || editingLead.city);
      console.log('  - country source:', editingLead.visitor_country || editingLead.country);
      console.log('Final leadData being sent:', JSON.stringify(leadData, null, 2));
      console.log('=== END FRONTEND ANALYSIS ===');
      
      // Pass company_id parameter for platform admins
      const effectiveCompanyId = isPlatformAdmin ? (selectedCompanyId || editingLead.company_id) : companyId;
      const params = isPlatformAdmin && effectiveCompanyId ? { company_id: effectiveCompanyId } : {};
      console.log('Sending params for update:', params);
      
      const response = await leadsAPI.updateLead(editingLead.id, leadData, params);
      console.log('Lead update response:', response);
      console.log('Full response structure:', JSON.stringify(response, null, 2));
      
      // Check the response structure safely
      const updatedLeadData = response.data?.lead?.lead || response.data?.lead || response.data || response;
      console.log('Updated lead data from response:', updatedLeadData);
      
      // Check if the data was actually updated by comparing sent vs received
      if (updatedLeadData) {
        console.log('=== UPDATE VERIFICATION ===');
        console.log('Sent designation:', leadData.designation);
        console.log('Received designation:', updatedLeadData.lead?.designation);
        console.log('Designation updated:', leadData.designation === updatedLeadData.lead?.designation);
        console.log('Sent organization:', leadData.organization);
        console.log('Received organization:', updatedLeadData.lead?.organization);
        console.log('Organization updated:', leadData.organization === updatedLeadData.lead?.organization);
        
        // Also check all fields for debugging
        console.log('All received fields:', Object.keys(updatedLeadData));
        console.log('Full received data:', JSON.stringify(updatedLeadData, null, 2));
        console.log('=== END VERIFICATION ===');
      } else {
        console.log('No lead data found in response');
      }
      
      showSuccess('Lead updated successfully');
      setShowEditForm(false);
      setEditingLead(null);
      
      // Add a small delay before refreshing to ensure backend has processed the update
      setTimeout(() => {
        console.log('Refreshing leads list after update...');
        // For platform admins, temporarily use the lead's company_id if no company is selected
        if (isPlatformAdmin && !selectedCompanyId && editingLead.company_id) {
          const originalSelectedCompanyId = selectedCompanyId;
          setSelectedCompanyId(editingLead.company_id);
          fetchLeads().then(() => {
            // Restore original selection
            setSelectedCompanyId(originalSelectedCompanyId);
          });
        } else {
          fetchLeads();
        }
      }, 500);
    } catch (error) {
      console.error('Error updating lead:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update lead';
      showError(`Failed to update lead: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'interested': return 'bg-green-100 text-green-800';
      case 'follow_up': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-blue-100 text-blue-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewLead = (lead) => {
    // Navigate to lead details page
    navigate(`/leads/${lead.id}`);
  };

  const handleSearchVisitor = async () => {
    if (!searchPhone.trim()) {
      showError('Please enter a phone number to search');
      return;
    }

    setIsSearching(true);
    try {
      const response = await visitorsAPI.searchVisitor(searchPhone.trim());
      console.log('Visitor search response:', response);
      
      // Handle the response structure: {visitors: Array(1), count: 1}
      if (response && response.visitors && response.visitors.length > 0) {
        const visitor = response.visitors[0]; // Get the first visitor from the array
        setSearchedVisitor(visitor);
        
        // Auto-fill the form with visitor data
        setNewLead({
          full_name: visitor.full_name || '',
          email: visitor.email || '',
          phone: visitor.phone || searchPhone,
          organization: visitor.organization || '',
          designation: visitor.designation || '',
          city: visitor.city || '',
          country: visitor.country || '',
          interests: '',
          notes: '',
          follow_up_date: ''
        });
        
        showSuccess('Visitor found and form populated');
      } else {
        setSearchedVisitor(null);
        showError('No visitor found with this phone number');
      }
    } catch (error) {
      console.error('Error searching visitor:', error);
      setSearchedVisitor(null);
      showError('Error searching visitor. Please try again.');
    } finally {
      setIsSearching(false);
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
            Lead Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage leads generated from visitor interactions
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Lead
          </button>
        </div>
      </div>

      {/* Lead Stats */}
      {leadStats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="bg-blue-50 border-l-4 border-l-blue-600 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Total Leads
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {leadStats.total_leads}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {leadStats.leads_last_30_days} this month
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
                    Today's Leads
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {leadStats.leads_today}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {leadStats.leads_today > 0 ? 'New leads today' : 'No new leads today'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border-l-4 border-l-purple-600 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <CalendarCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Leads with Follow-up
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {leadStats.leads_with_follow_up}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-yellow-600">
                      {leadStats.pending_follow_ups} pending
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border-l-4 border-l-orange-600 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    Last 7 Days
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {leadStats.leads_last_7_days}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      Recent activity
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          {isPlatformAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
                if (isPlatformAdmin) {
                  setSelectedCompanyId('');
                }
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Leads list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Leads ({pagination.total_records || 0})
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Get started by creating a new lead'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.visitor_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{lead.visitor_organization || lead.organization || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{lead.visitor_email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{lead.visitor_phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{lead.visitor_designation || lead.designation || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{lead.visitor_city || lead.city || 'N/A'}, {lead.visitor_country || lead.country || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.company_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">ID: {lead.company_id || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewLead(lead)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditLead(lead)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Edit Lead"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Lead (Note: Delete functionality may not be available)"
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

      {/* Create Lead Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowCreateForm(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create New Lead
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateLeadCompanyId(''); // Reset create modal company selection
                      setNewLead({
                        full_name: '',
                        email: '',
                        phone: '',
                        organization: '',
                        designation: '',
                        city: '',
                        country: '',
                        interests: '',
                        notes: '',
                        follow_up_date: ''
                      });
                      setSearchPhone('');
                      setSearchedVisitor(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateLead} className="space-y-6">
                  {/* Search Visitor Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Search Visitor by Phone</h4>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter phone number</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            value={searchPhone}
                            onChange={(e) => setSearchPhone(e.target.value)}
                            placeholder="Search by phone number..."
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleSearchVisitor}
                          disabled={isSearching}
                          className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {isSearching ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Search className="h-4 w-4 mr-2" />
                          )}
                          Search
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visitor Information Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Visitor Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            value={newLead.phone}
                            onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                            placeholder="Phone number"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={newLead.full_name}
                            onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })}
                            placeholder="Full name"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={newLead.email}
                            onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                            placeholder="Email address"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={newLead.organization}
                            onChange={(e) => setNewLead({ ...newLead, organization: e.target.value })}
                            placeholder="Organization"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Tag className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={newLead.designation}
                            onChange={(e) => setNewLead({ ...newLead, designation: e.target.value })}
                            placeholder="Designation"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={newLead.city}
                            onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                            placeholder="City"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={newLead.country}
                            onChange={(e) => setNewLead({ ...newLead, country: e.target.value })}
                            placeholder="Country"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lead Information Section */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Lead Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Interest Level</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Target className="h-5 w-5 text-gray-400" />
                          </div>
                          <select
                            value={newLead.interests}
                            onChange={(e) => setNewLead({ ...newLead, interests: e.target.value })}
                            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200 appearance-none bg-white"
                          >
                            <option value="">Select Interest Level</option>
                            <option value="Hot">Hot</option>
                            <option value="Warm">Warm</option>
                            <option value="Cold">Cold</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="date"
                            value={newLead.follow_up_date}
                            onChange={(e) => setNewLead({ ...newLead, follow_up_date: e.target.value })}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          value={newLead.notes}
                          onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                          rows={4}
                          placeholder="Detailed notes about this lead interaction..."
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Selection for Platform Admins */}
                  {isPlatformAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <select
                        value={createLeadCompanyId}
                        onChange={(e) => setCreateLeadCompanyId(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        required
                      >
                        <option value="">Select a company</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setCreateLeadCompanyId(''); // Reset create modal company selection
                        setNewLead({
                          full_name: '',
                          email: '',
                          phone: '',
                          organization: '',
                          designation: '',
                          city: '',
                          country: '',
                          interests: '',
                          notes: '',
                          follow_up_date: ''
                        });
                        setSearchPhone('');
                        setSearchedVisitor(null);
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : null}
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditForm && editingLead && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowEditForm(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Edit Lead
                  </h3>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateLeadSubmit} className="space-y-6">
                  {/* Visitor Information Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Visitor Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={editingLead.visitor_name || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, visitor_name: e.target.value })}
                            placeholder="Full name"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            value={editingLead.visitor_phone || ''}
                            placeholder="Phone number"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50 text-gray-600 sm:text-sm cursor-not-allowed"
                            disabled
                            readOnly
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={editingLead.visitor_email || ''}
                            placeholder="Email address"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50 text-gray-600 sm:text-sm cursor-not-allowed"
                            disabled
                            readOnly
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Tag className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={editingLead.visitor_designation || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, visitor_designation: e.target.value })}
                            placeholder="Designation"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={editingLead.visitor_city || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, visitor_city: e.target.value })}
                            placeholder="City"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={editingLead.visitor_country || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, visitor_country: e.target.value })}
                            placeholder="Country"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lead Information Section */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Lead Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Interest Level</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Target className="h-5 w-5 text-gray-400" />
                          </div>
                          <select
                            value={editingLead.interests || ''}
                            onChange={(e) => setEditingLead({ ...editingLead, interests: e.target.value })}
                            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200 appearance-none bg-white"
                          >
                            <option value="">Select Interest Level</option>
                            <option value="Hot">Hot</option>
                            <option value="Warm">Warm</option>
                            <option value="Cold">Cold</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date *</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="date"
                            value={formatDateForInput(editingLead.follow_up_date)}
                            onChange={(e) => setEditingLead({ ...editingLead, follow_up_date: e.target.value })}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          value={editingLead.notes || ''}
                          onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                          rows={4}
                          placeholder="Detailed notes about this lead interaction..."
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors duration-200 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : null}
                      Update Lead
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
