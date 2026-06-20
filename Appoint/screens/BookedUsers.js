import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from '../middleware/ThemeContext';

const BookedUsers = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { storeId, appointmentSlotId, timeSlotId } = route.params || {};

  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [bookedUsers, setBookedUsers] = useState([]);
  const [timeSlot, setTimeSlot] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const usersUrl = `${API_BASE_URL}/api/store/stores/${storeId}/slots/${timeSlotId}/booked-users`;
      const slotUrl = `${API_BASE_URL}/api/store/stores/${storeId}/slots/${timeSlotId}`;
      
      const [usersRes, slotRes] = await Promise.all([
        axios.get(usersUrl),
        axios.get(slotUrl)
      ]);
      
      setBookedUsers(usersRes.data);
      setTimeSlot(slotRes.data);
    } catch (error) {
      console.error("Data fetch error: ", error);
      Alert.alert("Error", "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [storeId, timeSlotId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAppointmentStatus = async (bookedId, status) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = `${API_BASE_URL}/api/store/appointments/complete`;
      await axios.post(
        url, 
        { storeId, bookedId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", `Appointment ${status}!`);
      fetchData();
    } catch (error) {
      console.error("Update status error:", error);
      Alert.alert("Error", `Failed to update status.`);
    }
  };

  const UserCard = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInRight" 
      delay={index * 100}
      className={`rounded-[32px] p-6 mb-4 border ${
        isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-50 shadow-sm'
      }`}
    >
      <View className="flex-row items-center mb-4">
        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <Text className="text-blue-600 font-black text-lg">{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className={`font-black text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`} numberOfLines={1}>{item.name}</Text>
          <Text className={`font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.phoneNumber}</Text>
        </View>
      </View>

      <View className="mb-6">
        <View className="flex-row items-center mb-2">
          <MaterialCommunityIcons name="email-outline" size={16} color={isDark ? "#475569" : "#94a3b8"} />
          <Text className={`ml-2 font-medium text-xs ${isDark ? 'text-slate-350' : 'text-slate-500'}`}>{item.user.email}</Text>
        </View>
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={isDark ? "#475569" : "#94a3b8"} />
          <Text className={`ml-2 font-medium text-xs ${isDark ? 'text-slate-350' : 'text-slate-500'}`} numberOfLines={1}>{item.address}</Text>
        </View>
      </View>

      <View className="flex-row justify-between">
         <TouchableOpacity 
           onPress={() => handleAppointmentStatus(item._id, 'Completed')}
           style={{ width: '48%' }}
           className="bg-emerald-500 py-3.5 rounded-2xl items-center flex-row justify-center shadow-lg shadow-emerald-500/20"
         >
           <MaterialCommunityIcons name="check-bold" size={16} color="#fff" />
           <Text className="text-white font-black ml-2 uppercase text-[10px] tracking-widest">Complete</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           onPress={() => handleAppointmentStatus(item._id, 'Canceled')}
           style={{ width: '48%' }}
           className={`py-3.5 rounded-2xl items-center flex-row justify-center border ${
             isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'
           }`}
         >
           <MaterialCommunityIcons name="close-thick" size={16} color="#ef4444" />
           <Text className="text-red-500 font-black ml-2 uppercase text-[10px] tracking-widest">Cancel</Text>
         </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center mb-6">
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className={`w-10 h-10 items-center justify-center rounded-xl shadow-sm border mr-4 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color={isDark ? '#fff' : '#1e293b'} />
              </TouchableOpacity>
              <View>
                <Text className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Booked Users</Text>
                {timeSlot && (
                  <Text className="text-blue-500 font-bold text-xs">Slot: {timeSlot.startTime} - {timeSlot.endTime}</Text>
                )}
              </View>
            </View>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            data={bookedUsers}
            renderItem={(props) => <UserCard {...props} />}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center mt-20">
                 <MaterialCommunityIcons name="account-off-outline" size={64} color={isDark ? "#1e293b" : "#e2e8f0"} />
                 <Text className={`font-bold mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No users found for this slot</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default BookedUsers;
