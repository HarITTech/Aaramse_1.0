import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  StyleSheet
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from "axios";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomAlert from "../components/CustomAlert";
import { useTheme } from '../middleware/ThemeContext';

const UpdateSlots = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { storeId } = route.params || {};

  const isDark = theme === 'dark';

  const [storeDetails, setStoreDetails] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Date and Time selection states
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisibility] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);

  // Alert config
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null, cancelText: null });

  const fetchStoreDetails = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/store/findstore/${storeId}`);
      setStoreDetails(response.data);
      setSlots(response.data.appointmentSlots || []);
    } catch (error) {
      console.error("Error fetching store details for slots:", error.message);
      setAlertConfig({ title: "Error", message: "Failed to load store slots.", type: "error" });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStoreDetails();
  }, [fetchStoreDetails]);

  const handleAddAppointmentSlot = async () => {
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      Alert.alert("Required", "Please select date, start and end time.");
      return;
    }

    setSaving(true);
    const newSlot = {
      date: selectedDate,
      timeSlots: [{ startTime: selectedStartTime, endTime: selectedEndTime }],
    };

    try {
      await axios.post(`${API_BASE_URL}/api/store/stores/${storeId}/appointment-slot/`, newSlot);
      fetchStoreDetails();
      setSelectedDate(null);
      setSelectedStartTime(null);
      setSelectedEndTime(null);
      setAlertConfig({ title: "Success", message: "Slot added successfully!", type: "success" });
      setAlertVisible(true);
    } catch (error) {
      console.error("Failed to add slot:", error.message);
      setAlertConfig({ title: "Error", message: "Failed to add slot. Please try again.", type: "error" });
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSlot = async (slotId, timeSlotId) => {
    setAlertConfig({
      title: "Remove Slot",
      message: "Are you sure you want to delete this time slot?",
      type: "warning",
      buttonText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        setAlertVisible(false);
        try {
          await axios.delete(`${API_BASE_URL}/api/store/stores/${storeId}/slot/${slotId}/${timeSlotId}`);
          fetchStoreDetails();
        } catch (error) {
          console.error("Failed to remove slot:", error.message);
          setAlertConfig({ title: "Error", message: "Could not remove slot.", type: "error" });
          setAlertVisible(true);
        }
      }
    });
    setAlertVisible(true);
  };

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Loading slots editor...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView className="flex-1">
        {/* Header */}
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
            <View className="flex-1">
              <Text className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`} numberOfLines={1}>Daily Slots</Text>
              <Text className="text-blue-500 font-bold text-[10px] uppercase tracking-widest" numberOfLines={1}>
                {storeDetails?.name || "Manage store slots"}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
        >
          {/* Add Slot Card */}
          <Animatable.View animation="fadeInUp" className={`p-6 rounded-[32px] border mb-8 ${
            isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              <MaterialCommunityIcons name="calendar-plus" size={20} color="#3b82f6" /> Add Appointment Slot
            </Text>
            
            <View className={`p-5 rounded-[24px] border ${
              isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
            }`}>
              <TouchableOpacity 
                onPress={() => setDatePickerVisibility(true)} 
                className={`flex-row items-center border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
              >
                <MaterialCommunityIcons name="calendar" size={18} color="#3b82f6" />
                <Text className={`ml-3 font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {selectedDate || "Choose Date"}
                </Text>
              </TouchableOpacity>
              
              <View className="flex-row items-center py-4">
                <TouchableOpacity onPress={() => setStartTimePickerVisibility(true)} className="flex-1 flex-row items-center">
                  <MaterialCommunityIcons name="clock-start" size={18} color="#10b981" />
                  <Text className={`ml-3 font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {selectedStartTime || "Start Time"}
                  </Text>
                </TouchableOpacity>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#cbd5e1" className="mx-2" />
                <TouchableOpacity onPress={() => setEndTimePickerVisibility(true)} className="flex-1 flex-row items-center">
                  <MaterialCommunityIcons name="clock-end" size={18} color="#ef4444" />
                  <Text className={`ml-3 font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {selectedEndTime || "End Time"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                onPress={handleAddAppointmentSlot}
                disabled={saving}
                className="bg-blue-600 rounded-2xl py-3.5 mt-2 items-center shadow-lg shadow-blue-500/20"
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase tracking-widest">Add New Slot</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Active Slots list */}
          <Text className={`text-xs font-bold uppercase tracking-widest mb-4 ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Daily Slots</Text>
          
          {slots.length === 0 ? (
            <Animatable.View animation="fadeInUp" className="items-center justify-center mt-6">
              <View className={`p-10 rounded-[32px] items-center border shadow-sm w-full ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={60} color={isDark ? "#1e293b" : "#cbd5e1"} />
                <Text className={`font-bold mt-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No appointment slots configured yet.</Text>
              </View>
            </Animatable.View>
          ) : (
            slots.map((slot, sIdx) => (
              <Animatable.View 
                key={sIdx}
                animation="fadeInUp"
                delay={sIdx * 100}
                className={`p-5 rounded-[32px] border mb-4 ${
                  isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <Text className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {new Date(slot.date).toDateString()}
                  </Text>
                  <View className={`px-2.5 py-1 rounded-xl border ${
                    isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'
                  }`}>
                    <Text className={`font-black text-[8px] uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {slot.timeSlots?.length || 0} Slots
                    </Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap justify-start">
                  {slot.timeSlots?.map((ts, tsIdx) => (
                    <View 
                      key={tsIdx}
                      style={{ width: '48%', marginRight: (tsIdx + 1) % 2 === 0 ? 0 : '4%', marginBottom: 10 }}
                      className={`p-3 rounded-2xl border flex-row justify-between items-center ${
                        isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100 shadow-sm'
                      }`}
                    >
                      <View className="flex-1 pr-1">
                        <Text className={`font-black text-[10px] ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{ts.startTime}</Text>
                        <Text className={`text-[8px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>to {ts.endTime}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveSlot(slot._id, ts._id)}>
                        <MaterialCommunityIcons name="delete-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </Animatable.View>
            ))
          )}
        </ScrollView>

        {/* Date Time Picker Modals */}
        <DateTimePickerModal 
          isVisible={isDatePickerVisible} 
          mode="date" 
          onConfirm={(d) => { 
            setSelectedDate(d.toISOString().split("T")[0]); 
            setDatePickerVisibility(false); 
          }} 
          onCancel={() => setDatePickerVisibility(false)} 
        />
        
        <DateTimePickerModal 
          isVisible={isStartTimePickerVisible} 
          mode="time" 
          onConfirm={(t) => { 
            setSelectedStartTime(t.toTimeString().split(" ")[0].substring(0, 5)); 
            setStartTimePickerVisibility(false); 
          }} 
          onCancel={() => setStartTimePickerVisibility(false)} 
        />
        
        <DateTimePickerModal 
          isVisible={isEndTimePickerVisible} 
          mode="time" 
          onConfirm={(t) => { 
            setSelectedEndTime(t.toTimeString().split(" ")[0].substring(0, 5)); 
            setEndTimePickerVisibility(false); 
          }} 
          onCancel={() => setEndTimePickerVisibility(false)} 
        />

        {/* Alert */}
        <CustomAlert 
          visible={alertVisible}
          onClose={() => setAlertVisible(false)}
          onConfirm={alertConfig.onConfirm}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttonText={alertConfig.buttonText}
          cancelText={alertConfig.cancelText}
        />
      </SafeAreaView>
    </View>
  );
};

export default UpdateSlots;
