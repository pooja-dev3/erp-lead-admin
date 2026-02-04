import { useAuth } from '../contexts/AuthContext';
import PlatformAdminDashboard from '../components/dashboards/PlatformAdminDashboard';
import CompanyAdminDashboard from '../components/dashboards/CompanyAdminDashboard';

const Dashboard = () => {
  const { isPlatformAdmin, isCompanyAdmin } = useAuth();

  if (isPlatformAdmin) return <PlatformAdminDashboard />;
  if (isCompanyAdmin) return <CompanyAdminDashboard />;
  
  return <div>Access Denied</div>;
};

export default Dashboard;