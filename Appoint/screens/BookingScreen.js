import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Alert, 
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SuccessPopup from './SuccessPopup';
import { API_BASE_URL } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Moved outside to fix keyboard focus issue
const InputField = ({ icon, label, placeholder, value, onChangeText, keyboardType = 'default' }) => (
  <View className="mb-6">
    <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 ml-4">{label}</Text>
    <View className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 h-14 shadow-sm">
      <MaterialCommunityIcons name={icon} size={20} color="#3b82f6" />
      <TextInput
        className="flex-1 text-slate-800 font-bold ml-3 h-full"
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={{ paddingVertical: Platform.OS === 'android' ? 0 : 10 }}
      />
    </View>
  </View>
);

const BookingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { storeId, timeSlotId, appointmentSlotId } = route.params || {};

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  const fetchTokenAndDecode = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user?.id;
        if (userId) {
          setUserId(userId);
          const response = await axios.get(`${API_BASE_URL}/api/auth/users/${userId}`);
          setName(response.data.name || '');
          setPhoneNumber(response.data.phone || '');
          setAddress(response.data.address || '');
        }
      }
    } catch (error) {
      console.error("Token error:", error);
    }
  }, []);

  useEffect(() => {
    fetchTokenAndDecode();
  }, [fetchTokenAndDecode]);

  useEffect(() => {
    const fetchSlotDetails = async () => {
      try { 
        const response = await axios.get(`${API_BASE_URL}/api/store/stores/${storeId}/slots/${timeSlotId}`);
        setStartTime(response.data.startTime || '');
        setEndTime(response.data.endTime || '');
      } catch (error) {
        console.error('Slot fetch error:', error.message);
        Alert.alert("Error", "Could not load slot details.");
      } finally {
        setLoading(false);
      }
    };

    if (storeId && timeSlotId) fetchSlotDetails();
  }, [storeId, timeSlotId]);

  const handleBookAppointment = async () => {
    if (!name || !phoneNumber || !address) {
      Alert.alert("Required", "Please fill in all details.");
      return;
    }
  
    setBookingLoading(true);
    try {
      const pushToken = await AsyncStorage.getItem("expoPushToken");
      await axios.post(`${API_BASE_URL}/api/store/book`, {
        storeId,
        appointmentSlotId,
        timeSlotId,
        name,
        phoneNumber,
        address,
        pushToken,
      });
      setPopupVisible(true);
    } catch (error) {
      Alert.alert("Failed", "Booking error. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
          <Animatable.View animation="fadeInDown">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="mb-8 w-10 h-10 bg-white items-center justify-center rounded-xl shadow-sm border border-slate-100"
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text className="text-3xl font-black text-slate-900 mb-2">Final Step</Text>
            <Text className="text-slate-500 font-medium text-base mb-8">Confirm your presence and book the slot.</Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200}>
            {/* Slot Summary Card */}
            <View className="bg-blue-600 rounded-3xl p-5 mb-8 shadow-xl shadow-blue-500/20">
               <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-blue-100 font-black tracking-widest uppercase text-[10px]">Selected Slot</Text>
                  <MaterialCommunityIcons name="clock-check" size={20} color="#fff" />
               </View>
               <View className="flex-row items-center">
                  <Text className="text-white text-2xl font-black">{startTime}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#93c5fd" style={{ marginHorizontal: 12 }} />
                  <Text className="text-white text-2xl font-black">{endTime}</Text>
               </View>
            </View>

            <InputField icon="account-outline" label="Full Name" placeholder="Ex: Mahesh Kumar" value={name} onChangeText={setName} />
            <InputField icon="phone-outline" label="Phone Number" placeholder="10-digit number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
            <InputField icon="map-marker-outline" label="Address" placeholder="Your street address" value={address} onChangeText={setAddress} />

            <TouchableOpacity 
              onPress={handleBookAppointment}
              disabled={bookingLoading}
              className="mt-6 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/30"
            >
              <LinearGradient
                colors={['#1e40af', '#3b82f6']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="py-4 items-center justify-center flex-row"
              >
                {bookingLoading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text className="text-white font-black text-lg mr-2 tracking-widest">CONFIRM BOOKING</Text>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </SafeAreaView>

      <SuccessPopup 
        visible={popupVisible} 
        onClose={() => { 
          setPopupVisible(false); 
          navigation.navigate("Dashboard"); 
        }} 
        title="Booking Successful!"
        message="Your slot has been reserved. You can find your ticket in the My Bookings section."
        buttonText="Back to Home"
      />
    </View>
  );
};

export default BookingScreen;
