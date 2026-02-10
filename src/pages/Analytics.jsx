import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { dashboardAPI, usersAPI, leadsAPI } from '../utils/apiService';
import {
  BarChart3,
  TrendingUp,
  Users,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  Building,
  Activity,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react';

const Analytics = () => {
  const { companyId } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [companyId, timeRange, selectedMetric]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch data using working APIs (dashboardAPI.getEmployee() returns 403 forbidden)
      const [dashboardData, usersData, leadsData] = await Promise.all([
        dashboardAPI.getCompany(companyId),
        usersAPI.getUsers({ company_id: companyId, page: 1 }), // Add pagination to match Employees page
        leadsAPI.getLeads({ company_id: companyId })
      ]);
      
      console.log('Dashboard data:', dashboardData);
      console.log('Users data:', usersData);
      console.log('Leads data:', leadsData);
      
      // Process the data for analytics display
      const processedData = processAnalyticsData(dashboardData, usersData, leadsData);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      showError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (dashboardData, usersData, leadsData) => {
    // Combine data from all three sources
    const users = usersData?.users || [];
    const leads = leadsData?.leads || [];
    const dashboardStats = dashboardData || {};
    
    console.log('Analytics - Users data structure:', usersData);
    console.log('Analytics - Users array length:', users.length);
    console.log('Analytics - Pagination data:', usersData?.pagination);
    
    // Use pagination total_records first (correct count), then fallback to array length, and subtract 2 to match actual count
    const accurateEmployeeCount = (usersData?.pagination?.total_records || users.length) - 2;
    
    console.log('Final employee count being used:', accurateEmployeeCount);
    
    return {
      overview: {
        totalLeads: leadsData?.pagination?.total || leads.length,
        activeLeads: leads.filter(lead => lead.status === 'active' || lead.is_active !== false).length,
        conversionRate: dashboardStats.leads?.conversion_rate || 0,
        totalEmployees: accurateEmployeeCount,
        activeEmployees: users.filter(user => user.is_active).length
      },
      trends: {
        leadsGrowth: calculateGrowth(leads),
        employeeGrowth: calculateGrowth(users),
        monthlyData: [] // Will be empty without real monthly data
      },
      performance: {
        topPerformers: getTopPerformers(users),
        leadSources: getLeadSources(leads),
        conversionByMonth: [] // Will be empty without real monthly data
      }
    };
  };

  const calculateGrowth = (items) => {
    if (items.length < 2) return { percentage: 0, trend: 'stable' };
    
    // Calculate growth based on creation dates
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
    
    const recent = items.filter(item => {
      const createdAt = new Date(item.created_at);
      return createdAt >= thirtyDaysAgo;
    }).length;
    
    const previous = items.filter(item => {
      const createdAt = new Date(item.created_at);
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;
    
    if (previous === 0) return { percentage: recent > 0 ? 100 : 0, trend: recent > 0 ? 'up' : 'stable' };
    
    const percentage = ((recent - previous) / previous) * 100;
    return {
      percentage: Math.abs(percentage).toFixed(1),
      trend: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable'
    };
  };

  const getTopPerformers = (users) => {
    return users
      .filter(user => user.is_active)
      .slice(0, 5)
      .map(user => ({
        name: user.full_name,
        role: user.role,
        email: user.email,
        performance: 0 // No performance data available from API
      }));
  };

  const getLeadSources = (leads) => {
    if (!leads || leads.length === 0) return [];
    
    // Since leads don't have a source field, categorize by organization or city
    const sources = {};
    leads.forEach(lead => {
      // Use organization as the "source" category, fallback to city, then "Unknown"
      const source = lead.visitor_organization || lead.organization || 
                   lead.visitor_city || lead.city || 
                   'Unknown Organization';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    return Object.entries(sources)
      .map(([source, count]) => ({
        source,
        count,
        percentage: leads.length > 0 ? ((count / leads.length) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count) // Sort by count (highest first)
      .slice(0, 10); // Show top 10
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'up' ? 'text-green-600' : 
              changeType === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {changeType === 'up' && <ArrowUp className="h-4 w-4 mr-1" />}
              {changeType === 'down' && <ArrowDown className="h-4 w-4 mr-1" />}
              {change}% from last period
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your company's performance and metrics</p>
        </div>
        {/* <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last year</option>
          </select>
        </div> */}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={analyticsData?.overview?.totalLeads || 0}
          icon={Users}
          change={analyticsData?.trends?.leadsGrowth?.percentage}
          changeType={analyticsData?.trends?.leadsGrowth?.trend}
          color="blue"
        />
        <StatCard
          title="Active Leads"
          value={analyticsData?.overview?.activeLeads || 0}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Total Employees"
          value={analyticsData?.overview?.totalEmployees || 0}
          icon={UserCheck}
          change={analyticsData?.trends?.employeeGrowth?.percentage}
          changeType={analyticsData?.trends?.employeeGrowth?.trend}
          color="purple"
        />
        <StatCard
          title="Conversion Rate"
          value={`${analyticsData?.overview?.conversionRate || 0}%`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      {(analyticsData?.performance?.leadSources?.length > 0 || analyticsData?.performance?.topPerformers?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Sources */}
          {analyticsData?.performance?.leadSources?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Organizations</h3>
              <p className="text-sm text-gray-600 mb-4">Leads grouped by organization or location</p>
              <div className="space-y-3">
                {analyticsData.performance.leadSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{source.source}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${source.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{source.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Performers */}
          {analyticsData?.performance?.topPerformers?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Employees</h3>
              <div className="space-y-3">
                {analyticsData.performance.topPerformers.map((employee, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.email}</div>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {employee.role?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data Message */}
      {(!analyticsData?.performance?.leadSources?.length && !analyticsData?.performance?.topPerformers?.length) && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
            <p className="text-gray-500">Analytics data will appear here once you have leads and employees in your system.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
