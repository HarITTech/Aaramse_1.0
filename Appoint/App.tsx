import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './middleware/AppNavigator'; // Adjust path if needed
import { AuthProvider } from './middleware/AuthContext'; // Adjust path if needed

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Notification handler to customize behavior when receiving notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Function to handle errors during the registration
function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

// Register for push notifications function
async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default'
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }

    const projectId = '7d2bb5b1-fc67-46a0-87a3-e49248660333'; // Make sure your project ID is correct
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }

    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // Register for push notifications and set the token
    registerForPushNotificationsAsync()
      .then(async token => {
        setExpoPushToken(token ?? '');
        if (token) {
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('expoPushToken', token);
          } catch (e) {
            console.error('Failed to save push token to async storage', e);
          }
        }
      })
      .catch((error: any) => setExpoPushToken(`${error}`));

    // Add listener for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      // Log title, body, and data from the notification
      console.log('Notification received!');
      console.log('Title:', notification.request.content.title);
      console.log('Body:', notification.request.content.body);
      console.log('Data:', JSON.stringify(notification.request.content.data));
    });

    // Listener for when a user interacts with a notification (e.g., tapping it)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    

    // Cleanup listeners on unmount
    return () => {
      // `removeNotificationSubscription` was removed from newer `expo-notifications`.
      // Listener subscriptions expose `.remove()` instead.
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <StatusBar  hidden={false} translucent={true} />
      <NavigationContainer>
        <AppNavigator />
        {/* Display push token and notifications */}
        {/* <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Your Expo push token: {expoPushToken}</Text>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text>Title: {notification?.request.content.title} </Text>
            <Text>Body: {notification?.request.content.body}</Text>
            <Text>Data: {notification ? JSON.stringify(notification.request.content.data) : ''}</Text>
          </View>
        </View> */}
      </NavigationContainer>
    </AuthProvider>
  );
}
