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
  maxLength
}) => (
  <View className="mb-6">
    <View className="flex-row justify-between items-center mb-2 px-1">
      <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px]">{label}</Text>
      {isValid === false && <Text className="text-red-500 text-[9px] font-bold">{error}</Text>}
      {isValid === true && <View className="bg-emerald-500 rounded-full p-0.5"><MaterialCommunityIcons name="check" size={8} color="white" /></View>}
    </View>
    <View className={`flex-row items-center bg-white border ${isValid === false ? 'border-red-200 bg-red-50/10' : isValid === true ? 'border-emerald-100' : 'border-slate-100'} rounded-[20px] px-4 shadow-sm ${multiline ? 'h-32 pt-4' : 'h-14'}`}>
      <View className={`p-2 rounded-xl mr-3 ${isValid === false ? 'bg-red-50' : isValid === true ? 'bg-emerald-50' : 'bg-blue-50/50'}`}>
        <MaterialCommunityIcons 
          name={icon} 
          size={20} 
          color={isValid === false ? '#ef4444' : isValid === true ? '#10b981' : '#3b82f6'} 
          style={multiline ? { marginTop: 0 } : {}} 
        />
      </View>
      <TextInput
        className="flex-1 text-slate-800 font-bold ml-1 h-full text-sm"
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
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
  const [formData, setFormData] = useState({
    name: '',
    fname: '',
    type: '',
    description: '',
    location: '',
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

  const isAadharValid = (aadhar) => {
    // Check if it's 12 digits after removing spaces
    const cleanAadhar = aadhar.replace(/\s/g, '');
    const aadharRegex = /^[0-9]{12}$/;
    return aadharRegex.test(cleanAadhar);
  };

  const formatAadhar = (text) => {
    // Remove non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Limit to 12 digits
    const limited = cleaned.substring(0, 12);
    // Add spaces every 4 digits
    const matches = limited.match(/\d{1,4}/g);
    if (matches) {
      return matches.join('  ');
    }
    return limited;
  };

  const isFormValid = () => {
    const { name, fname, type, description, location, phoneNumber, aadharNumber } = formData;
    
    if (!name.trim() || !fname.trim() || !type.trim() || !description.trim() || !location.trim()) {
      setAlertConfig({ title: "Incomplete Form", message: "Please fill in all general details about your shop.", type: "warning" });
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

  const handleSubmit = async () => {
    if (!isFormValid()) return;

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
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Animatable.View animation="fadeInDown">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4 w-10 h-10 bg-white items-center justify-center rounded-xl shadow-sm border border-slate-100">
              <MaterialCommunityIcons name="chevron-left" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text className="text-3xl font-black text-slate-900 mb-1">Register Shop</Text>
            <Text className="text-slate-500 font-medium mb-8 text-base">Grow your business with the <Text className="text-blue-600 font-bold">आरामSe</Text> digital platform.</Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200}>
            <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
              <Text className="text-slate-900 font-black text-lg mb-6 flex-row items-center">
                <MaterialCommunityIcons name="information" size={20} color="#3b82f6" /> Basic Details
              </Text>
              
              <InputField icon="storefront-outline" label="Store Name" placeholder="Ex: Premium Saloon" value={formData.name} onChangeText={(v) => handleInputChange('name', v)} />
              <InputField icon="tag-outline" label="Store Type" placeholder="Hospital, Hotel, Saloon..." value={formData.type} onChangeText={(v) => handleInputChange('type', v)} />
              <InputField icon="account-outline" label="Owner Name" placeholder="Full legal name" value={formData.fname} onChangeText={(v) => handleInputChange('fname', v)} />
              <InputField icon="map-marker-outline" label="Location" placeholder="Full address" value={formData.location} onChangeText={(v) => handleInputChange('location', v)} />
            </View>

            <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
              <Text className="text-slate-900 font-black text-lg mb-6 flex-row items-center">
                <MaterialCommunityIcons name="shield-check" size={20} color="#10b981" /> Verification
              </Text>
              
              <InputField 
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

            <View className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
              <Text className="text-slate-900 font-black text-lg mb-6 flex-row items-center">
                <MaterialCommunityIcons name="text-box-outline" size={20} color="#f59e0b" /> About Business
              </Text>
              <InputField icon="text-box-outline" label="Description" placeholder="Tell customers what you offer..." value={formData.description} onChangeText={(v) => handleInputChange('description', v)} multiline />
            </View>

            <View className="mb-8">
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 ml-2">Store Images</Text>
              <View className="flex-row flex-wrap">
                {images.map((img, index) => (
                  <View key={index} className="mr-3 mb-3 relative">
                    <Image source={{ uri: img }} className="w-20 h-20 rounded-2xl" />
                    <TouchableOpacity 
                      onPress={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                    >
                      <MaterialCommunityIcons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity 
                  onPress={pickImage}
                  className="w-20 h-20 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl items-center justify-center"
                >
                  <MaterialCommunityIcons name="camera-plus-outline" size={28} color="#3b82f6" />
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
                    <Text className="text-white font-black text-lg mr-2 tracking-widest">CREATE STORE</Text>
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
