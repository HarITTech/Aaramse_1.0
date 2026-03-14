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

const { width } = Dimensions.get("window");

const SellerDashboard = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stores, setStores] = useState([]);
  const [userId, setUserId] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedStoreForQr, setSelectedStoreForQr] = useState(null);
  const qrViewRef = useRef();



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
    Alert.alert("Delete Store", "This will permanently remove your store and all its data. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const token = await AsyncStorage.getItem("userToken");
          await axios.delete(`${API_BASE_URL}/api/store/delete/${storeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAlertConfig({ title: "Success", message: "Store deleted successfully.", type: "success" });
          setAlertVisible(true);
          fetchData();
        } catch (error) {
          setAlertConfig({ title: "Error", message: "Could not delete store.", type: "error" });
          setAlertVisible(true);
        }
      }}
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-6 pb-2">
            <View className="flex-row items-center justify-between mb-8">
               <View className="flex-row items-center">
                  <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    className="w-12 h-12 bg-white items-center justify-center rounded-2xl shadow-sm border border-slate-100 mr-4"
                  >
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#1e293b" />
                  </TouchableOpacity>
                  <View>
                    <Text className="text-xl font-black text-slate-800">My Stores</Text>
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
              <View className="bg-white p-10 rounded-[48px] items-center border border-slate-100 shadow-sm">
                <MaterialCommunityIcons name="store-plus-outline" size={80} color="#e2e8f0" />
                <Text className="text-slate-800 text-xl font-black mt-6">No stores registered</Text>
                <Text className="text-slate-400 text-center font-medium mt-2 px-6">Start your business journey with AaramSe by registering your first shop.</Text>
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
                className="bg-white rounded-[40px] p-6 mb-6 shadow-sm border border-slate-100"
              >
                <View className="flex-row items-center mb-6">
                  <View className="w-16 h-16 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                    <MaterialCommunityIcons name="storefront" size={32} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-black text-base" numberOfLines={1}>{store.name}</Text>
                    <View className="flex-row items-center">
                       <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                       <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">{store.type}</Text>
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

                <View className="flex-row justify-between mb-6 bg-slate-50 p-4 rounded-2xl">
                   <View className="items-center flex-1">
                      <Text className="text-slate-800 font-black text-base">{store.appointmentSlots?.length || 0}</Text>
                      <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Days</Text>
                   </View>
                   <View className="w-[1px] h-6 bg-slate-200" />
                   <View className="items-center flex-1">
                      <Text className="text-emerald-600 font-black text-base">{store.currentQueueNumber || 0}</Text>
                      <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">In Queue</Text>
                   </View>
                </View>

                <View className="flex-row space-x-2">
                   <TouchableOpacity 
                     onPress={() => navigation.navigate("StorePage", { storeId: store._id })}
                     className="flex-1 bg-white border border-slate-100 py-3 rounded-xl items-center flex-row justify-center"
                   >
                     <MaterialCommunityIcons name="eye-outline" size={16} color="#64748b" />
                     <Text className="text-slate-600 font-black ml-1.5 uppercase text-[9px] tracking-widest">Profile</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => navigation.navigate("EditStore", { storeId: store._id })}
                     className="flex-1 bg-blue-50 py-3 rounded-xl items-center flex-row justify-center border border-blue-100"
                   >
                     <MaterialCommunityIcons name="cog-outline" size={16} color="#1e40af" />
                     <Text className="text-blue-900 font-black ml-1.5 uppercase text-[9px] tracking-widest">Edit</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => navigation.navigate("History", { storeId: store._id })}
                     className="flex-1 bg-emerald-500 py-3 rounded-xl items-center flex-row justify-center shadow-md shadow-emerald-500/20"
                   >
                     <MaterialCommunityIcons name="history" size={16} color="#fff" />
                     <Text className="text-white font-black ml-1.5 uppercase text-[9px] tracking-widest">Records</Text>
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
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
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
            className="bg-white p-0 rounded-[48px] items-center w-full max-w-sm overflow-hidden"
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
                  <MaterialCommunityIcons name="shield-check" size={14} color="#3b82f6" />
                  <Text className="text-blue-700 font-bold text-[9px] uppercase tracking-widest ml-2">Official Verified Store</Text>
                </View>

                <Text className="text-slate-400 text-[8px] font-bold text-center">Scan to book your slot instantly</Text>
              </View>
            </ViewShot>

            <View className="flex-row p-6 bg-slate-50 w-full justify-between items-center border-t border-slate-100">
              <TouchableOpacity 
                onPress={() => setQrModalVisible(false)}
                className="flex-1 bg-white py-4 rounded-2xl items-center mr-3 border border-slate-200"
              >
                <Text className="text-slate-600 font-black uppercase text-xs tracking-widest">Close</Text>
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
