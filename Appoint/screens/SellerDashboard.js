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
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import CustomAlert from '../components/CustomAlert';
import { Modal as RNModal } from 'react-native';
import ViewShot from "react-native-view-shot";
import * as Sharing from 'expo-sharing';
import logo from '../assets/logo.png';
import { useTheme } from '../middleware/ThemeContext';

const { width } = Dimensions.get("window");

const SellerDashboard = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stores, setStores] = useState([]);
  const [userId, setUserId] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null, cancelText: null });
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const showCustomAlert = (title, message, type = "info", onConfirm = null, cancelText = null) => {
    setAlertConfig({ title, message, type, onConfirm, cancelText });
    setAlertVisible(true);
  };
  const [selectedStoreForQr, setSelectedStoreForQr] = useState(null);
  const qrViewRef = useRef();

  const isDark = theme === 'dark';

  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        const decodedToken = jwtDecode(token);
        const uId = decodedToken.user?.id;
        setUserId(uId);
        
        // Using the dedicated list endpoint which returns ONLY owner's stores
        const response = await axios.get(`${API_BASE_URL}/api/store/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStores(response.data);
      }
    } catch (error) {
      console.error("SellerDashboard fetch error:", error);
      setAlertConfig({ title: "Error", message: "Could not load your stores.", type: "error" });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const downloadQR = async () => {
    try {
      const uri = await qrViewRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        setAlertConfig({ title: "Error", message: "Sharing is not available on this device", type: "error" });
        setAlertVisible(true);
      }
    } catch (error) {
       console.error("QR Export error:", error);
       setAlertConfig({ title: "Error", message: "Failed to export QR code.", type: "error" });
       setAlertVisible(true);
    }
  };

  const handleDeleteStore = (storeId) => {
    showCustomAlert(
      "Delete Store",
      "This will permanently remove your store and all its data. Continue?",
      "warning",
      async () => {
        setAlertVisible(false);
        try {
          const token = await AsyncStorage.getItem("userToken");
          await axios.delete(`${API_BASE_URL}/api/store/delete/${storeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showCustomAlert("Success", "Store deleted successfully.", "success", () => {
            setAlertVisible(false);
            fetchData();
          });
        } catch (error) {
          showCustomAlert("Error", "Could not delete store.", "error");
        }
      },
      "Cancel"
    );
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
        <View className="px-6 pt-6 pb-2">
            <View className="flex-row items-center justify-between mb-8">
               <View className="flex-row items-center">
                  <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    className={`w-12 h-12 items-center justify-center rounded-2xl shadow-sm border mr-4 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                    }`}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={28} color={isDark ? "#fff" : "#1e293b"} />
                  </TouchableOpacity>
                  <View>
                    <Text className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>My Stores</Text>
                    <Text className="text-blue-500 font-bold text-[9px] uppercase tracking-[2px]">Business Manager</Text>
                  </View>
               </View>
               <TouchableOpacity 
                  onPress={() => navigation.navigate("CreateStore")}
                  className="bg-emerald-500 w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-emerald-500/30"
               >
                  <MaterialCommunityIcons name="plus" size={28} color="#fff" />
               </TouchableOpacity>
            </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {stores.length === 0 ? (
            <Animatable.View animation="fadeInUp" className="items-center justify-center mt-20">
              <View className={`p-10 rounded-[48px] items-center border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}>
                <MaterialCommunityIcons name="store-plus-outline" size={80} color={isDark ? "#1e293b" : "#e2e8f0"} />
                <Text className={`text-xl font-black mt-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No stores registered</Text>
                <Text className={`text-center font-medium mt-2 px-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Start your business journey with AaramSe by registering your first shop.</Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate("CreateStore")}
                  className="bg-blue-600 px-6 py-3.5 rounded-2xl mt-10 shadow-xl shadow-blue-500/20"
                >
                  <Text className="text-white font-black uppercase text-xs tracking-widest">Register Now</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          ) : (
            stores.map((store, index) => (
              <Animatable.View 
                key={store._id}
                animation="fadeInUp"
                delay={index * 100}
                className={`rounded-[40px] p-6 mb-6 border ${
                  isDark ? 'bg-slate-900 border-slate-800/80 shadow-none' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <View className="flex-row items-center mb-6">
                  <View className={`w-16 h-16 rounded-2xl items-center justify-center mr-4 ${
                    isDark ? 'bg-blue-500/10' : 'bg-blue-55'
                  }`}>
                    <MaterialCommunityIcons name="storefront" size={32} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-black text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`} numberOfLines={1}>{store.name}</Text>
                    <View className="flex-row items-center">
                       <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                       <Text className={`font-bold text-[9px] uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{store.type}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedStoreForQr(store);
                        setQrModalVisible(true);
                      }}
                      className="mr-4"
                    >
                      <MaterialCommunityIcons name="qrcode" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteStore(store._id)}>
                      <MaterialCommunityIcons name="delete-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className={`flex-row justify-between mb-6 p-4 rounded-2xl ${
                  isDark ? 'bg-slate-950' : 'bg-slate-50'
                }`}>
                   <View className="items-center flex-1">
                      <Text className={`font-black text-base ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{store.appointmentSlots?.length || 0}</Text>
                      <Text className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Days</Text>
                   </View>
                   <View className={`w-[1px] h-6 ${isDark ? 'bg-slate-850' : 'bg-slate-200'}`} />
                   <View className="items-center flex-1">
                      <Text className="text-emerald-500 font-black text-base">{store.currentQueueNumber || 0}</Text>
                      <Text className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>In Queue</Text>
                   </View>
                </View>

                <View className="flex-row flex-wrap justify-between">
                   <TouchableOpacity 
                     onPress={() => navigation.navigate("UpdateSlots", { storeId: store._id })}
                     className="bg-indigo-650 py-3 rounded-2xl items-center flex-row justify-center shadow-md shadow-indigo-650/20"
                     style={{ width: '48%', marginBottom: 10, backgroundColor: '#4f46e5' }}
                   >
                     <MaterialCommunityIcons name="calendar-clock" size={16} color="#fff" />
                     <Text className="text-white font-black ml-1.5 uppercase text-[9px] tracking-widest">Slots</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => navigation.navigate("History", { storeId: store._id })}
                     style={{ width: '48%', marginBottom: 10 }}
                     className="bg-emerald-500 py-3 rounded-2xl items-center flex-row justify-center shadow-md shadow-emerald-500/20"
                   >
                     <MaterialCommunityIcons name="history" size={16} color="#fff" />
                     <Text className="text-white font-black ml-1.5 uppercase text-[9px] tracking-widest">Records</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => navigation.navigate("StorePage", { storeId: store._id })}
                     style={{ width: '48%' }}
                     className={`border py-3 rounded-2xl items-center flex-row justify-center ${
                       isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-100'
                     }`}
                   >
                     <MaterialCommunityIcons name="eye-outline" size={16} color={isDark ? "#475569" : "#64748b"} />
                     <Text className={`font-black ml-1.5 uppercase text-[9px] tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>View Shop</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => navigation.navigate("EditStore", { storeId: store._id })}
                     style={{ width: '48%' }}
                     className={`py-3 rounded-2xl items-center flex-row justify-center border ${
                       isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                     }`}
                   >
                     <MaterialCommunityIcons name="cog-outline" size={16} color={isDark ? "#3b82f6" : "#1e40af"} />
                     <Text className={`font-black ml-1.5 uppercase text-[9px] tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>Settings</Text>
                   </TouchableOpacity>
                </View>
              </Animatable.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <CustomAlert 
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        cancelText={alertConfig.cancelText}
      />

      <RNModal
        visible={qrModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setQrModalVisible(false)}
          className="flex-1 bg-black/80 justify-center items-center px-6"
        >
          <Animatable.View 
            animation="zoomIn" 
            className={`p-0 rounded-[48px] items-center w-full max-w-sm overflow-hidden ${
              isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'
            }`}
          >
            <ViewShot ref={qrViewRef} options={{ format: "jpg", quality: 1.0 }}>
              <View className="bg-white p-8 items-center">
                <LinearGradient
                  colors={['#1e40af', '#3b82f6']}
                  className="w-20 h-20 rounded-3xl items-center justify-center mb-6 shadow-xl"
                >
                   <Image source={logo} style={{ width: 60, height: 60 }} resizeMode="contain" />
                </LinearGradient>
                
                <Text className="text-slate-900 font-black text-2xl mb-1 text-center">{selectedStoreForQr?.name}</Text>
                <Text className="text-blue-500 font-black text-[10px] uppercase tracking-[4px] mb-8 text-center italic">झटपट बुकिंग • आरामSe</Text>
                
                <View className="p-6 bg-slate-50 rounded-[40px] border border-slate-100 shadow-sm mb-6">
                  <QRCode
                    value={selectedStoreForQr?._id}
                    size={220}
                    color="#0f172a"
                    backgroundColor="#f8fafc"
                  />
                </View>

                <View className="flex-row items-center bg-blue-50 px-4 py-2 rounded-full mb-4">
                  <MaterialCommunityIcons name="default-api:ask_permission" size={14} color="#3b82f6" />
                  <Text className="text-blue-700 font-bold text-[9px] uppercase tracking-widest ml-2">Official Verified Store</Text>
                </View>

                <Text className="text-slate-400 text-[8px] font-bold text-center">Scan to book your slot instantly</Text>
              </View>
            </ViewShot>

            <View className={`flex-row p-6 w-full justify-between items-center border-t ${
              isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
            }`}>
              <TouchableOpacity 
                onPress={() => setQrModalVisible(false)}
                className={`flex-1 py-4 rounded-2xl items-center mr-3 border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`font-black uppercase text-xs tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={downloadQR}
                className="flex-1 bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-500/20"
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="download" size={18} color="#fff" />
                  <Text className="text-white font-black uppercase text-xs tracking-widest ml-2">Save</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </TouchableOpacity>
      </RNModal>
    </View>
  );
};

export default SellerDashboard;
