import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationContainer from './Notification';
import { useState } from 'react';

const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleMobileMenuClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-6 pb-4 shadow-lg sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <Sidebar isMobile={true} onClose={handleMobileMenuClose} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header
          onMobileMenuToggle={handleMobileMenuToggle}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Notifications */}
      <NotificationContainer />
    </div>
  );
};

export default Layout;