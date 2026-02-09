import { Bell, Search, User, Menu, X, ChevronDown, LogOut, Building2, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsAPI, companiesAPI } from '../utils/apiService';

const Header = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search functionality
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearchLoading(true);
    try {
      const results = [];
      
      // Search leads
      try {
        const leadsResponse = await leadsAPI.getLeads({ search: query, limit: 5 });
        if (leadsResponse.leads) {
          results.push(...leadsResponse.leads.map(lead => ({
            ...lead,
            type: 'lead',
            displayName: lead.full_name,
            subtitle: lead.email || 'No email',
            route: `/leads/${lead.id}`
          })));
        }
      } catch (error) {
        console.log('Error searching leads:', error);
      }

      // Search companies (only for platform admins)
      if (user?.role === 'platform_admin') {
        try {
          const companiesResponse = await companiesAPI.getCompanies({ search: query, limit: 5 });
          if (companiesResponse.companies) {
            results.push(...companiesResponse.companies.map(company => ({
              ...company,
              type: 'company',
              displayName: company.name,
              subtitle: company.company_code || 'No code',
              route: `/companies/${company.id}`
            })));
          }
        } catch (error) {
          console.log('Error searching companies:', error);
        }
      }

      setSearchResults(results.slice(0, 10)); // Limit to 10 results total
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleResultClick = (result) => {
    setShowSearchResults(false);
    setSearchQuery('');
    navigate(result.route);
  };

  const handleSignOut = () => {
    setIsProfileDropdownOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Left side - Mobile menu button and Search */}
          <div className="flex flex-1 items-center">
            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={onMobileMenuToggle}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Search */}
            <div className="flex flex-1 justify-center px-2 lg:ml-6 lg:justify-end">
              <div className="w-full max-w-lg lg:max-w-xs relative" ref={searchRef}>
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="search-field"
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 sm:text-sm sm:leading-6"
                    placeholder="Search leads, companies..."
                    type="search"
                    name="search"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
                  />
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                    {isSearchLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        <span className="ml-2">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((result, index) => (
                          <button
                            key={`${result.type}-${result.id}-${index}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex-shrink-0">
                              {result.type === 'lead' ? (
                                <Users className="h-5 w-5 text-blue-500" />
                              ) : (
                                <Building2 className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {result.displayName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {result.subtitle}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : searchQuery.trim().length >= 2 ? (
                      <div className="p-4 text-center text-gray-500">
                        No results found for "{searchQuery}"
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - User menu and notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              type="button"
              className="rounded-full bg-white p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
              >
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.full_name || user?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role === 'platform_admin' ? 'Platform Admin' : 
                     user?.role === 'company_admin' ? 'Company Admin' : 
                     'User'}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {/* Dropdown menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;