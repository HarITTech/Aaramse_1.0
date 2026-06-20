import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
  RefreshControl,
  StatusBar,
  Animated,
  ActivityIndicator
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomAlert from "../components/CustomAlert";
import { useTheme } from '../middleware/ThemeContext';

// Moved outside to fix keyboard focus issue
const InputField = ({ icon, label, placeholder, value, onChangeText, multiline = false, keyboardType = 'default', isDark }) => (
  <View className="mb-5">
    <Text className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</Text>
    <View className={`flex-row items-center border rounded-2xl px-4 shadow-sm ${multiline ? 'h-28 pt-3' : 'h-14'} ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
    }`}>
      <MaterialCommunityIcons name={icon} size={18} color="#3b82f6" style={multiline ? { marginTop: 0 } : {}} />
      <TextInput
        className={`flex-1 font-semibold ml-3 h-full text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{ paddingVertical: Platform.OS === 'android' ? 0 : 8 }}
      />
    </View>
  </View>
);

const EditStore = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { storeId } = route.params || {};

  const isDark = theme === 'dark';

  const [storeDetails, setStoreDetails] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    fname: "",
    type: "",
    description: "",
    location: "",
    phoneNumber: "",
    aadharNumber: "",
    appointmentSlots: [],
  });
  const [images, setImages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisibility] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null, cancelText: null });

  const fetchStoreDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/store/findstore/${storeId}`);
      setStoreDetails(response.data);
      setFormData({
        name: response.data.name,
        fname: response.data.fname,
        type: response.data.type,
        description: response.data.description,
        location: response.data.location,
        phoneNumber: response.data.phoneNumber,
        aadharNumber: response.data.aadharNumber,
        appointmentSlots: response.data.appointmentSlots || [],
      });
      setImages(response.data.images || []);
    } catch (error) {
      console.error("Error fetching store details:", error.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStoreDetails();
  }, [fetchStoreDetails]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri } = result.assets[0];
        setImages([...images, { uri, isNew: true }]);
      }
    } catch (error) {
      console.error("Error picking image:", error.message);
    }
  };

  const handleRemoveImage = async (image) => {
    if (image.isNew) {
      setImages(images.filter(img => img.uri !== image.uri));
      return;
    }

    setAlertConfig({
      title: "Remove Image",
      message: "Are you sure you want to delete this photo from the store?",
      type: "warning",
      buttonText: "Remove",
      cancelText: "Cancel",
      onConfirm: async () => {
        setAlertVisible(false);
        try {
          await axios.delete(`${API_BASE_URL}/api/store/remove-image`, {
            data: { storeId: storeId, imageId: image.public_id },
          });
          setImages(images.filter((img) => img.public_id !== image.public_id));
        } catch (error) {
          setAlertConfig({ title: "Error", message: "Failed to remove image", type: "error" });
          setAlertVisible(true);
        }
      }
    });
    setAlertVisible(true);
  };

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
      setAlertConfig({ title: "Success", message: "Slot added successfully!", type: "success" });
      setAlertVisible(true);
    } catch (error) {
      setAlertConfig({ title: "Error", message: "Failed to add slot.", type: "error" });
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const phoneRegex = /^[6-9][0-9]{9}$/;
    const aadharRegex = /^[0-9]{12}$/;

    if (!formData.name.trim() || !formData.location.trim()) {
      setAlertConfig({ title: "Error", message: "Store Name and Location cannot be empty.", type: "error" });
      setAlertVisible(true);
      return;
    }

    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      setAlertConfig({ title: "Error", message: "Please enter a valid 10-digit mobile number.", type: "error" });
      setAlertVisible(true);
      return;
    }

    if (formData.aadharNumber && !aadharRegex.test(formData.aadharNumber)) {
      setAlertConfig({ title: "Error", message: "Please enter a valid 12-digit Aadhaar number.", type: "error" });
      setAlertVisible(true);
      return;
    }

    setSaving(true);
    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "appointmentSlots") {
        form.append(key, JSON.stringify(formData[key]));
      } else {
        form.append(key, formData[key]);
      }
    });

    images.forEach((image, index) => {
      if (image.isNew) {
        const uriParts = image.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];
        form.append("images", {
          uri: Platform.OS === "ios" ? image.uri.replace("file://", "") : image.uri,
          name: `photo_update_${index}.${fileType}`,
          type: `image/${fileType}`,
        });
      }
    });

    try {
      await axios.put(`${API_BASE_URL}/api/store/update/${storeId}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAlertConfig({ 
        title: "Success", 
        message: "Store updated successfully!", 
        type: "success",
        onConfirm: () => {
          setAlertVisible(false);
          navigation.goBack();
        }
      });
      setAlertVisible(true);
    } catch (error) {
      setAlertConfig({ title: "Error", message: "Failed to update store.", type: "error" });
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
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView className="flex-1">
        {isOffline && (
          <Animatable.View animation="slideInDown" className="bg-red-500 py-1.5 items-center flex-row justify-center z-50">
            <MaterialCommunityIcons name="wifi-off" size={14} color="white" />
            <Text className="text-white font-black text-[9px] uppercase tracking-widest ml-2">Offline Mode - Edits may not save</Text>
          </Animatable.View>
        )}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStoreDetails(); setRefreshing(false); }} />}
        >
          <Animatable.View animation="fadeInDown">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 w-10 h-10 items-center justify-center rounded-xl shadow-sm border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={isDark ? '#fff' : '#1e293b'} />
            </TouchableOpacity>
            <Text className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Edit Store</Text>
            <Text className={`font-medium mb-8 text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Update your store profile and slots.</Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200}>
            {/* Basic Details Card */}
            <View className={`p-6 rounded-[32px] border mb-8 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#3b82f6" /> Store Details
              </Text>
              <InputField isDark={isDark} icon="storefront" label="Store Name" value={formData.name} onChangeText={(v) => handleInputChange('name', v)} />
              <InputField isDark={isDark} icon="tag" label="Store Type" value={formData.type} onChangeText={(v) => handleInputChange('type', v)} />
              <InputField isDark={isDark} icon="account" label="Owner Name" value={formData.fname} onChangeText={(v) => handleInputChange('fname', v)} />
              <InputField isDark={isDark} icon="map-marker" label="Location" value={formData.location} onChangeText={(v) => handleInputChange('location', v)} />
            </View>

            {/* Verification Details Card */}
            <View className={`p-6 rounded-[32px] border mb-8 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color="#10b981" /> Verification Info
              </Text>
              <InputField isDark={isDark} icon="card-account-details" label="Aadhar" value={formData.aadharNumber} onChangeText={(v) => handleInputChange('aadharNumber', v)} keyboardType="numeric" />
              <InputField isDark={isDark} icon="phone" label="Phone" value={formData.phoneNumber} onChangeText={(v) => handleInputChange('phoneNumber', v)} keyboardType="phone-pad" />
            </View>

            {/* About Business Card */}
            <View className={`p-6 rounded-[32px] border mb-8 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <MaterialCommunityIcons name="text-box-outline" size={20} color="#f59e0b" /> About Business
              </Text>
              <InputField isDark={isDark} icon="text-box-outline" label="Description" value={formData.description} onChangeText={(v) => handleInputChange('description', v)} multiline />
            </View>

            {/* Appointment Slots Card */}
            <View className={`p-6 rounded-[32px] border mb-8 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color="#8b5cf6" /> Manage Slots
              </Text>
              
              <View className={`p-5 rounded-[24px] border mb-6 ${
                isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
              }`}>
                  <TouchableOpacity onPress={() => setDatePickerVisibility(true)} className={`flex-row items-center border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <MaterialCommunityIcons name="calendar" size={18} color="#3b82f6" />
                      <Text className={`ml-3 font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedDate || "Choose Date"}</Text>
                  </TouchableOpacity>
                  <View className="flex-row items-center py-4">
                      <TouchableOpacity onPress={() => setStartTimePickerVisibility(true)} className="flex-1 flex-row items-center">
                          <MaterialCommunityIcons name="clock-start" size={18} color="#10b981" />
                          <Text className={`ml-3 font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedStartTime || "Start"}</Text>
                      </TouchableOpacity>
                      <MaterialCommunityIcons name="arrow-right" size={16} color="#cbd5e1" className="mx-2" />
                      <TouchableOpacity onPress={() => setEndTimePickerVisibility(true)} className="flex-1 flex-row items-center">
                          <MaterialCommunityIcons name="clock-end" size={18} color="#ef4444" />
                          <Text className={`ml-3 font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedEndTime || "End"}</Text>
                      </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                      onPress={handleAddAppointmentSlot}
                      className="bg-blue-600 rounded-2xl py-3.5 mt-2 items-center shadow-lg shadow-blue-500/20"
                  >
                      <Text className="text-white font-black text-xs uppercase tracking-widest">Add New Slot</Text>
                  </TouchableOpacity>
              </View>

              {formData.appointmentSlots.map((slot, sIdx) => (
                  <View key={sIdx} className={`p-4 rounded-2xl mb-4 border ${
                    isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
                  }`}>
                      <Text className={`text-[10px] font-black uppercase tracking-wider mb-3 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(slot.date).toDateString()}</Text>
                      {slot.timeSlots.map((ts, tsIdx) => (
                          <View key={tsIdx} className={`p-3.5 rounded-xl flex-row justify-between items-center mb-2 border ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
                          }`}>
                              <View className="flex-row items-center">
                                  <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2.5" />
                                  <Text className={`font-black text-xs ${isDark ? 'text-slate-200' : 'text-slate-750'}`}>{ts.startTime} - {ts.endTime}</Text>
                              </View>
                              <TouchableOpacity onPress={() => handleRemoveSlot(slot._id, ts._id)}>
                                  <MaterialCommunityIcons name="delete-outline" size={18} color="#ef4444" />
                              </TouchableOpacity>
                          </View>
                      ))}
                  </View>
              ))}
            </View>

            {/* Store Gallery Card */}
            <View className={`p-6 rounded-[32px] border mb-10 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <MaterialCommunityIcons name="image-multiple-outline" size={20} color="#ec4899" /> Store Gallery
              </Text>
              <View className="flex-row flex-wrap">
                {images.map((img, index) => (
                  <View key={index} className="mr-3 mb-3 relative">
                    <Image source={{ uri: img.uri || img.url }} className="w-20 h-20 rounded-2xl border border-slate-100" />
                    <TouchableOpacity 
                      onPress={() => handleRemoveImage(img)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-1 shadow-md shadow-red-500/30"
                    >
                      <MaterialCommunityIcons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity 
                  onPress={pickImage}
                  className={`w-20 h-20 border-2 border-dashed rounded-2xl items-center justify-center ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-blue-50/50 border-blue-200'
                  }`}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={saving}
              className="rounded-2xl overflow-hidden shadow-xl shadow-blue-500/30 mb-20"
            >
              <LinearGradient
                colors={['#1e40af', '#3b82f6']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="py-4 items-center justify-center flex-row"
              >
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text className="text-white font-black text-lg mr-2 tracking-widest">UPDATE STORE</Text>
                    <MaterialCommunityIcons name="content-save-check" size={22} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={(d) => { setSelectedDate(d.toISOString().split("T")[0]); setDatePickerVisibility(false); }} onCancel={() => setDatePickerVisibility(false)} />
          <DateTimePickerModal isVisible={isStartTimePickerVisible} mode="time" onConfirm={(t) => { setSelectedStartTime(t.toTimeString().split(" ")[0].substring(0, 5)); setStartTimePickerVisibility(false); }} onCancel={() => setStartTimePickerVisibility(false)} />
          <DateTimePickerModal isVisible={isEndTimePickerVisible} mode="time" onConfirm={(t) => { setSelectedEndTime(t.toTimeString().split(" ")[0].substring(0, 5)); setEndTimePickerVisibility(false); }} onCancel={() => setEndTimePickerVisibility(false)} />
        </ScrollView>
      </SafeAreaView>

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
    </View>
  );
};

export default EditStore;
