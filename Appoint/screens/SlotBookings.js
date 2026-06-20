import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
  Platform
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import CustomAlert from "../components/CustomAlert";
import { useTheme } from '../middleware/ThemeContext';

const SlotBookings = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { storeId, slotId, slotTime } = route.params;

  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  const fetchBookings = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(
        `${API_BASE_URL}/api/store/stores/${storeId}/slots/${slotId}/booked-users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(response.data);
    } catch (error) {
      console.error("Fetch bookings error:", error);
      // If 404, it might just mean no bookings yet
      if (error.response?.status === 404) {
        setBookings([]);
      } else {
        setAlertConfig({ title: "Error", message: "Failed to load bookings.", type: "error" });
        setAlertVisible(true);
      }
    } finally {
      setLoading(false);
    }
  }, [storeId, slotId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const handleUpdateStatus = (bookedId, status) => {
    Alert.alert(
      `${status} Appointment`,
      `Are you sure you want to mark this appointment as ${status.toLowerCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            setProcessingId(bookedId);
            try {
              const token = await AsyncStorage.getItem("userToken");
              await axios.post(
                `${API_BASE_URL}/api/store/appointments/complete`,
                { storeId, bookedId, status },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setAlertConfig({ 
                title: "Success", 
                message: `Appointment marked as ${status.toLowerCase()}.`, 
                type: "success" 
              });
              setAlertVisible(true);
              fetchBookings(); // Refresh list
            } catch (error) {
              console.error("Update status error:", error);
              setAlertConfig({ title: "Error", message: "Failed to update appointment.", type: "error" });
              setAlertVisible(true);
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center mb-5">
                <TouchableOpacity 
                  onPress={() => navigation.goBack()}
                  className={`w-10 h-10 items-center justify-center rounded-xl shadow-sm border mr-4 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}
                >
                  <MaterialCommunityIcons name="chevron-left" size={24} color={isDark ? '#fff' : '#1e293b'} />
                </TouchableOpacity>
                <View className="flex-1">
                   <Text className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Slot Queue</Text>
                   <Text className="text-blue-500 font-bold text-[10px] uppercase tracking-widest">{slotTime}</Text>
                </View>
            </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {bookings.length === 0 ? (
            <Animatable.View animation="fadeInUp" className="items-center justify-center mt-20">
              <View className={`p-10 rounded-[48px] items-center border shadow-sm w-full ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}>
                <MaterialCommunityIcons name="account-group-outline" size={80} color={isDark ? "#1e293b" : "#e2e8f0"} />
                <Text className={`text-xl font-black mt-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No bookings yet</Text>
                <Text className={`text-center font-medium mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>There are currently no users in the queue for this specific slot.</Text>
              </View>
            </Animatable.View>
          ) : (
            bookings.map((booking, index) => (
              <Animatable.View 
                key={booking._id}
                animation="fadeInUp"
                delay={index * 100}
                className={`rounded-[32px] p-6 mb-6 border ${
                  isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <View className="flex-row items-center mb-4">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                     <Text className="text-blue-600 font-black text-base">#{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-black text-base ${isDark ? 'text-slate-150' : 'text-slate-900'}`}>{booking.name}</Text>
                    <View className="flex-row items-center">
                       <MaterialCommunityIcons name="phone-outline" size={10} color={isDark ? "#475569" : "#94a3b8"} />
                       <Text className={`font-bold text-[10px] ml-1 ${isDark ? 'text-slate-450' : 'text-slate-400'}`}>{booking.phoneNumber}</Text>
                    </View>
                  </View>
                  {processingId === booking._id ? (
                    <ActivityIndicator color="#3b82f6" />
                  ) : (
                    <View className={`px-3 py-1.5 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                      <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">In Waiting</Text>
                    </View>
                  )}
                </View>

                <View className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                   <View className="flex-row items-start">
                      <MaterialCommunityIcons name="map-marker-outline" size={16} color={isDark ? "#475569" : "#64748b"} style={{ marginTop: 2 }} />
                      <Text className={`font-medium text-xs ml-2 flex-1 ${isDark ? 'text-slate-350' : 'text-slate-600'}`}>{booking.address}</Text>
                   </View>
                </View>

                <View className="flex-row justify-between">
                   <TouchableOpacity 
                     onPress={() => handleUpdateStatus(booking._id, 'Canceled')}
                     style={{ width: '48%' }}
                     className={`py-3.5 rounded-2xl items-center flex-row justify-center border ${
                       isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'
                     }`}
                   >
                     <MaterialCommunityIcons name="close-circle-outline" size={16} color="#ef4444" />
                     <Text className="text-red-500 font-black ml-2 uppercase text-[10px] tracking-widest">Cancel</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => handleUpdateStatus(booking._id, 'Completed')}
                     style={{ width: '48%' }}
                     className="bg-emerald-500 py-3.5 rounded-2xl items-center flex-row justify-center shadow-lg shadow-emerald-500/20"
                   >
                     <MaterialCommunityIcons name="check-circle-outline" size={16} color="#fff" />
                     <Text className="text-white font-black ml-2 uppercase text-[10px] tracking-widest">Complete</Text>
                   </TouchableOpacity>
                </View>
              </Animatable.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <CustomAlert 
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </View>
  );
};

export default SlotBookings;
