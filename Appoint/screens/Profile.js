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
import { useLanguage } from "../middleware/LanguageContext";
import { useTheme } from "../middleware/ThemeContext";

const { width } = Dimensions.get("window");

const Profile = () => {
  const { logout, isGuest } = useAuth();
  const navigation = useNavigation();
  const { theme, toggleTheme } = useTheme();
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
  const { language, changeLanguage, t } = useLanguage();

  const isDark = theme === 'dark';

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchTokenAndDecode = useCallback(async () => {
    try {
      if (isGuest) {
        setLoading(false);
        return;
      }
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
  }, [isGuest]);

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
      title: t('logout'),
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

  const handleLanguageChange = () => {
    Alert.alert(
      t('selectLanguage'),
      null,
      [
        { text: 'English', onPress: () => changeLanguage('en'), style: language === 'en' ? 'default' : 'cancel' },
        { text: 'हिंदी (Hindi)', onPress: () => changeLanguage('hi'), style: language === 'hi' ? 'default' : 'cancel' },
        { text: 'मराठी (Marathi)', onPress: () => changeLanguage('mr'), style: language === 'mr' ? 'default' : 'cancel' },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
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

  const MenuItem = ({ icon, label, onPress, color = "#475569", textColor = isDark ? "#f1f5f9" : "#1e293b", rightElement = null, isLast = false }) => (
    <View>
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center justify-between px-5 py-4"
      >
        <View className="flex-row items-center flex-1 pr-2">
          <View style={{ backgroundColor: color + '15' }} className="p-2.5 rounded-xl mr-4">
             <MaterialCommunityIcons name={icon} size={22} color={color} />
          </View>
          <Text style={{ color: textColor }} className="font-bold text-base flex-1" numberOfLines={1}>{label}</Text>
        </View>
        {rightElement ? rightElement : <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? "#475569" : "#cbd5e1"} />}
      </TouchableOpacity>
      {!isLast && <View className={`h-[1px] ml-16 ${isDark ? 'bg-slate-800/80' : 'bg-slate-50'}`} />}
    </View>
  );

  const MenuGroup = ({ children }) => (
    <View className={`rounded-[28px] border mb-6 overflow-hidden ${
      isDark ? 'bg-slate-900 border-slate-800/80 shadow-none' : 'bg-white border-slate-100/70 shadow-sm shadow-slate-100'
    }`}>
      {children}
    </View>
  );

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-[#020617]' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  const defaultBg = "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop";

  if (isGuest) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-gray-50'}`}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        {/* Cover Photo */}
        <View className="relative">
          <View className="h-48 overflow-hidden relative bg-slate-900">
            <LinearGradient
              colors={isDark ? ['#0a0f1d', '#020617'] : ['#0f172a', '#1e1b4b']}
              className="absolute inset-0"
            />
          </View>
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className={`absolute top-12 left-6 w-10 h-10 items-center justify-center rounded-xl border backdrop-blur-md z-10 ${
              isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/20 border-white/30'
            }`}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Card Overlay */}
        <View className="px-6 -mt-20 z-20 mb-6">
          <Animatable.View animation="fadeInUp" className={`rounded-[32px] p-6 border shadow-lg ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'
          }`}>
            <View className="items-center -mt-16 mb-2">
              <View className="w-24 h-24 rounded-full border-4 border-white/20 items-center justify-center bg-white/10 shadow-md">
                <MaterialCommunityIcons name="account-outline" size={50} color={isDark ? "#94a3b8" : "#64748b"} />
              </View>
              <Text className={`text-xl font-black mt-3 tracking-tight text-center w-full ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Guest User
              </Text>
              <Text className={`font-semibold text-xs tracking-widest uppercase text-center w-full mt-1 ${isDark ? 'text-slate-550' : 'text-slate-400'}`}>
                अतिथी युजर
              </Text>
            </View>
            
            <View className={`h-[1px] w-full my-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
            
            <Text className={`font-bold text-center text-xs mb-4 leading-5 px-2 ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>
               बुकिंग करणे, वेळेचे व्यवस्थापन करणे आणि व्यावसायिक फीचर्सचा लाभ घेण्यासाठी लॉगिन करा.
            </Text>
            
            <TouchableOpacity 
               onPress={async () => {
                 await logout();
               }}
               className="bg-blue-600 py-3.5 rounded-2xl items-center shadow-lg shadow-blue-500/20"
            >
               <Text className="text-white font-black text-sm tracking-widest uppercase">लॉगिन / नोंदणी करा (Login / Sign Up)</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          className="px-6"
        >
          <Text className={`text-[10px] font-black uppercase tracking-[3px] mb-3 ml-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Settings & Support</Text>
          <MenuGroup>
            <MenuItem icon={isDark ? "weather-sunny" : "weather-night"} label={isDark ? "Light Theme" : "Dark Theme"} onPress={toggleTheme} color={isDark ? "#eab308" : "#6366f1"} />
            <MenuItem icon="translate" label={t('changeLanguage')} onPress={handleLanguageChange} color="#f43f5e" />
            <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => navigation.navigate("Help")} color="#0ea5e9" />
            <MenuItem icon="information-outline" label="About App" onPress={() => navigation.navigate("AboutUs")} color="#64748b" isLast={true} />
          </MenuGroup>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-gray-50'}`}>
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
        <View className="relative">
          {/* Cover Photo */}
          <View className="h-48 overflow-hidden relative">
            <Animated.Image
              source={{ uri: storeImages.length > 0 ? storeImages[currentImageIndex] : defaultBg }}
              style={{ 
                width: '100%', 
                height: '100%', 
                opacity: fadeAnim 
              }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={isDark ? ['rgba(2, 6, 23, 0.2)', 'rgba(2, 6, 23, 0.8)'] : ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
              className="absolute inset-0"
            />
          </View>
          
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className={`absolute top-12 left-6 w-10 h-10 items-center justify-center rounded-xl border backdrop-blur-md z-10 ${
              isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/20 border-white/30'
            }`}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Card Overlay */}
        <View className="px-6 -mt-20 z-20">
          <Animatable.View animation="fadeInUp" className={`rounded-[32px] p-6 border shadow-lg ${
            isDark ? 'bg-slate-900 border-slate-800/80 shadow-none' : 'bg-white border-slate-100'
          }`}>
            <View className="items-center -mt-16 mb-4">
              <TouchableOpacity 
                onPress={handleImageUpdate}
                disabled={uploading}
                className={`w-24 h-24 rounded-full border-4 p-0.5 relative shadow-md ${isDark ? 'border-slate-800 bg-slate-900' : 'border-white bg-slate-55'}`}
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
                <View className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full border-2 border-white shadow-lg">
                  <MaterialCommunityIcons name={uploading ? "sync" : "camera"} size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              
              <Text className={`text-xl font-black mt-3 tracking-tight text-center w-full ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {userDetails?.name}
              </Text>
              <Text className={`font-semibold text-xs tracking-wider text-center w-full ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {userDetails?.email}
              </Text>
            </View>

            <View className={`h-[1px] w-full my-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />

            <View className="flex-row justify-around py-1">
              <View className="items-center">
                 <Text className={`font-black text-xl ${isDark ? 'text-white' : 'text-blue-900'}`}>{stores.length}</Text>
                 <Text className={`text-[10px] font-black uppercase tracking-[1.5px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('myStores') || 'My Stores'}</Text>
              </View>
              <View className={`w-[1px] h-10 ${isDark ? 'bg-slate-800' : 'bg-slate-150'}`} />
              <View className="items-center">
                 <View className="flex-row items-center justify-center">
                    <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                    <Text className={`font-black text-xl ${isDark ? 'text-white' : 'text-blue-900'}`}>Active</Text>
                 </View>
                 <Text className={`text-[10px] font-black uppercase tracking-[1.5px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('status') || 'Status'}</Text>
              </View>
            </View>
          </Animatable.View>
        </View>

        <View className="px-6 mt-6">
          {/* User's Stores Section */}
          {stores.length > 0 && (
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-4 ml-4">
                <Text className={`text-[10px] font-black uppercase tracking-[3px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>My Business Profile</Text>
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
                      className={`rounded-[32px] p-5 border shadow-sm w-[280px] ${
                        isDark ? 'bg-slate-900 border-slate-800/80 shadow-none' : 'bg-white border-slate-100'
                      }`}
                    >
                      <View className="flex-row items-center mb-4">
                        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                          <MaterialCommunityIcons name="storefront" size={24} color="#3b82f6" />
                        </View>
                        <View className="flex-1">
                          <Text className={`font-black text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`} numberOfLines={1}>{store.name}</Text>
                          <Text className={`font-bold text-[9px] uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{store.type}</Text>
                        </View>
                      </View>
                      
                      <View className={`flex-row justify-between items-center p-3 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="account-group-outline" size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                          <Text className={`font-bold text-xs ml-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Queue: {store.currentQueueNumber || 0}</Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-right-circle" size={24} color={isDark ? "#475569" : "#cbd5e1"} />
                      </View>
                    </TouchableOpacity>
                  </Animatable.View>
                ))}
                {/* Add Store Shortcut */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate("CreateStore")}
                  className={`border-2 border-dashed rounded-[32px] p-5 w-[120px] items-center justify-center mr-6 ${
                    isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <MaterialCommunityIcons name="plus" size={32} color={isDark ? "#475569" : "#94a3b8"} />
                  <Text className={`font-black text-[10px] uppercase text-center mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Add New Shop</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          <Text className={`text-[10px] font-black uppercase tracking-[3px] mb-3 ml-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Account Settings</Text>
          <MenuGroup>
            <MenuItem icon="account-edit-outline" label={t('editProfile')} onPress={() => navigation.navigate("EditProfile")} color="#3b82f6" />
            <MenuItem icon="history" label={t('myBookings')} onPress={() => navigation.navigate("History")} color="#6366f1" />
            <MenuItem icon={isDark ? "weather-sunny" : "weather-night"} label={isDark ? "Light Theme" : "Dark Theme"} onPress={toggleTheme} color={isDark ? "#eab308" : "#6366f1"} />
            <MenuItem icon="translate" label={t('changeLanguage')} onPress={handleLanguageChange} color="#f43f5e" isLast={true} />
          </MenuGroup>
          
          <Text className={`text-[10px] font-black uppercase tracking-[3px] mb-3 ml-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Business Features</Text>
          <MenuGroup>
            <MenuItem icon="store-plus-outline" label="Register Your Shop" onPress={() => navigation.navigate("CreateStore")} color="#10b981" isLast={stores.length === 0} />
            {stores.length > 0 && (
               <>
                 <MenuItem icon="calendar-clock" label="Update Daily Slots" onPress={() => {
                   if (stores.length === 1) {
                     navigation.navigate("UpdateSlots", { storeId: stores[0]._id });
                   } else {
                     navigation.navigate("SellerDashboard");
                   }
                 }} color="#8b5cf6" />
                 <MenuItem icon="store-cog-outline" label="Manage My Stores" onPress={() => navigation.navigate("SellerDashboard")} color="#f59e0b" isLast={true} />
               </>
            )}
          </MenuGroup>

          <Text className={`text-[10px] font-black uppercase tracking-[3px] mb-3 ml-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Support & More</Text>
          <MenuGroup>
            <MenuItem icon="bell-ring-outline" label="Notifications" onPress={() => {}} color="#8b5cf6" />
            <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => navigation.navigate("Help")} color="#0ea5e9" isLast={true} />
          </MenuGroup>
          
          <TouchableOpacity 
            onPress={handleLogout}
            activeOpacity={0.8}
            className={`mt-6 p-5 rounded-[28px] flex-row items-center justify-center border mb-12 shadow-sm ${
              isDark ? 'bg-red-500/10 border-red-500/20 shadow-none' : 'bg-red-50 border-red-100 shadow-red-500/10'
            }`}
          >
             <MaterialCommunityIcons name="logout-variant" size={24} color="#ef4444" />
             <Text className="text-red-600 font-black text-base ml-3 tracking-widest uppercase">{t('logout')}</Text>
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
