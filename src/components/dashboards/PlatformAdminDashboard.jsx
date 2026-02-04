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
  Server,
  Zap
} from 'lucide-react';
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

const PlatformAdminDashboard = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getOverview();
      setDashboardData(data);
    } catch (error) {
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
      name: 'Total Companies',
      value: dashboardData.companies?.total || 0,
      change: `${dashboardData.companies?.active || 0} active`,
      changeType: 'positive',
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      name: 'Total Users',
      value: dashboardData.users?.total || 0,
      change: `${dashboardData.users?.platform_admins || 0} admins`,
      changeType: 'positive',
      icon: Users,
      color: 'text-green-600'
    },
    {
      name: 'Total Visitors',
      value: dashboardData.visitors?.total || 0,
      change: `+${dashboardData.visitors?.last_30_days || 0} this month`,
      changeType: 'positive',
      icon: UserCheck,
      color: 'text-purple-600'
    },
    {
      name: 'Total Leads',
      value: dashboardData.leads?.total || 0,
      change: `+${dashboardData.leads?.last_30_days || 0} this month`,
      changeType: 'positive',
      icon: Target,
      color: 'text-orange-600'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'lead': return Users;
      case 'event': return Calendar;
      case 'company': return Building2;
      case 'conversion': return Target;
      case 'visitor': return UserCheck;
      default: return Activity;
    }
  };

  const recentActivity = (dashboardData.recent_activity || []).map(activity => ({
    ...activity,
    icon: getActivityIcon(activity.type)
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Platform Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your visitor data collection platform performance
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    {stat.change && (
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-500'
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id || activity.date} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {activity.icon && <activity.icon className="h-8 w-8 text-primary-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.company || `${activity.type} activity`}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {activity.action || activity.count} {activity.type}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDateTime(activity.time || activity.date)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/companies'}
            className="btn btn-primary text-center"
          >
            <Building2 className="h-5 w-5 mr-2 inline" />
            Manage Companies
          </button>
          <button
            onClick={() => window.location.href = '/visitors'}
            className="btn btn-secondary text-center"
          >
            <UserCheck className="h-5 w-5 mr-2 inline" />
            View Visitors
          </button>
          <button
            onClick={() => window.location.href = '/leads'}
            className="btn btn-secondary text-center"
          >
            <Target className="h-5 w-5 mr-2 inline" />
            Manage Leads
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformAdminDashboard;
