import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  ClipboardList, 
  FileText, 
  Calendar, 
  Settings,
  Menu,
  X,
  Home,
  Wrench,
  UserCog
} from 'lucide-react';

interface SidebarProps {
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { i18n } = useTranslation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const sidebarItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: t('common.dashboard') },
    { path: '/properties', icon: <Building size={20} />, label: t('common.properties') },
    { path: '/clients', icon: <Users size={20} />, label: t('common.clients') },
    { path: '/needs-forms', icon: <ClipboardList size={20} />, label: t('common.needsForms') },
    { path: '/calendar', icon: <Calendar size={20} />, label: t('common.calendar') },
    { path: '/rental-management', icon: <Home size={20} />, label: t('common.rentalManagement') },
    { path: '/maintenance', icon: <Wrench size={20} />, label: t('common.maintenance') },
    { path: '/documents', icon: <FileText size={20} />, label: t('common.documents') },
    { path: '/users', icon: <UserCog size={20} />, label: t('common.users') },
    { path: '/settings', icon: <Settings size={20} />, label: t('common.settings') }
  ];

  const sidebarClass = isMobile
    ? `fixed inset-y-0 ${i18n.language === 'ar' ? 'right-0' : 'left-0'} z-50 w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg transform ${
        isOpen ? 'translate-x-0' : i18n.language === 'ar' ? 'translate-x-full' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`
    : `w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-screen sticky top-0`;

  return (
    <>
      {isMobile && (
        <button
          className={`fixed top-4 ${i18n.language === 'ar' ? 'right-4' : 'left-4'} z-50 p-2 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-md`}
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} className={darkMode ? "text-white" : ""} /> : <Menu size={24} className={darkMode ? "text-white" : ""} />}
        </button>
      )}

      <div className={sidebarClass}>
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>3Mconnect</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Real Estate CRM</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-md transition-colors ${
                      isActive 
                        ? darkMode 
                          ? 'bg-blue-900 text-white' 
                          : 'bg-blue-100 text-blue-900'
                        : darkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                  onClick={closeSidebar}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;