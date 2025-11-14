import React, { useState } from 'react';
import { Bell, Search, User, LogOut, Settings, UserCircle, Edit, Shield, HelpCircle, Activity, CreditCard, Globe, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { NotificationBadge } from '../ui/NotificationCenter';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const { user, logout } = useAuth();
  const { notifications, removeNotification, success, info, warning, error } = useNotifications();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { t, i18n } = useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      success('Signed Out', 'You have been successfully signed out.');
      logout();
    }
  };

  const handleProfileEdit = () => {
    setIsProfileOpen(false);
    setShowEditProfile(true);
  };

  const handleSettingsClick = () => {
    setIsProfileOpen(false);
    navigate('/settings');
    info('Settings', 'Navigated to settings page');
  };

  const handleHelpClick = () => {
    setIsProfileOpen(false);
    info('Help Center', 'Opening help documentation...');
    // In a real app, this would open help documentation
    window.open('https://help.3mconnect.com', '_blank');
  };

  const handleAccountSecurity = () => {
    setIsProfileOpen(false);
    info('Account Security', 'Opening security settings...');
    navigate('/settings');
  };

  const handleActivityLog = () => {
    setIsProfileOpen(false);
    setShowActivityLog(true);
    info('Activity Log', 'Viewing recent account activity');
  };

  const handleBilling = () => {
    setIsProfileOpen(false);
    setShowBilling(true);
    info('Billing', 'Opening billing and subscription details');
  };

  const handleLanguageChange = () => {
    setIsProfileOpen(false);
    setShowLanguageSelector(!showLanguageSelector);
  };

  const handleToggleDarkMode = () => {
    toggleDarkMode();
    setIsProfileOpen(false);
    if (!darkMode) {
      success('Dark Mode', 'Dark mode enabled');
    } else {
      info('Light Mode', 'Light mode enabled');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleSaveProfile = (profileData: any) => {
    // In a real app, this would update the user profile
    success('Profile Updated', 'Your profile has been successfully updated.');
    setShowEditProfile(false);
  };

  // Mock activity data
  const recentActivity = [
    { id: 1, action: 'Logged in', time: '2 minutes ago', ip: '192.168.1.1' },
    { id: 2, action: 'Updated property listing', time: '1 hour ago', ip: '192.168.1.1' },
    { id: 3, action: 'Added new client', time: '3 hours ago', ip: '192.168.1.1' },
    { id: 4, action: 'Generated report', time: '1 day ago', ip: '192.168.1.1' },
    { id: 5, action: 'Changed password', time: '3 days ago', ip: '192.168.1.2' },
  ];

  return (
    <>
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">{title}</h1>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder={t('common.search')}
              className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
          
          {/* Theme Toggle */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
            aria-label="Toggle Theme"
            onClick={handleToggleDarkMode}
          >
            {darkMode ? (
              <Sun size={20} className="text-amber-500" />
            ) : (
              <Moon size={20} className="text-indigo-600" />
            )}
          </button>
          
          {/* Language Selector */}
          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
              aria-label="Change Language"
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            >
              <Globe size={20} />
              <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full w-4 h-4 flex items-center justify-center">
                {i18n.language.substring(0, 2).toUpperCase()}
              </span>
            </button>
            
            {showLanguageSelector && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowLanguageSelector(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => {
                      i18n.changeLanguage('en');
                      setShowLanguageSelector(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      i18n.language.startsWith('en') ? 'font-semibold bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">EN</span>
                    <span>English</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      i18n.changeLanguage('fr');
                      setShowLanguageSelector(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      i18n.language.startsWith('fr') ? 'font-semibold bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">FR</span>
                    <span>Français</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      i18n.changeLanguage('de');
                      setShowLanguageSelector(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      i18n.language.startsWith('de') ? 'font-semibold bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">DE</span>
                    <span>Deutsch</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      i18n.changeLanguage('ar');
                      setShowLanguageSelector(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      i18n.language.startsWith('ar') ? 'font-semibold bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">AR</span>
                    <span>العربية</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
              aria-label="Notifications"
              onClick={toggleNotifications}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <NotificationBadge />
              )}
            </button>

            {isNotificationsOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsNotificationsOpen(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-[80vh] overflow-y-auto">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      <Bell size={24} className="mx-auto mb-2 text-gray-400" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => {
                        const getIconColor = () => {
                          switch (notification.type) {
                            case 'success': return 'text-green-500';
                            case 'error': return 'text-red-500';
                            case 'warning': return 'text-amber-500';
                            default: return 'text-blue-500';
                          }
                        };
                        
                        return (
                          <div key={notification.id} className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-start">
                              <div className={`mt-1 mr-3 ${getIconColor()}`}>
                                <Bell size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="text-sm text-gray-600 truncate">{notification.message}</p>
                              </div>
                              <button 
                                onClick={() => removeNotification(notification.id)}
                                className="ml-2 text-gray-400 hover:text-gray-600"
                              >
                                <span className="sr-only">Dismiss</span>
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 text-center">
                      <button 
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => notifications.forEach(n => removeNotification(n.id))}
                      >
                        Clear all notifications
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={toggleProfile}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="User profile"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {user?.name ? (
                  <span className="text-blue-800 font-semibold text-sm">
                    {getInitials(user.name)}
                  </span>
                ) : (
                  <User size={16} className="text-blue-800" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.role || 'Admin'}
                </div>
              </div>
            </button>

            {isProfileOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsProfileOpen(false)}
                />
                
                {/* Enhanced Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                  {/* User Info */}
                  <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {user?.name ? (
                          <span className="text-blue-800 font-semibold text-lg">
                            {getInitials(user.name)}
                          </span>
                        ) : (
                          <User size={24} className="text-blue-800" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {user?.name || 'User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user?.email || 'user@example.com'}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          {user?.role || 'Admin'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Section */}
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('header.profile')}
                    </div>
                    
                    <button
                      onClick={handleProfileEdit}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <UserCircle size={16} />
                      <span>{t('common.edit')} {t('header.profile')}</span>
                    </button>
                    
                    <button
                      onClick={handleAccountSecurity}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Shield size={16} />
                      <span>Security & Privacy</span>
                    </button>

                    <button
                      onClick={handleActivityLog}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Activity size={16} />
                      <span>Activity Log</span>
                    </button>

                    <button
                      onClick={handleBilling}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <CreditCard size={16} />
                      <span>Billing & Plans</span>
                    </button>
                  </div>

                  {/* Preferences Section */}
                  <div className="py-1 border-t border-gray-100">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Preferences
                    </div>
                    
                    <button
                      onClick={handleSettingsClick}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings size={16} />
                      <span>{t('common.settings')}</span>
                    </button>

                    <button
                      onClick={handleLanguageChange}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Globe size={16} />
                      <span>{t('header.language')}</span>
                    </button>

                    <button
                      onClick={handleToggleDarkMode}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                      <span>{darkMode ? t('header.lightMode') : t('header.darkMode')}</span>
                    </button>
                  </div>

                  {/* Support Section */}
                  <div className="py-1 border-t border-gray-100">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Support
                    </div>
                    
                    <button
                      onClick={handleHelpClick}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <HelpCircle size={16} />
                      <span>{t('header.help')}</span>
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>{t('auth.signOut')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleSaveProfile({
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
              });
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={user?.name || ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={user?.email || ''}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+212 6XX XXX XXX"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={user?.role || 'Admin'}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500"
                  disabled
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showActivityLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <button
                onClick={() => setShowActivityLog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time} • IP: {activity.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowActivityLog(false);
                  info('Security', 'For detailed security logs, contact your administrator');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View detailed security logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Modal */}
      {showBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Billing & Plans</h2>
              <button
                onClick={() => setShowBilling(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900">Current Plan</h3>
                <p className="text-sm text-blue-700">Professional Plan</p>
                <p className="text-xs text-blue-600 mt-1">$99/month • Renews on Jan 15, 2025</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowBilling(false);
                    info('Billing', 'Upgrade options would be available in full version');
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Upgrade Plan</div>
                  <div className="text-sm text-gray-600">Access premium features</div>
                </button>
                
                <button
                  onClick={() => {
                    setShowBilling(false);
                    info('Billing', 'Payment methods would be managed here');
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Payment Methods</div>
                  <div className="text-sm text-gray-600">Manage cards and billing</div>
                </button>
                
                <button
                  onClick={() => {
                    setShowBilling(false);
                    info('Billing', 'Invoice history would be available here');
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Invoice History</div>
                  <div className="text-sm text-gray-600">Download past invoices</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;