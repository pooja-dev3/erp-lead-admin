import { useState, useEffect } from 'react';
import { auditLogsAPI } from '../utils/apiService';
import {
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchAuditLogs();
  }, [searchTerm, filterAction, filterUser]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        action: filterAction !== 'all' ? filterAction : undefined,
        user: filterUser !== 'all' ? filterUser : undefined,
      };
      
      const response = await auditLogsAPI.getAuditLogs(params);
      console.log('Audit logs response:', response);
      
      setAuditLogs(response.audit_logs || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource && log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || (log.action && log.action.toLowerCase().replace(' ', '_') === filterAction);
    const matchesUser = filterUser === 'all' || log.user === filterUser;

    return matchesSearch && matchesAction && matchesUser;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueUsers = [...new Set(auditLogs.map(log => log.user))];
  const uniqueActions = [...new Set(auditLogs.map(log => log.action.toLowerCase().replace(' ', '_')))];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all system activities and user actions for compliance and security
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button className="btn btn-secondary mr-3">
            <Download className="h-5 w-5 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Search */}
          <div>
            <label htmlFor="search" className="sr-only">Search audit logs</label>
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
                placeholder="Search by user, action, or resource..."
              />
            </div>
          </div>

          {/* Action filter */}
          <div>
            <label htmlFor="action-filter" className="sr-only">Filter by action</label>
            <select
              id="action-filter"
              name="action-filter"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500 sm:text-sm sm:leading-6"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* User filter */}
          <div>
            <label htmlFor="user-filter" className="sr-only">Filter by user</label>
            <select
              id="user-filter"
              name="user-filter"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500 sm:text-sm sm:leading-6"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="ml-3 text-gray-600">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterAction !== 'all' || filterUser !== 'all' 
                ? 'Try adjusting your filters' 
                : 'No audit logs have been recorded yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Timestamp
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      User
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
                      IP Address
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Details
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-mono text-xs">{log.timestamp}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          {log.user || 'Unknown'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.action || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.resource || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status || 'unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                        {log.ip || 'N/A'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.details || 'No details available'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button className="text-primary-600 hover:text-primary-900">
                          <Eye className="h-4 w-4" />
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
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredLogs.length}</span> of{' '}
                    <span className="font-medium">{filteredLogs.length}</span> results
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{auditLogs.filter(l => l.status === 'success').length}</div>
          <div className="text-sm text-gray-500">Successful Actions</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{auditLogs.filter(l => l.status === 'warning').length}</div>
          <div className="text-sm text-gray-500">Warning Actions</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{auditLogs.filter(l => l.status === 'error').length}</div>
          <div className="text-sm text-gray-500">Error Actions</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{auditLogs.length}</div>
          <div className="text-sm text-gray-500">Total Actions Today</div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;