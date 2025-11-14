import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Building, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isLoading, isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const { success } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  // Get the intended destination or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    // If already authenticated, redirect to intended destination
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }

    // Load saved email if remember me was checked
    const savedEmail = localStorage.getItem('userEmail');
    const savedRememberMe = localStorage.getItem('rememberMe');

    if (savedEmail && savedRememberMe === 'true') {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      await login(email, password, rememberMe);
      success('Login Successful', 'Welcome back to 3Mconnect CRM!');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err.message ||
          'Login failed. Please check your credentials and try again.'
      );
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'} flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Building size={32} className="text-white" />
          </div>
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-900'} mb-2`}>3Mconnect</h1>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>Real Estate CRM</p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {t('common.streamlinePropertyManagement')}
          </p>
        </div>

        {/* Login Form */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} py-10 px-8 shadow-xl rounded-2xl border`}>
          <div className="mb-8">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} text-center`}>
              {t('auth.welcomeBack')}
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-center mt-2`}>
              {t('auth.signInToContinue')}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className={`${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-400'} border-l-4 p-4 rounded-md`}>
                <div className="flex items-center">
                  <AlertCircle size={20} className="text-red-500 mr-2" />
                  <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-700'}`}>{error}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}
              >
                {t('auth.email')}
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3 pl-12 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 placeholder-gray-400'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                  placeholder={t('auth.enterEmail')}
                />
                <Mail className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-3.5 h-5 w-5 text-gray-400`} />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3 pl-12 pr-12 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 placeholder-gray-400'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                  placeholder={t('auth.enterPassword')}
                />
                <Lock className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-3.5 h-5 w-5 text-gray-400`} />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={`absolute ${i18n.language === 'ar' ? 'left-4' : 'right-4'} top-3.5 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded transition-colors ${i18n.language === 'ar' ? 'ml-0 mr-3' : 'mr-0 ml-3'}`}
                />
                <label
                  htmlFor="remember-me"
                  className={`${i18n.language === 'ar' ? 'mr-3 ml-0' : 'ml-3 mr-0'} block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}
                >
                  {t('auth.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className={`font-semibold ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.alert(
                      'Password reset functionality would be implemented here'
                    );
                  }}
                >
                  {t('auth.forgotPassword')}
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  t('auth.signIn')
                )}
              </button>
            </div>
          </form>

          {/* Demo Login Info */}
          <div className={`mt-6 p-4 ${darkMode ? 'bg-blue-900 border-blue-800' : 'bg-blue-50 border-blue-200'} rounded-lg border`}>
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-800'} mb-2`}>
              Getting Started:
            </h3>
            <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'} mb-2`}>
              Create your account by signing up. After creating an account, you can log in with your credentials.
            </p>
            <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Once logged in, you can manage properties, clients, and more.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Don't have an account?{' '}
            <a
              href="/signup"
              className={`font-semibold ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;