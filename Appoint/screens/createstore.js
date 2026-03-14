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
const InputField = ({ icon, label, placeholder, value, onChangeText, multiline = false, keyboardType = 'default' }) => (
  <View className="mb-5">
    <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-2">{label}</Text>
    <View className={`flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 shadow-sm ${multiline ? 'h-28 pt-3' : 'h-14'}`}>
      <MaterialCommunityIcons name={icon} size={18} color="#3b82f6" style={multiline ? { marginTop: 0 } : {}} />
      <TextInput
        className="flex-1 text-slate-800 font-semibold ml-3 h-full text-sm"
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
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
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phoneNumber);
  };

  const isFormValid = () => {
    const { name, fname, type, description, location, phoneNumber, aadharNumber } = formData;
    if (!name || !fname || !type || !description || !location || !phoneNumber || !aadharNumber) {
      setAlertConfig({ title: "Error", message: "Please fill in all fields.", type: "error" });
      setAlertVisible(true);
      return false;
    }
    if (!isPhoneNumberValid(phoneNumber)) {
      setAlertConfig({ title: "Error", message: "Please enter a valid 10-digit phone number.", type: "error" });
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
            <InputField icon="storefront-outline" label="Store Name" placeholder="Ex: Premium Saloon" value={formData.name} onChangeText={(v) => handleInputChange('name', v)} />
            <InputField icon="tag-outline" label="Store Type" placeholder="Hospital, Hotel, Saloon..." value={formData.type} onChangeText={(v) => handleInputChange('type', v)} />
            <InputField icon="account-outline" label="Owner Name" placeholder="Full legal name" value={formData.fname} onChangeText={(v) => handleInputChange('fname', v)} />
            <InputField icon="card-account-details-outline" label="Aadhar Number" placeholder="12-digit number" value={formData.aadharNumber} onChangeText={(v) => handleInputChange('aadharNumber', v)} keyboardType="numeric" />
            <InputField icon="phone-outline" label="Business Phone" placeholder="10-digit number" value={formData.phoneNumber} onChangeText={(v) => handleInputChange('phoneNumber', v)} keyboardType="phone-pad" />
            <InputField icon="map-marker-outline" label="Location" placeholder="Full address" value={formData.location} onChangeText={(v) => handleInputChange('location', v)} />
            <InputField icon="text-box-outline" label="Description" placeholder="Tell customers what you offer..." value={formData.description} onChangeText={(v) => handleInputChange('description', v)} multiline />

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
