import Constants from 'expo-constants';

const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
const fromConfig = Constants.expoConfig?.extra?.apiBaseUrl;

export const API_BASE_URL = (fromEnv || fromConfig || 'http://localhost:5000').replace(/\/+$/, '');
