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
import { API_BASE_URL } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";

const BookedUsers = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { storeId, appointmentSlotId, timeSlotId } = route.params || {};

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
      const url = `${API_BASE_URL}/api/store/appointments/complete`;
      await axios.post(url, { storeId, bookedId, status });
      Alert.alert("Success", `Appointment ${status}!`);
      fetchData();
    } catch (error) {
      Alert.alert("Error", `Failed to update status.`);
    }
  };

  const UserCard = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInRight" 
      delay={index * 100}
      className="bg-white rounded-[32px] p-6 mb-4 shadow-sm border border-slate-50"
    >
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-4">
          <Text className="text-blue-600 font-black text-lg">{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-slate-900 font-black text-lg" numberOfLines={1}>{item.name}</Text>
          <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">{item.phoneNumber}</Text>
        </View>
      </View>

      <View className="space-y-2 mb-6">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="email-outline" size={16} color="#94a3b8" />
          <Text className="text-slate-500 ml-2 font-medium">{item.user.email}</Text>
        </View>
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="map-marker-outline" size={16} color="#94a3b8" />
          <Text className="text-slate-500 ml-2 font-medium" numberOfLines={1}>{item.address}</Text>
        </View>
      </View>

      <View className="flex-row space-x-3">
         <TouchableOpacity 
           onPress={() => handleAppointmentStatus(item._id, 'Completed')}
           className="flex-1 bg-emerald-500 py-4 rounded-2xl items-center flex-row justify-center"
         >
           <MaterialCommunityIcons name="check-bold" size={18} color="#fff" />
           <Text className="text-white font-black ml-2 uppercase text-xs tracking-widest">Complete</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           onPress={() => handleAppointmentStatus(item._id, 'Canceled')}
           className="flex-1 bg-red-50 py-4 rounded-2xl items-center flex-row justify-center"
         >
           <MaterialCommunityIcons name="close-thick" size={18} color="#ef4444" />
           <Text className="text-red-500 font-black ml-2 uppercase text-xs tracking-widest">Cancel</Text>
         </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center mb-6">
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="w-10 h-10 bg-white items-center justify-center rounded-xl shadow-sm border border-slate-100 mr-4"
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color="#1e293b" />
              </TouchableOpacity>
              <View>
                <Text className="text-2xl font-black text-slate-800">Booked Users</Text>
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
                 <MaterialCommunityIcons name="account-off-outline" size={64} color="#e2e8f0" />
                 <Text className="text-slate-400 font-bold mt-4">No users found for this slot</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default BookedUsers;
