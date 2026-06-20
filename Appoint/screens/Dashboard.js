import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Modal,
  Platform
} from "react-native";
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../middleware/AuthContext";
import { useTheme } from "../middleware/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import NetInfo from "@react-native-community/netinfo";
import { useLanguage } from "../middleware/LanguageContext";
import CustomAlert from "../components/CustomAlert";

const { width } = Dimensions.get("window");

const CategoryCard = ({ icon, title, color, isSelected, onPress, isDark }) => (
  <TouchableOpacity 
    className={`m-1 p-3 rounded-2xl items-center border ${
      isSelected 
        ? (isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-600 bg-blue-50') 
        : (isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')
    }`}
    style={{ width: (width - 64) / 4 }}
    onPress={onPress}
  >
    <View className="p-2.5 rounded-xl mb-1.5" style={{ backgroundColor: color + '20' }}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text className={`font-black text-[9px] text-center ${
      isSelected 
        ? (isDark ? 'text-blue-400' : 'text-blue-600') 
        : (isDark ? 'text-slate-300' : 'text-slate-700')
    }`} numberOfLines={1}>{title}</Text>
  </TouchableOpacity>
);

const Dashboard = () => {
  const navigation = useNavigation();
  const { logout, isGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userId, setUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { language, t } = useLanguage();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null, cancelText: null });

  const showCustomAlert = (title, message, type = "info", onConfirm = null, cancelText = null) => {
    setAlertConfig({ title, message, type, onConfirm, cancelText });
    setAlertVisible(true);
  };
  const sidebarTranslate = useRef(new Animated.Value(-width)).current;
  const [isOffline, setIsOffline] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchTokenAndDecode = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user?.id;
        if (userId) {
          setUserId(userId);
          fetchUserDetails(userId);
        }
      }
      // Fetch stores for both guest and authenticated users
      fetchStores();
    } catch (error) {
      console.error("Auth initialization failed:", error);
    }
  };

  useEffect(() => {
    fetchTokenAndDecode();
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const fetchUserDetails = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/users/${id}`);
      setUserDetails(response.data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/store/stores`);
      const sortedStores = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setStores(sortedStores);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const toggleSidebar = () => {
    if (!isSidebarVisible) {
      setIsSidebarVisible(true);
      Animated.timing(sidebarTranslate, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarTranslate, {
        toValue: -width,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setIsSidebarVisible(false));
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTokenAndDecode();
    setRefreshing(false);
  }, []);

  const scanFromGallery = async () => {
    showCustomAlert("Feature Update", "Scanning from photos is currently optimized for development builds. Please use the live camera scanner for the best experience.", "info");
  };

  const handleLogout = async () => {
    showCustomAlert(
      "Logout",
      "Are you sure you want to log out?",
      "warning",
      async () => {
        setAlertVisible(false);
        try {
          await axios.post(`${API_BASE_URL}/api/auth/logout`);
        } catch (e) {
          console.warn("Server logout skip:", e.message);
        }
        await logout();
        navigation.navigate("Login");
      },
      "Cancel"
    );
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      {/* Background Gradient */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={isDark ? ['#0a0f1d', '#070b16', '#020617'] : ['#eff6ff', '#f8fafc', '#ffffff']}
          className="flex-1"
        />
      </View>
      
      {isOffline && (
        <Animatable.View animation="slideInDown" className="bg-red-500 py-2 items-center flex-row justify-center z-50">
          <MaterialCommunityIcons name="wifi-off" size={14} color="white" />
          <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-2">Internet is not available</Text>
        </Animatable.View>
      )}
      
      {/* Premium Header */}
      <LinearGradient
        colors={isDark ? ['rgba(10, 15, 29, 0.95)', 'rgba(7, 11, 22, 0.95)'] : ['#ffffff', '#f8fafc']}
        className={`pt-12 pb-4 px-5 flex-row justify-between items-center z-10 border-b ${
          isDark ? 'border-white/5' : 'border-slate-100 shadow-sm'
        }`}
      >
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={toggleSidebar} 
            className={`mr-3 p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <MaterialCommunityIcons name="menu" size={24} color={isDark ? "#60a5fa" : "#1e40af"} />
          </TouchableOpacity>
          <View>
            <Text className={`text-[8px] font-black uppercase tracking-[2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('goodDay')}</Text>
            <Text className={`text-base font-black ${isDark ? 'text-white' : 'text-blue-950'}`}>{userDetails?.name?.split(' ')[0] || "Guest"} 👋</Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          {/* Theme Switch Button */}
          <TouchableOpacity 
            onPress={toggleTheme}
            className={`p-2 rounded-xl mr-3 border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <MaterialCommunityIcons 
              name={isDark ? "weather-sunny" : "weather-night"} 
              size={20} 
              color={isDark ? "#eab308" : "#1e40af"} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setIsScannerVisible(true)}
            className={`p-2 rounded-xl mr-3 border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={isDark ? "#60a5fa" : "#1e40af"} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate("Profile")}
            className={`p-2 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <MaterialCommunityIcons name="account" size={22} color={isDark ? "#60a5fa" : "#1e40af"} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Live in Nanded Banner */}
      <Animatable.View 
        animation="slideInDown" 
        className={`px-5 py-2 flex-row items-center justify-center border-b shadow-sm ${
          isDark ? 'bg-blue-600/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
        }`}
      >
        <MaterialCommunityIcons name="broadcast" size={14} color={isDark ? "#60a5fa" : "#2563eb"} />
        <Text className={`font-black text-[9px] uppercase tracking-[2px] ml-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
          {t('liveInNanded')}
        </Text>
      </Animatable.View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Premium Business Banner for Owners */}
        <Animatable.View animation="fadeIn" className="px-5 py-4">
          <LinearGradient
            colors={isDark ? ['#1e293b', '#0f172a'] : ['#1e3a8a', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`rounded-[32px] p-6 shadow-xl relative overflow-hidden border ${isDark ? 'border-white/5' : 'border-blue-700/30'}`}
          >
            {/* Background pattern */}
            <MaterialCommunityIcons 
              name="store-plus" 
              size={120} 
              color="rgba(255,255,255,0.03)" 
              style={{ position: 'absolute', right: -20, bottom: -20 }} 
            />
            
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <View className="bg-emerald-500/25 self-start px-3 py-1 rounded-full border border-emerald-500/30 mb-3">
                  <Text className="text-emerald-400 text-[8px] font-black uppercase tracking-[2px]">Owner Platform</Text>
                </View>
                <Text className="text-white text-xl font-black mb-1">{t('expandReach')}</Text>
                <Text className="text-slate-300 text-[11px] font-medium leading-4 mb-5">{t('expandReachDesc')}</Text>
                
                <TouchableOpacity 
                    className="bg-white self-start py-3 px-6 rounded-2xl shadow-lg shadow-black/20"
                    onPress={() => {
                        if (isGuest) {
                          showCustomAlert(
                            "लॉगिन आवश्यक",
                            "व्यवसाय नोंदणी करण्यासाठी कृपया लॉगिन करा किंवा नवीन खाते तयार करा.",
                            "warning",
                            async () => {
                              setAlertVisible(false);
                              await logout();
                            },
                            t('cancel') || "Cancel"
                          );
                          return;
                        }
                        showCustomAlert(
                          t('confirm'),
                          "Are you sure you want to register your business on AaramSe? This will create a public profile for your store.",
                          "info",
                          () => {
                            setAlertVisible(false);
                            navigation.navigate("CreateStore");
                          },
                          t('cancel')
                        );
                    }}
                >
                    <View className="flex-row items-center">
                        <Text className="text-slate-900 font-black text-xs mr-2">{t('partnerWithUs')}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#0f172a" />
                    </View>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Categories */}
        <View className="px-4">
          <Text className={`px-2 text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-blue-950'}`}>Quick Categories</Text>
          <View className="flex-row flex-wrap justify-center">
            <CategoryCard title="Hospitals" icon="hospital-building" color="#ef4444" isSelected={selectedCategory === "hospital"} onPress={() => setSelectedCategory(selectedCategory === "hospital" ? null : "hospital")} isDark={isDark} />
            <CategoryCard title="Hotels" icon="bed" color="#f59e0b" isSelected={selectedCategory === "hotel"} onPress={() => setSelectedCategory(selectedCategory === "hotel" ? null : "hotel")} isDark={isDark} />
            <CategoryCard title="Offices" icon="briefcase" color="#3b82f6" isSelected={selectedCategory === "office"} onPress={() => setSelectedCategory(selectedCategory === "office" ? null : "office")} isDark={isDark} />
            <CategoryCard title="Saloons" icon="content-cut" color="#8b5cf6" isSelected={selectedCategory === "saloon"} onPress={() => setSelectedCategory(selectedCategory === "saloon" ? null : "saloon")} isDark={isDark} />
          </View>
        </View>

        {/* Store List */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-center mb-6 px-1">
            <Text className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-955'}`}>Trending Stores</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 font-bold text-xs uppercase tracking-widest">View All</Text>
            </TouchableOpacity>
          </View>

          {stores.filter(store => {
            if (!selectedCategory) return true;
            const type = (store.type || "").toLowerCase();
            const category = selectedCategory.toLowerCase();
            return type.includes(category) || category.includes(type);
          }).length === 0 ? (
            <View className={`items-center py-10 border rounded-[28px] p-6 ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <MaterialCommunityIcons name="store-outline" size={60} color="#475569" />
              <Text className="text-slate-400 mt-4 font-semibold">No stores available right now</Text>
            </View>
          ) : (
            stores.filter(store => {
              if (!selectedCategory) return true;
              const type = (store.type || "").toLowerCase();
              const category = selectedCategory.toLowerCase();
              return type.includes(category) || category.includes(type);
            }).map((store, index) => (
              <Animatable.View 
                key={store._id}
                animation="fadeInUp"
                delay={index * 100}
                className="mb-4"
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate("StorePage", { storeId: store._id })}
                  activeOpacity={0.9}
                  className={`rounded-[28px] p-4 border shadow-sm ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm shadow-slate-100/50'
                  }`}
                >
                  <View className="flex-row">
                    <View className={`w-16 h-16 rounded-2xl items-center justify-center mr-3 border ${
                      isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100/30'
                    }`}>
                      <MaterialCommunityIcons name="storefront" size={28} color={isDark ? "#60a5fa" : "#2563eb"} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`} numberOfLines={1}>{store.name}</Text>
                          <View className="flex-row items-center mt-0.5">
                            <Text className="text-blue-500/80 text-[9px] font-black uppercase tracking-widest">{store.type}</Text>
                            {store.feedbacks && store.feedbacks.length > 0 && (
                              <View className={`flex-row border-l ml-2 pl-2 items-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                <MaterialCommunityIcons name="star" size={10} color="#f59e0b" />
                                <Text className={`font-bold text-[9px] ml-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {(store.feedbacks.reduce((a, b) => a + b.rating, 0) / store.feedbacks.length).toFixed(1)}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View className={`px-2.5 py-1 rounded-xl flex-row items-center border ${
                          isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'
                        }`}>
                          <MaterialCommunityIcons name="account-group" size={12} color={isDark ? "#10b981" : "#059669"} />
                          <Text className={`font-bold text-[10px] ml-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{store.currentQueueNumber || 0}</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center mt-2.5">
                        <MaterialCommunityIcons name="map-marker" size={12} color="#475569" />
                        <Text className={`text-[10px] font-semibold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} numberOfLines={1}>{store.location}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className={`h-[1px] w-full my-3 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                  
                  <View className="flex-row justify-between items-center">
                    <Text className={`font-black text-[9px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>By {store.fname}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-blue-500 font-black text-xs mr-1 uppercase tracking-widest">Book Now</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#3b82f6" />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Styled Sidebar */}
      {isSidebarVisible && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            className="bg-black/60 z-20"
            onPress={toggleSidebar}
            activeOpacity={1}
          />
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: width * 0.78,
              backgroundColor: isDark ? "#070b16" : "#ffffff",
              borderRightWidth: 1,
              borderRightColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
              transform: [{ translateX: sidebarTranslate }],
              zIndex: 30,
              paddingTop: Platform.OS === 'ios' ? 64 : 50,
              paddingHorizontal: 20,
            }}
          >
            <LinearGradient
              colors={isDark ? ['#070b16', '#020617'] : ['#ffffff', '#f8fafc']}
              style={StyleSheet.absoluteFillObject}
            />
            
            {/* Header */}
            <View className="flex-row items-center mb-6 px-2">
              <View className="flex-row items-center">
                <Text className={`text-2xl font-black ${isDark ? 'text-white' : 'text-blue-955'}`}>आराम</Text>
                <Text className="text-blue-500 text-2xl font-black">Se</Text>
              </View>
            </View>

            {/* Profile Section */}
            <View className={`p-4 rounded-[24px] mb-6 border ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-sm shadow-slate-100/30'
            }`}>
              <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
                  isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100 shadow-sm'
                }`}>
                  <Text className={`font-black text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {isGuest ? 'G' : (userDetails?.name?.charAt(0) || 'U')}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-805'}`} numberOfLines={1}>
                    {isGuest ? 'Guest Explorer' : (userDetails?.name || 'AaramSe User')}
                  </Text>
                  <Text className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`} numberOfLines={1}>
                    {isGuest ? 'Limited Access' : (userDetails?.phone || userDetails?.email || 'Active Member')}
                  </Text>
                </View>
              </View>
              {isGuest && (
                <TouchableOpacity 
                  onPress={async () => {
                    toggleSidebar();
                    await logout();
                  }}
                  className="mt-3 bg-blue-600 py-2.5 rounded-xl items-center shadow-lg shadow-blue-500/20"
                >
                  <Text className="text-white font-black text-[9px] uppercase tracking-widest">Sign In / Register</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Navigation Menu */}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="space-y-1">
                <SidebarItem label="Dashboard" icon="view-dashboard" active onPress={toggleSidebar} isDark={isDark} />
                <SidebarItem 
                  label="My Bookings" 
                  icon="calendar-clock" 
                  isDark={isDark}
                  onPress={() => {
                    toggleSidebar();
                    if (isGuest) {
                      showCustomAlert(
                        "लॉगिन आवश्यक",
                        "अपॉइंटमेंट इतिहास पाहण्यासाठी कृपया लॉगिन करा किंवा नवीन खाते तयार करा.",
                        "warning",
                        async () => {
                          setAlertVisible(false);
                          await logout();
                        },
                        "Cancel"
                      );
                      return;
                    }
                    navigation.navigate("History");
                  }} 
                />
                <SidebarItem label="Help Center" icon="help-circle" onPress={() => { toggleSidebar(); navigation.navigate("Help"); }} isDark={isDark} />
                <SidebarItem label="Contact Us" icon="email-outline" onPress={() => { toggleSidebar(); navigation.navigate("ContactUs"); }} isDark={isDark} />
                <SidebarItem label="About App" icon="information-outline" onPress={() => { toggleSidebar(); navigation.navigate("AboutUs"); }} isDark={isDark} />
              </View>

              <View className={`h-[1px] my-6 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />

              <TouchableOpacity 
                  onPress={handleLogout}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                    isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-55 border-red-100'
                  }`}
              >
                <View className="flex-row items-center">
                  <View className={`p-2 rounded-xl mr-3 ${isDark ? 'bg-red-955/20' : 'bg-red-50'}`}>
                    <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
                  </View>
                  <Text className="text-red-505 font-black text-xs uppercase tracking-widest">Log Out</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#ef4444" style={{ opacity: 0.6 }} />
              </TouchableOpacity>
            </ScrollView>

            {/* Footer */}
            <View className="py-6 border-t border-transparent">
                <Text className={`text-[9px] font-black uppercase tracking-widest text-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Version 1.0.0</Text>
                <Text className={`text-[9px] text-center mt-1 font-semibold ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>© HarIT Tech Solution</Text>
            </View>
          </Animated.View>
        </>
      )}

      {/* QR Scanner Modal */}
      <Modal
        visible={isScannerVisible}
        animationType="slide"
        onRequestClose={() => setIsScannerVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-1">
            <View className="p-6 flex-row items-center justify-between z-10">
               <Text className="text-white font-black text-xl">Scan Store QR</Text>
               <TouchableOpacity 
                  onPress={() => setIsScannerVisible(false)}
                  className="bg-white/20 p-2 rounded-full"
               >
                  <MaterialCommunityIcons name="close" size={24} color="#fff" />
               </TouchableOpacity>
            </View>

            <CameraView
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={scanned ? undefined : ({ data }) => {
                setScanned(true);
                setIsScannerVisible(false);
                setScanned(false);
                navigation.navigate("StorePage", { storeId: data });
              }}
              style={StyleSheet.absoluteFillObject}
            />
            
            <View className="flex-1 items-center justify-center">
               <View className="w-64 h-64 border-2 border-white/50 rounded-[40px] items-center justify-center">
                  <Animatable.View 
                    animation="pulse" 
                    iterationCount="infinite"
                    className="w-full h-0.5 bg-blue-500 shadow-lg shadow-blue-500"
                  />
               </View>
               <Text className="text-white/60 text-xs font-bold mt-10 uppercase tracking-[3px]">Align QR code inside frame</Text>
            </View>

            <View className="p-10">
               <TouchableOpacity 
                 onPress={scanFromGallery}
                 className="bg-white py-5 rounded-3xl flex-row items-center justify-center shadow-xl"
               >
                  <MaterialCommunityIcons name="image-plus" size={24} color="#1e40af" />
                  <Text className="text-blue-900 font-black text-base ml-3 uppercase tracking-widest">Scan from Photos</Text>
               </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <CustomAlert 
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttonText={alertConfig.buttonText || "OK"}
        cancelText={alertConfig.cancelText}
      />
    </View>
  );
};

const SidebarItem = ({ label, icon, active, onPress, isDark }) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.7}
    className={`flex-row items-center justify-between p-3.5 rounded-2xl mb-2 border ${
      active 
        ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20' 
        : (isDark ? 'bg-transparent border-transparent' : 'bg-transparent border-transparent')
    }`}
  >
    <View className="flex-row items-center">
      <View className={`p-2 rounded-xl mr-3 ${
        active 
          ? 'bg-white/20' 
          : (isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-100')
      }`}>
        <MaterialCommunityIcons name={icon} size={20} color={active ? '#fff' : (isDark ? '#60a5fa' : '#2563eb')} />
      </View>
      <Text className={`font-black text-xs uppercase tracking-widest ${active ? 'text-white' : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>{label}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={16} color={active ? 'rgba(255,255,255,0.6)' : (isDark ? '#475569' : '#cbd5e1')} />
  </TouchableOpacity>
);

export default Dashboard;
