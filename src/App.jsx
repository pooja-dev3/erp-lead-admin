import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import CompanyAnalytics from './pages/CompanyAnalytics';
import AuditLogs from './pages/AuditLogs';
import Visitors from './pages/Visitors';
import VisitorDetails from './pages/VisitorDetails';
import LeadDetails from './pages/LeadDetails';
import BadgeMapping from './pages/BadgeMapping';
import Exports from './pages/Exports';
import Leads from './pages/Leads';
import CompanyAdmin from './pages/CompanyAdmin';
import Settings from './pages/Settings';
import Employees from './pages/Employees';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';
import './index.css';

// Unauthorized Access Component
const UnauthorizedAccess = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Your current role ({user?.role?.replace('_', ' ')}) doesn't allow access to this resource.
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn btn-primary mr-3"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="btn btn-secondary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children, requiredRole, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRole && user.role !== requiredRole) {
    return <UnauthorizedAccess />;
  }

  // Check if user is in allowed roles list
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <UnauthorizedAccess />;
  }

  return children;
};

// Role-based route component
const RoleBasedRoute = ({ platformAdminComponent, companyAdminComponent, employeeComponent }) => {
  const { isPlatformAdmin, isCompanyAdmin, isEmployee } = useAuth();
  
  if (isPlatformAdmin) return platformAdminComponent;
  if (isCompanyAdmin) return companyAdminComponent;
  if (isEmployee) return employeeComponent;
  
  return <div>Access Denied</div>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          <RoleBasedRoute
            platformAdminComponent={<Dashboard />}
            companyAdminComponent={<Dashboard />}
            employeeComponent={<Dashboard />}
          />
        } />
        <Route path="companies" element={
          <ProtectedRoute requiredRole="platform_admin">
            <Companies />
          </ProtectedRoute>
        } />
        <Route path="companies/:id" element={
          <ProtectedRoute requiredRole="platform_admin">
            <CompanyDetail />
          </ProtectedRoute>
        } />
        <Route path="company-analytics" element={
          <ProtectedRoute requiredRole="platform_admin">
            <CompanyAnalytics />
          </ProtectedRoute>
        } />
        <Route path="audit-logs" element={
          <ProtectedRoute requiredRole="platform_admin">
            <AuditLogs />
          </ProtectedRoute>
        } />
        <Route path="visitors" element={
          <ProtectedRoute allowedRoles={['platform_admin', 'company_admin']}>
            <Visitors />
          </ProtectedRoute>
        } />
        <Route path="visitors/:id" element={
          <ProtectedRoute allowedRoles={['platform_admin', 'company_admin']}>
            <VisitorDetails />
          </ProtectedRoute>
        } />
        <Route path="badge-mapping" element={
          <ProtectedRoute requiredRole="company_admin">
            <BadgeMapping />
          </ProtectedRoute>
        } />
        <Route path="exports" element={
          <ProtectedRoute requiredRole="company_admin">
            <Exports />
          </ProtectedRoute>
        } />
        <Route path="company-admin" element={
          <ProtectedRoute requiredRole="platform_admin">
            <CompanyAdmin />
          </ProtectedRoute>
        } />
        <Route path="employees" element={
          <ProtectedRoute requiredRole="company_admin">
            <Employees />
          </ProtectedRoute>
        } />
        <Route path="employees/:id" element={
          <ProtectedRoute requiredRole="company_admin">
            <Employees />
          </ProtectedRoute>
        } />
        <Route path="analytics" element={
          <ProtectedRoute requiredRole="company_admin">
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetails />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;