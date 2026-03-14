// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token); // Storing token
      console.log('Token saved:', token); // Log the token when saving
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken'); // Removing token
      console.log('Token removed'); // Log when token is removed
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        console.log('Token retrieved:', token); // Log the token when retrieved
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to fetch token:', error);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
