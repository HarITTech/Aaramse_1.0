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

const SlotBookings = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { storeId, slotId, slotTime } = route.params;
  
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
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center mb-5">
                <TouchableOpacity 
                  onPress={() => navigation.goBack()}
                  className="w-10 h-10 bg-white items-center justify-center rounded-xl shadow-sm border border-slate-100 mr-4"
                >
                  <MaterialCommunityIcons name="chevron-left" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View className="flex-1">
                   <Text className="text-xl font-black text-slate-800">Slot Queue</Text>
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
              <View className="bg-white p-10 rounded-[48px] items-center border border-slate-100 shadow-sm w-full">
                <MaterialCommunityIcons name="account-group-outline" size={80} color="#e2e8f0" />
                <Text className="text-slate-800 text-xl font-black mt-6">No bookings yet</Text>
                <Text className="text-slate-400 text-center font-medium mt-2">There are currently no users in the queue for this specific slot.</Text>
              </View>
            </Animatable.View>
          ) : (
            bookings.map((booking, index) => (
              <Animatable.View 
                key={booking._id}
                animation="fadeInUp"
                delay={index * 100}
                className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-slate-100"
              >
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mr-3">
                     <Text className="text-blue-600 font-black text-base">#{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-black text-base">{booking.name}</Text>
                    <View className="flex-row items-center">
                       <MaterialCommunityIcons name="phone-outline" size={10} color="#94a3b8" />
                       <Text className="text-slate-400 font-bold text-[10px] ml-1">{booking.phoneNumber}</Text>
                    </View>
                  </View>
                  {processingId === booking._id ? (
                    <ActivityIndicator color="#3b82f6" />
                  ) : (
                    <View className="bg-blue-50 px-3 py-1.5 rounded-xl">
                      <Text className="text-blue-600 font-black text-[10px] uppercase tracking-widest">In Waiting</Text>
                    </View>
                  )}
                </View>

                <View className="bg-slate-50 p-4 rounded-2xl mb-6">
                   <View className="flex-row items-start">
                      <MaterialCommunityIcons name="map-marker-outline" size={16} color="#64748b" style={{ marginTop: 2 }} />
                      <Text className="text-slate-600 font-medium text-xs ml-2 flex-1">{booking.address}</Text>
                   </View>
                </View>

                <View className="flex-row space-x-3">
                   <TouchableOpacity 
                     onPress={() => handleUpdateStatus(booking._id, 'Canceled')}
                     className="flex-1 bg-red-50 py-4 rounded-xl items-center flex-row justify-center border border-red-100"
                   >
                     <MaterialCommunityIcons name="close-circle-outline" size={18} color="#ef4444" />
                     <Text className="text-red-500 font-black ml-2 uppercase text-[10px] tracking-widest">Cancel</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => handleUpdateStatus(booking._id, 'Completed')}
                     className="flex-1 bg-emerald-500 py-4 rounded-xl items-center flex-row justify-center shadow-lg shadow-emerald-500/20"
                   >
                     <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
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
