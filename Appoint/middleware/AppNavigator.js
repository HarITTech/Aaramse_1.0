import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import Dashboard from '../screens/Dashboard';
import { useAuth } from '../middleware/AuthContext';
import CreateStore from '../screens/createstore';
import StorePage from '../screens/Storepage';
import ProfileScreen from '../screens/Profile'
import EditStore from '../screens/EditStore';
import BookedUsers from '../screens/BookedUsers';
import Help from '../screens/Help';
import AboutUs from '../screens/About';
import ContactUs from '../screens/ContactUs';
import History from '../screens/History';
import EditProfile from '../screens/EditProfile';
import SellerDashboard from '../screens/SellerDashboard';
import SlotBookings from '../screens/SlotBookings';
import StoreRecords from '../screens/StoreRecords';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="CreateStore" component={CreateStore} />
          <Stack.Screen name="EditStore" component={EditStore} />
          <Stack.Screen name="StorePage" component={StorePage} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="History" component={History} />
          <Stack.Screen name="BookedUsers" component={BookedUsers} />
          <Stack.Screen name="Help" component={Help} />
          <Stack.Screen name="AboutUs" component={AboutUs} />
          <Stack.Screen name="ContactUs" component={ContactUs} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
          <Stack.Screen name="SlotBookings" component={SlotBookings} />
          <Stack.Screen name="StoreRecords" component={StoreRecords} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
