import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
  RefreshControl,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../middleware/AuthContext";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get("window");

const Profile = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stores, setStores] = useState([]);
  const [storeImages, setStoreImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null, cancelText: null });
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchTokenAndDecode = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user?.id;
        if (userId) {
          await fetchUserDetails(userId);
          await fetchStores(token);
        }
      }
    } catch (error) {
      console.error("Profile initialization failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokenAndDecode();
  }, [fetchTokenAndDecode]);

  const fetchUserDetails = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/users/${id}`);
      setUserDetails(response.data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchStores = async (token) => {
    try {
      // Using the dedicated list endpoint which returns owner's stores
      const response = await axios.get(`${API_BASE_URL}/api/store/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(response.data);
      
      const allImages = response.data.flatMap(store => 
        store.images?.map(img => img.url) || []
      );
      setStoreImages(allImages);
    } catch (error) {
       console.error("Error fetching user stores:", error);
    }
  };

  // Slideshow Logic
  useEffect(() => {
    if (storeImages.length <= 1) return;

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % storeImages.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [storeImages, fadeAnim]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTokenAndDecode();
    setRefreshing(false);
  }, [fetchTokenAndDecode]);

  const handleLogout = () => {
    setAlertConfig({
      title: "Sign Out",
      message: "Are you sure you want to log out of AaramSe?",
      type: "warning",
      buttonText: "Yes, Logout",
      cancelText: "No",
      onConfirm: async () => {
        setAlertVisible(false);
        await logout();
      }
    });
    setAlertVisible(true);
  };

  const handleImageUpdate = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setUploading(true);
        const token = await AsyncStorage.getItem("userToken");
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user?.id;

        const formData = new FormData();
        formData.append("profilePicture", {
          uri: result.assets[0].uri,
          name: `profile_${userId}.jpg`,
          type: "image/jpeg",
        });

        const response = await axios.put(`${API_BASE_URL}/api/auth/update/${userId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data) {
          Alert.alert("Success", "Profile photo updated!");
          fetchUserDetails(userId);
        }
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      Alert.alert("Error", "Failed to upload image. Please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  const MenuItem = ({ icon, label, onPress, color = "#475569", textColor = "#1e293b" }) => (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center justify-between p-5 bg-white rounded-3xl mb-3 border border-gray-50 shadow-sm"
    >
      <View className="flex-row items-center">
        <View style={{ backgroundColor: color + '15' }} className="p-3 rounded-2xl mr-4">
           <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={{ color: textColor }} className="font-bold text-base">{label}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#cbd5e1" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  const defaultBg = "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop";

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {isOffline && (
        <Animatable.View animation="slideInDown" className="bg-red-500 py-2 items-center flex-row justify-center z-50">
          <MaterialCommunityIcons name="wifi-off" size={14} color="white" />
          <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-2">You are currently offline</Text>
        </Animatable.View>
      )}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="h-96 relative overflow-hidden">
          {/* Slideshow Background */}
          <Animated.Image
            source={{ uri: storeImages.length > 0 ? storeImages[currentImageIndex] : defaultBg }}
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'absolute',
              opacity: fadeAnim 
            }}
            resizeMode="cover"
          />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
            className="absolute inset-0"
          />

          <Animatable.View animation="fadeIn" className="items-center justify-center h-full pt-10">
            <TouchableOpacity 
              onPress={handleImageUpdate}
              disabled={uploading}
              className="w-32 h-32 rounded-full border-4 border-white/40 p-1 bg-white/10 relative shadow-xl"
            >
              <Image
                source={{ uri: userDetails?.profilePicture || "https://ui-avatars.com/api/?name=" + (userDetails?.name || "U") + "&background=random" }}
                className="w-full h-full rounded-full"
              />
              {uploading && (
                <View className="absolute inset-0 bg-black/40 rounded-full items-center justify-center">
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              <View className="absolute bottom-1 right-1 bg-emerald-500 p-2 rounded-full border-2 border-white shadow-lg">
                <MaterialCommunityIcons name={uploading ? "sync" : "camera"} size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <Animatable.Text animation="fadeInUp" delay={300} className="text-white text-2xl font-black mt-5 tracking-tight">
              {userDetails?.name}
            </Animatable.Text>
            <Animatable.Text animation="fadeInUp" delay={400} className="text-blue-100 font-medium opacity-80 text-xs tracking-wider">
              {userDetails?.email?.toUpperCase()}
            </Animatable.Text>
          </Animatable.View>
        </View>

        <View className="px-6 -mt-12">
          {/* Stats Card */}
          <Animatable.View animation="fadeInUp" duration={1000} className="bg-white rounded-[48px] p-8 shadow-2xl mb-8 border border-slate-50">
             <View className="flex-row justify-around">
                <View className="items-center">
                   <Text className="text-blue-900 font-black text-xl">{stores.length}</Text>
                   <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[2px] mt-1">My Stores</Text>
                </View>
                <View className="w-[1px] h-12 bg-slate-100" />
                <View className="items-center">
                   <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                      <Text className="text-blue-900 font-black text-2xl">Active</Text>
                   </View>
                   <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-1">Status</Text>
                </View>
             </View>
          </Animatable.View>

          {/* User's Stores Section */}
          {stores.length > 0 && (
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-6 ml-4">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">My Business Profile</Text>
                <TouchableOpacity onPress={() => navigation.navigate("SellerDashboard")}>
                  <Text className="text-blue-600 font-bold text-xs uppercase tracking-widest mr-4">Manage All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-2">
                {stores.map((store, index) => (
                  <Animatable.View 
                    key={store._id}
                    animation="fadeInRight"
                    delay={index * 100}
                    className="mr-4"
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate("StorePage", { storeId: store._id })}
                      className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm w-[280px]"
                    >
                      <View className="flex-row items-center mb-4">
                        <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-3">
                          <MaterialCommunityIcons name="storefront" size={24} color="#3b82f6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-900 font-black text-base" numberOfLines={1}>{store.name}</Text>
                          <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">{store.type}</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row justify-between items-center bg-slate-50 p-3 rounded-2xl">
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="account-group-outline" size={16} color="#64748b" />
                          <Text className="text-slate-600 font-bold text-xs ml-2">Queue: {store.currentQueueNumber || 0}</Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-right-circle" size={24} color="#cbd5e1" />
                      </View>
                    </TouchableOpacity>
                  </Animatable.View>
                ))}
                {/* Add Store Shortcut */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate("CreateStore")}
                  className="bg-dashed bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-5 w-[120px] items-center justify-center mr-6"
                >
                  <MaterialCommunityIcons name="plus" size={32} color="#94a3b8" />
                  <Text className="text-slate-400 font-black text-[10px] uppercase text-center mt-2">Add New Shop</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-6 ml-4">Account Settings</Text>
          <MenuItem icon="account-edit-outline" label="Edit Profile Details" onPress={() => navigation.navigate("EditProfile")} color="#3b82f6" />
          <MenuItem icon="history" label="My Booking History" onPress={() => navigation.navigate("History")} color="#6366f1" />
          
          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-8 mb-6 ml-4">Business Features</Text>
          <MenuItem icon="store-plus-outline" label="Register Your Shop" onPress={() => navigation.navigate("CreateStore")} color="#10b981" />
          {stores.length > 0 && (
             <MenuItem icon="store-cog-outline" label="Manage My Stores" onPress={() => navigation.navigate("SellerDashboard")} color="#f59e0b" />
          )}

          <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-8 mb-6 ml-4">Support & More</Text>
          <MenuItem icon="bell-ring-outline" label="Notifications" onPress={() => {}} color="#8b5cf6" />
          <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => navigation.navigate("Help")} color="#0ea5e9" />
          
          <TouchableOpacity 
            onPress={handleLogout}
            activeOpacity={0.8}
            className="mt-12 bg-red-50 p-6 rounded-[32px] flex-row items-center justify-center border border-red-100 mb-12 shadow-sm shadow-red-500/10"
          >
             <MaterialCommunityIcons name="logout-variant" size={24} color="#ef4444" />
             <Text className="text-red-600 font-black text-lg ml-3 tracking-widest uppercase">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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

export default Profile;
