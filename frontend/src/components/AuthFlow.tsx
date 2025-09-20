'use client';
import React, { useState } from 'react';
import RegisterScreen from './RegisterScreen';
import LoginScreen from './LoginScreen';
import { useAuth } from '@/contexts/AuthContext';

const AuthFlow: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');
  const { login, register, isLoading } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      setError('');
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      setError('');
      await register(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setError('');
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setError('');
  };

  if (isLogin) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onSwitchToRegister={switchToRegister}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return (
    <RegisterScreen
      onRegister={handleRegister}
      onSwitchToLogin={switchToLogin}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default AuthFlow;
