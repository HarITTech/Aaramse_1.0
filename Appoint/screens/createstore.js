import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SuccessPopup from './SuccessPopup';
import CustomAlert from "../components/CustomAlert";
import OtpModal from "../components/OtpModal";
import { useLanguage } from "../middleware/LanguageContext";
import { useTheme } from '../middleware/ThemeContext';

// Moved outside to fix keyboard focus issue
const InputField = ({ 
  icon, 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  multiline = false, 
  keyboardType = 'default',
  isValid = null,
  error = "",
  maxLength,
  isDark
}) => (
  <View className="mb-6">
    <View className="flex-row justify-between items-center mb-2 px-1">
      <Text className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</Text>
      {isValid === false && <Text className="text-red-500 text-[9px] font-bold">{error}</Text>}
      {isValid === true && <View className="bg-emerald-500 rounded-full p-0.5"><MaterialCommunityIcons name="check" size={8} color="white" /></View>}
    </View>
    <View className={`flex-row items-center border ${
      isValid === false ? 'border-red-200 bg-red-50/10' : isValid === true ? 'border-emerald-100' : (isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-white')
    } rounded-[20px] px-4 shadow-sm ${multiline ? 'h-32 pt-4' : 'h-14'}`}>
      <View className={`p-2 rounded-xl mr-3 ${isValid === false ? 'bg-red-50' : isValid === true ? 'bg-emerald-50' : (isDark ? 'bg-slate-900' : 'bg-blue-50/50')}`}>
        <MaterialCommunityIcons 
          name={icon} 
          size={20} 
          color={isValid === false ? '#ef4444' : isValid === true ? '#10b981' : '#3b82f6'} 
          style={multiline ? { marginTop: 0 } : {}} 
        />
      </View>
      <TextInput
        className={`flex-1 font-bold ml-1 h-full text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{ paddingVertical: Platform.OS === 'android' ? 0 : 8 }}
      />
    </View>
  </View>
);

const CreateStore = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    fname: '',
    type: '',
    description: '',
    location: '',
    email: '',
    phoneNumber: '',
    aadharNumber: '',
    appointmentSlots: [
      {
        date: new Date().toISOString().split('T')[0],
        timeSlots: [{ startTime: '09:00', endTime: '17:00' }],
      },
    ],
  });
  const [images, setImages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig({ title: "Permission required", message: "We need media library permissions to pick images.", type: "warning" });
        setAlertVisible(true);
      }
    })();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const isPhoneNumberValid = (phoneNumber) => {
    const phoneRegex = /^[6-9][0-9]{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const isAadharValid = (aadhar) => {
    const cleanAadhar = aadhar.replace(/\s/g, '');
    const aadharRegex = /^[0-9]{12}$/;
    return aadharRegex.test(cleanAadhar);
  };

  const formatAadhar = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.substring(0, 12);
    const matches = limited.match(/\d{1,4}/g);
    if (matches) {
      return matches.join('  ');
    }
    return limited;
  };

  const isFormValid = () => {
    const { name, fname, type, description, location, phoneNumber, aadharNumber, email } = formData;
    
    if (!name.trim() || !fname.trim() || !type.trim() || !description.trim() || !location.trim()) {
      setAlertConfig({ title: "Incomplete Form", message: "Please fill in all general details about your shop.", type: "warning" });
      setAlertVisible(true);
      return false;
    }

    if (!isEmailValid(email)) {
      setAlertConfig({ title: "Invalid Email", message: "Please enter a valid email address to receive your OTP.", type: "error" });
      setAlertVisible(true);
      return false;
    }
    
    if (!isAadharValid(aadharNumber)) {
      setAlertConfig({ title: "Invalid Aadhaar", message: "Aadhaar number must be exactly 12 digits.", type: "error" });
      setAlertVisible(true);
      return false;
    }

    if (!isPhoneNumberValid(phoneNumber)) {
      setAlertConfig({ title: "Invalid Phone", message: "Please enter a valid 10-digit business contact number.", type: "error" });
      setAlertVisible(true);
      return false;
    }

    if (images.length === 0) {
      setAlertConfig({ title: "Images Required", message: "Please add at least one photo of your store.", type: "warning" });
      setAlertVisible(true);
      return false;
    }

    return true;
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map(asset => asset.uri);
        setImages([...images, ...newUris]);
      }
    } catch (error) {
      console.error('Error picking image:', error.message);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Step 1: Validate form and open OTP modal
  const handleSubmit = async () => {
    if (!isFormValid()) return;
    // Open OTP verification modal
    setOtpModalVisible(true);
  };

  // Step 2: Called after OTP is verified — now actually create the store
  const handleOtpVerified = async () => {
    setOtpModalVisible(false);
    setLoading(true);

    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'appointmentSlots') {
        form.append(key, JSON.stringify(formData[key]));
      } else {
        form.append(key, formData[key]);
      }
    });

    images.forEach((imageUri, index) => {
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      form.append('images', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: `photo_${index}.${fileType}`,
        type: `image/${fileType}`,
      });
    });

    try {
      await axios.post(
        `${API_BASE_URL}/api/store/create`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        }
      );
      setPopupVisible(true);
    } catch (error) {
      console.error('Error creating store:', error.message);
      setAlertConfig({ title: "Error", message: "Failed to create store. Please try again.", type: "error" });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView className="flex-1">
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
            <Text className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('registerShop')}</Text>
            <Text className={`font-medium mb-8 text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('growBusiness')}</Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200}>
            <View className={`p-6 rounded-[32px] border mb-8 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <MaterialCommunityIcons name="information" size={20} color="#3b82f6" /> {t('basicDetails')}
              </Text>
              
              <InputField isDark={isDark} icon="storefront-outline" label={t('storeName')} placeholder="Ex: Premium Saloon" value={formData.name} onChangeText={(v) => handleInputChange('name', v)} />
              <InputField isDark={isDark} icon="tag-outline" label={t('storeType')} placeholder="Hospital, Hotel, Saloon..." value={formData.type} onChangeText={(v) => handleInputChange('type', v)} />
              <InputField isDark={isDark} icon="account-outline" label={t('ownerName')} placeholder="Full legal name" value={formData.fname} onChangeText={(v) => handleInputChange('fname', v)} />
              <InputField isDark={isDark} icon="map-marker-outline" label={t('location')} placeholder="Full address" value={formData.location} onChangeText={(v) => handleInputChange('location', v)} />
            </View>

            <View className={`p-6 rounded-[32px] border mb-8 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#10b981" /> Verification
              </Text>
              
              <InputField isDark={isDark} icon="shield-check" label="Email Address" placeholder="owner@example.com" value={formData.email} onChangeText={(v) => handleInputChange('email', v)} keyboardType="email-address"
                isValid={formData.email.length > 0 ? isEmailValid(formData.email) : null}
                error="Invalid email"
              />
              
              <InputField 
                isDark={isDark}
                icon="card-account-details-outline" 
                label="Aadhar Number" 
                placeholder="0000  0000  0000" 
                value={formData.aadharNumber} 
                onChangeText={(v) => handleInputChange('aadharNumber', formatAadhar(v))} 
                keyboardType="numeric"
                maxLength={18} // 12 digits + spaces
                isValid={formData.aadharNumber.length > 0 ? isAadharValid(formData.aadharNumber) : null}
                error="Must be 12 digits"
              />
              
              <InputField 
                isDark={isDark}
                icon="phone-outline" 
                label="Business Phone" 
                placeholder="9876543210" 
                value={formData.phoneNumber} 
                onChangeText={(v) => handleInputChange('phoneNumber', v)} 
                keyboardType="phone-pad"
                maxLength={10}
                isValid={formData.phoneNumber.length > 0 ? isPhoneNumberValid(formData.phoneNumber) : null}
                error="Invalid number"
              />
            </View>

            <View className={`p-6 rounded-[32px] border mb-8 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <MaterialCommunityIcons name="text-box-outline" size={20} color="#f59e0b" /> About Business
              </Text>
              <InputField isDark={isDark} icon="text-box-outline" label="Description" placeholder="Tell customers what you offer..." value={formData.description} onChangeText={(v) => handleInputChange('description', v)} multiline />
            </View>

            <View className={`p-6 rounded-[32px] border mb-8 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <Text className={`text-lg font-black mb-6 flex-row items-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                <MaterialCommunityIcons name="image-multiple-outline" size={20} color="#ec4899" /> Store Gallery
              </Text>
              <View className="flex-row flex-wrap">
                {images.map((img, index) => (
                  <View key={index} className="mr-3 mb-3 relative">
                    <Image source={{ uri: img }} className="w-20 h-20 rounded-2xl border border-slate-100" />
                    <TouchableOpacity 
                      onPress={() => removeImage(index)}
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
                  <MaterialCommunityIcons name="camera-plus-outline" size={24} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>

              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={loading}
                className="rounded-3xl overflow-hidden shadow-xl shadow-blue-500/30 mb-10"
              >
                <LinearGradient
                  colors={['#1e40af', '#3b82f6']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  className="py-5 items-center justify-center flex-row"
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text className="text-white font-black text-lg mr-2 tracking-widest">{t('createStore')}</Text>
                      <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
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
          navigation.navigate("SellerDashboard"); 
        }} 
        title="Store Registered!"
        message="Your business is now live on AaramSe. You can manage slots and bookings from your dashboard."
        buttonText="Go to My Dashboard"
      />

      <OtpModal
        visible={otpModalVisible}
        email={formData.email}
        onVerified={handleOtpVerified}
        onClose={() => setOtpModalVisible(false)}
      />

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

export default CreateStore;
