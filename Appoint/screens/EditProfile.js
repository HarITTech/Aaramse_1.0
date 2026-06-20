import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  StatusBar,
  Platform
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../middleware/ThemeContext';

// Moved InputField outside to prevent re-creation and keyboard flickering
const InputField = ({ icon, label, value, onChangeText, keyboardType = "default", isDark }) => (
  <View className="mb-6">
    <Text className={`text-xs font-bold uppercase tracking-widest mb-2 ml-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{label}</Text>
    <View className={`flex-row items-center border rounded-3xl px-4 h-16 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
      <MaterialCommunityIcons name={icon} size={22} color="#3b82f6" />
      <TextInput
        className={`flex-1 font-semibold ml-3 h-full ${isDark ? 'text-slate-100' : 'text-gray-800'}`}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={`Enter your ${label.toLowerCase()}`}
        placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
        style={{ paddingVertical: Platform.OS === 'android' ? 0 : 10 }}
      />
    </View>
  </View>
);

const EditProfile = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null });
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        const decodedToken = jwtDecode(token);
        const id = decodedToken.user?.id;
        setUserId(id);
        const response = await axios.get(`${API_BASE_URL}/api/auth/users/${id}`);
        setFormData({
          name: response.data.name || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || ""
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setAlertConfig({ title: "Error", message: "Could not load user profile.", type: "error" });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9][0-9]{9}$/;

    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }

    if (!emailRegex.test(formData.email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number.");
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.put(
        `${API_BASE_URL}/api/auth/update/${userId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAlertConfig({ 
        title: "Success", 
        message: "Profile updated successfully!", 
        type: "success",
        onConfirm: () => {
          setAlertVisible(false);
          navigation.goBack();
        }
      });
      setAlertVisible(true);
    } catch (error) {
      console.error("Update error:", error);
      setAlertConfig({ title: "Failed", message: "Could not update profile. Please try again.", type: "error" });
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-[#020617]' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {isOffline && (
        <Animatable.View animation="slideInDown" className="bg-red-500 py-1.5 items-center flex-row justify-center z-50">
          <MaterialCommunityIcons name="wifi-off" size={14} color="white" />
          <Text className="text-white font-black text-[9px] uppercase tracking-widest ml-2">Offline - Changes won't sync</Text>
        </Animatable.View>
      )}
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
            <Animatable.View animation="fadeInLeft" duration={800}>
              <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
                <MaterialCommunityIcons name="arrow-left" size={28} color={isDark ? "#fff" : "#1e293b"} />
              </TouchableOpacity>
              <Text className={`text-3xl font-black mb-2 underline decoration-blue-500 ${isDark ? 'text-white' : 'text-slate-800'}`}>Edit Profile</Text>
              <Text className={`font-medium mb-10 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Keep your information up to date.</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={200}>
              <InputField 
                isDark={isDark}
                icon="account-outline" 
                label="Full Name" 
                value={formData.name} 
                onChangeText={(t) => setFormData({...formData, name: t})} 
              />
              <InputField 
                isDark={isDark}
                icon="email-outline" 
                label="Email Address" 
                value={formData.email} 
                onChangeText={(t) => setFormData({...formData, email: t})} 
                keyboardType="email-address"
              />
              <InputField 
                isDark={isDark}
                icon="phone-outline" 
                label="Phone Number" 
                value={formData.phone} 
                onChangeText={(t) => setFormData({...formData, phone: t})} 
                keyboardType="phone-pad"
              />
              <InputField 
                isDark={isDark}
                icon="map-marker-outline" 
                label="Address" 
                value={formData.address} 
                onChangeText={(t) => setFormData({...formData, address: t})} 
              />

              <TouchableOpacity 
                onPress={handleSave}
                disabled={saving}
                className="mt-8 overflow-hidden rounded-3xl shadow-lg"
              >
                <LinearGradient
                  colors={['#1e3a8a', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-5 items-center justify-center flex-row"
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check-circle-outline" size={22} color="#fff" />
                      <Text className="text-white font-bold text-lg ml-2">SAVE CHANGES</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <CustomAlert 
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </View>
  );
};

export default EditProfile;
