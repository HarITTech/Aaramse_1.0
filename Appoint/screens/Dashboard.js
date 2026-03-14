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
  Modal
} from "react-native";
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../middleware/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import NetInfo from "@react-native-community/netinfo";

const { width } = Dimensions.get("window");

const CategoryCard = ({ icon, title, color, isSelected, onPress }) => (
  <TouchableOpacity 
    className={`m-1 p-2 bg-white rounded-2xl items-center shadow-sm border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}
    style={{ width: (width - 64) / 4 }}
    onPress={onPress}
  >
    <View className={`p-2 rounded-xl mb-1`} style={{ backgroundColor: color + '20' }}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text className={`font-bold text-[10px] text-center ${isSelected ? 'text-blue-600' : 'text-gray-800'}`} numberOfLines={1}>{title}</Text>
  </TouchableOpacity>
);

const Dashboard = () => {
  const navigation = useNavigation();
  const { logout } = useAuth();
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

  const sidebarTranslate = useRef(new Animated.Value(-width)).current;
  const [isOffline, setIsOffline] = useState(false);

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
          fetchStores();
        }
      }
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
    const toValue = isSidebarVisible ? -width : 0;
    Animated.timing(sidebarTranslate, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsSidebarVisible(!isSidebarVisible));
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTokenAndDecode();
    setRefreshing(false);
  }, []);

  const scanFromGallery = async () => {
    Alert.alert("Feature Update", "Scanning from photos is currently optimized for development builds. Please use the live camera scanner for the best experience.");
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
        await axios.post(`${API_BASE_URL}/api/auth/logout`);
        await logout();
        navigation.navigate("Login");
      }}
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {isOffline && (
        <Animatable.View animation="slideInDown" className="bg-red-500 py-2 items-center flex-row justify-center z-50">
          <MaterialCommunityIcons name="wifi-off" size={14} color="white" />
          <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-2">Internet is not available</Text>
        </Animatable.View>
      )}
      
      {/* Premium Header */}
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        className="pt-10 pb-4 px-5 flex-row justify-between items-center shadow-sm z-10"
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={toggleSidebar} className="mr-3 p-2 bg-blue-50 rounded-xl">
            <MaterialCommunityIcons name="menu" size={24} color="#1e40af" />
          </TouchableOpacity>
          <View>
            <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-[2px]">Good Day</Text>
            <Text className="text-blue-900 text-base font-black">{userDetails?.name?.split(' ')[0] || "Guest"} 👋</Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => setIsScannerVisible(true)}
            className="p-2 bg-blue-50 rounded-xl mr-3"
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#1e40af" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate("Profile")}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"
          >
            <MaterialCommunityIcons name="account" size={22} color="#1e40af" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Featured Section */}
        <Animatable.View animation="fadeIn" className="px-5 py-4">
          <LinearGradient
            colors={['#326bf3', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-[32px] p-5 shadow-xl"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-white text-lg font-black mb-1">Appointment</Text>
                <Text className="text-blue-50/70 text-[10px] font-bold uppercase tracking-widest">Book instantly</Text>
                <TouchableOpacity 
                    className="bg-white mt-4 self-start py-2 px-5 rounded-2xl shadow-lg shadow-blue-500/20"
                    onPress={() => navigation.navigate("CreateStore")}
                >
                    <Text className="text-blue-700 font-black text-xs">Partner with us</Text>
                </TouchableOpacity>
              </View>
              <MaterialCommunityIcons name="calendar-check" size={60} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', right: 0, bottom: -5 }} />
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Categories */}
        <View className="px-4">
          <Text className="px-2 text-gray-900 text-lg font-bold mb-4">Quick Categories</Text>
          <View className="flex-row flex-wrap justify-center">
            <CategoryCard title="Hospitals" icon="hospital-building" color="#ef4444" isSelected={selectedCategory === "hospital"} onPress={() => setSelectedCategory(selectedCategory === "hospital" ? null : "hospital")} />
            <CategoryCard title="Hotels" icon="bed" color="#f59e0b" isSelected={selectedCategory === "hotel"} onPress={() => setSelectedCategory(selectedCategory === "hotel" ? null : "hotel")} />
            <CategoryCard title="Offices" icon="briefcase" color="#3b82f6" isSelected={selectedCategory === "office"} onPress={() => setSelectedCategory(selectedCategory === "office" ? null : "office")} />
            <CategoryCard title="Saloons" icon="content-cut" color="#8b5cf6" isSelected={selectedCategory === "saloon"} onPress={() => setSelectedCategory(selectedCategory === "saloon" ? null : "saloon")} />
          </View>
        </View>

        {/* Store List */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-gray-900 text-xl font-bold tracking-tight">Trending Stores</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          {stores.filter(store => {
            if (!selectedCategory) return true;
            const type = (store.type || "").toLowerCase();
            const category = selectedCategory.toLowerCase();
            // Match singular/plural and partials (e.g. "hospital" matches "hospitals")
            return type.includes(category) || category.includes(type);
          }).length === 0 ? (
            <View className="items-center py-10">
              <MaterialCommunityIcons name="store-outline" size={60} color="#cbd5e1" />
              <Text className="text-gray-400 mt-4 font-medium">No stores available right now</Text>
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
                className="mb-3"
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate("StorePage", { storeId: store._id })}
                  activeOpacity={0.9}
                  className="bg-white rounded-[28px] p-4 shadow-sm border border-slate-100"
                >
                  <View className="flex-row">
                    <View className="bg-blue-50 w-16 h-16 rounded-2xl items-center justify-center mr-3">
                      <MaterialCommunityIcons name="storefront" size={32} color="#1e40af" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-slate-900 text-sm font-black" numberOfLines={1}>{store.name}</Text>
                          <View className="flex-row items-center mt-0.5">
                            <Text className="text-blue-600/60 text-[9px] font-black uppercase tracking-widest">{store.type}</Text>
                            {store.feedbacks && store.feedbacks.length > 0 && (
                              <View className="flex-row border-l border-slate-200 ml-2 pl-2 items-center">
                                <MaterialCommunityIcons name="star" size={10} color="#f59e0b" />
                                <Text className="text-slate-600 font-bold text-[9px] ml-0.5">
                                  {(store.feedbacks.reduce((a, b) => a + b.rating, 0) / store.feedbacks.length).toFixed(1)}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View className="bg-emerald-50 px-2.5 py-1 rounded-xl flex-row items-center border border-emerald-100">
                          <MaterialCommunityIcons name="account-group" size={12} color="#059669" />
                          <Text className="text-emerald-700 font-bold text-[10px] ml-1">{store.currentQueueNumber || 0}</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center mt-2.5">
                        <MaterialCommunityIcons name="map-marker" size={12} color="#94a3b8" />
                        <Text className="text-slate-400 text-[10px] font-medium ml-1" numberOfLines={1}>{store.location}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="h-[1px] bg-slate-50 w-full my-3" />
                  
                  <View className="flex-row justify-between items-center">
                    <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">By {store.fname}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-blue-600 font-black text-xs mr-1 uppercase tracking-widest">Book Now</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#2563eb" />
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
            className="bg-black/50 z-20"
            onPress={toggleSidebar}
            activeOpacity={1}
          />
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: width * 0.75,
              backgroundColor: "#fff",
              transform: [{ translateX: sidebarTranslate }],
              zIndex: 30,
              paddingTop: 60,
              paddingHorizontal: 24,
            }}
          >
            <View className="flex-row items-center mb-10">
              <View className="bg-blue-600 p-2 rounded-xl">
                 <MaterialCommunityIcons name="lightning-bolt" size={30} color="#fff" />
              </View>
              <Text className="text-2xl font-black text-blue-900 ml-3">आराम<Text className="text-emerald-500">Se</Text></Text>
            </View>

            <View className="space-y-4 mb-10">
              <SidebarItem label="Dashboard" icon="view-dashboard" active onPress={toggleSidebar} />
              <SidebarItem label="My Bookings" icon="calendar-clock" onPress={() => navigation.navigate("History")} />
              <SidebarItem label="Help Center" icon="help-circle" onPress={() => navigation.navigate("Help")} />
              <SidebarItem label="Contact Us" icon="email-outline" onPress={() => navigation.navigate("ContactUs")} />
              <SidebarItem label="About App" icon="information-outline" onPress={() => navigation.navigate("AboutUs")} />
            </View>

            <View className="h-[1px] bg-gray-100 my-6" />

            <TouchableOpacity 
                onPress={handleLogout}
                className="flex-row items-center p-3 rounded-xl bg-red-50"
            >
              <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
              <Text className="ml-4 text-red-600 font-bold">Log Out</Text>
            </TouchableOpacity>

            <View className="absolute bottom-10 left-6 right-6">
                <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest text-center">Version 1.0.0</Text>
                <Text className="text-gray-300 text-[10px] text-center mt-2">© Harit Solutions</Text>
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
    </View>
  );
};

const SidebarItem = ({ label, icon, active, onPress }) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`flex-row items-center p-4 rounded-2xl mb-2 ${active ? 'bg-blue-600 shadow-lg' : 'bg-transparent'}`}
  >
    <MaterialCommunityIcons name={icon} size={24} color={active ? '#fff' : '#475569'} />
    <Text className={`ml-4 font-bold ${active ? 'text-white' : 'text-slate-600'}`}>{label}</Text>
  </TouchableOpacity>
);

export default Dashboard;
