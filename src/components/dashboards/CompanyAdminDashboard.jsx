import {
  Users,
  Building2,
  BarChart3,
  TrendingUp,
  UserCheck,
  Target,
  Activity,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Badge,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../utils/apiService';
import { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

// Date formatting utility
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // If less than 24 hours, show relative time
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      // For older dates, show formatted date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Date formatting utility for visit dates
const formatVisitDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // For visit dates, show a more readable format
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting visit date:', error);
    return 'Invalid Date';
  }
};

const CompanyAdminDashboard = () => {
  const { user, companyId } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getCompany(companyId);
      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard API Error:', error);
      showNotification.showError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load dashboard data</p>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Employees',
      value: dashboardData?.users?.employees || 0,
      change: 'Active staff members',
      changeType: 'positive',
      icon: UserCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Total Leads',
      value: dashboardData?.leads?.total || 0,
      change: `${dashboardData?.leads?.last_30_days || 0} this month`,
      changeType: 'positive',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: "Today's Leads",
      value: dashboardData?.leads?.today || 0,
      change: dashboardData?.leads?.today > 0 ? 'New leads today' : 'No new leads today',
      changeType: dashboardData?.leads?.today > 0 ? 'positive' : 'neutral',
      icon: Activity,
      color: dashboardData?.leads?.today > 0 ? 'text-emerald-600' : 'text-gray-600',
      bgColor: dashboardData?.leads?.today > 0 ? 'bg-emerald-50' : 'bg-gray-50'
    },
    {
      name: 'Active Employees',
      value: dashboardData?.employee_stats?.filter(emp => parseInt(emp.leads_count) > 0)?.length || 0,
      change: `of ${dashboardData?.users?.employees || 0} total`,
      changeType: 'neutral',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Company Status',
      value: dashboardData?.company?.status || 'Unknown',
      change: dashboardData?.company?.company_code || '',
      changeType: dashboardData?.company?.status === 'active' ? 'positive' : 'warning',
      icon: Building2,
      color: dashboardData?.company?.status === 'active' ? 'text-teal-600' : 'text-amber-600',
      bgColor: dashboardData?.company?.status === 'active' ? 'bg-teal-50' : 'bg-amber-50'
    },
    {
      name: 'Top Performer',
      value: dashboardData?.employee_stats?.sort((a, b) => parseInt(b.leads_count) - parseInt(a.leads_count))[0]?.full_name?.trim() || 'N/A',
      change: `${dashboardData?.employee_stats?.sort((a, b) => parseInt(b.leads_count) - parseInt(a.leads_count))[0]?.leads_count || 0} leads`,
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      name: 'Last 7 Days Activity',
      value: dashboardData?.employee_stats?.reduce((sum, emp) => sum + parseInt(emp.leads_last_7_days || 0), 0),
      change: 'Employee leads generated',
      changeType: 'positive',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      name: 'Total Users',
      value: dashboardData?.users?.total || 0,
      change: `${dashboardData?.users?.employees || 0} employees`,
      changeType: 'positive',
      icon: UserPlus,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
  ];

  const recentActivity = dashboardData?.recent_leads || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Company Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your visitors today.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className={`card ${stat.bgColor} border-l-4 border-l-${stat.color.replace('text-', '')}`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} rounded-lg p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    {stat.change && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'warning' ? 'text-yellow-600' : 
                        'text-gray-500'
                      }`}>
                        {stat.change}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Recent Activity
          </h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={activity.id || index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <UserCheck className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.visitor_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatVisitDate(activity.created_at)} - {activity.employee_name}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Lead Generated
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/visitors'}
              className="btn btn-primary text-center"
            >
              <UserCheck className="h-5 w-5 mr-2 inline" />
              Check In Visitor
            </button>
            <button
              onClick={() => window.location.href = '/leads'}
              className="btn btn-secondary text-center"
            >
              <Target className="h-5 w-5 mr-2 inline" />
              View Leads
            </button>
            <button
              onClick={() => window.location.href = '/badge-mapping'}
              className="btn btn-secondary text-center"
            >
              <Badge className="h-5 w-5 mr-2 inline" />
              Badge Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;
