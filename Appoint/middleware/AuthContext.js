// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const login = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token); // Storing token
      await AsyncStorage.removeItem('isGuest'); // Ensure guest state is removed
      console.log('Token saved:', token); // Log the token when saving
      setIsGuest(false);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  };

  const loginAsGuest = async () => {
    try {
      await AsyncStorage.setItem('isGuest', 'true');
      await AsyncStorage.removeItem('userToken'); // Ensure token is cleared
      console.log('Logged in as Guest');
      setIsGuest(true);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save guest state:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken'); // Removing token
      await AsyncStorage.removeItem('isGuest'); // Removing guest state
      console.log('Token & Guest flags removed');
      setIsGuest(false);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const guestFlag = await AsyncStorage.getItem('isGuest');
        console.log('Auth flags retrieved:', { token, guestFlag });
        if (token) {
          setIsGuest(false);
          setIsAuthenticated(true);
        } else if (guestFlag === 'true') {
          setIsGuest(true);
          setIsAuthenticated(true);
        } else {
          setIsGuest(false);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to fetch auth status:', error);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isGuest, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
