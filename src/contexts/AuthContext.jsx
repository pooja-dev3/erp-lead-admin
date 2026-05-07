import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.token && response.user) {
        setUser(response.user);
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle structured validation errors from Joi
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map(d => d.message).join(', ');
        } 
        // Handle simple error messages
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: error.response?.data?.details 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isPlatformAdmin: user?.role === 'platform_admin',
    isCompanyAdmin: user?.role === 'company_admin',
    isEmployee: user?.role === 'employee',
    companyId: user?.company_id
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};