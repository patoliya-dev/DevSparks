'use client';

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  User, 
  LogOut,
  X,
  Check
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isSpeechEnabled: boolean;
  onToggleSpeech: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  isOpen, 
  onClose, 
  isSpeechEnabled, 
  onToggleSpeech 
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'appearance'>('general');

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-48 bg-gray-50 dark:bg-gray-900 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'general'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <SettingsIcon className="h-4 w-4" />
                <span>General</span>
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>Appearance</span>
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'account'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Account</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">General Settings</h3>
                
                {/* Voice Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Voice Settings</h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {isSpeechEnabled ? (
                        <Volume2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Voice Response</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Enable AI voice responses
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onToggleSpeech}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isSpeechEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isSpeechEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
                
                {/* Theme Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {theme === 'light' ? (
                        <Sun className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Moon className="h-5 w-5 text-blue-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {theme === 'light' 
                            ? 'Switch to dark mode for better viewing in low light' 
                            : 'Switch to light mode for better viewing in bright environments'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      {theme === 'light' ? (
                        <Moon className="h-5 w-5" />
                      ) : (
                        <Sun className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Theme Preview */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Light Mode</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Clean and bright interface
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Moon className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">Dark Mode</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Easy on the eyes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account</h3>
                
                {/* User Info */}
                {user && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Information</h4>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Logout */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Actions</h4>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
