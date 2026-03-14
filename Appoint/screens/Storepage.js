import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Linking,
  StatusBar,
  StyleSheet
} from "react-native";
import * as Notifications from 'expo-notifications';
import { format } from 'date-fns';
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import CustomAlert from '../components/CustomAlert';
import QRCode from 'react-native-qrcode-svg';
import { Modal as RNModal } from 'react-native';

const { width } = Dimensions.get("window");

const StorePage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const { storeId } = route.params;
  const [storeDetails, setStoreDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookedUsers, setBookedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const fetchTokenAndDecode = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user?.id;
        if (userId) {
          setUserId(userId);
          fetchStoreDetails();
        }
      }
    } catch (error) {
      console.error("Token fetch failed:", error);
    }
  };

  useEffect(() => {
    fetchTokenAndDecode();
  }, []);

  const fetchStoreDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/store/findstore/${storeId}`);
      setStoreDetails(response.data);
    } catch (error) {
      console.error("Error fetching store details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeDetails?.images?.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % storeDetails.images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [storeDetails]);

  const handleSlotSelect = (appointmentSlotId, timeSlotId) => {
    setSelectedSlot(appointmentSlotId);
    setSelectedTimeSlot(timeSlotId);
  };

  const handleBookNow = () => {
    if (selectedSlot && selectedTimeSlot) {
      if (isOwner) {
        // Find the selected time slot details for the header
        let selectedTimeLabel = "";
        storeDetails.appointmentSlots.forEach(slot => {
          const ts = slot.timeSlots.find(t => t._id === selectedTimeSlot);
          if (ts) selectedTimeLabel = `${ts.startTime} - ${ts.endTime}`;
        });

        navigation.navigate("SlotBookings", {
          storeId,
          slotId: selectedTimeSlot,
          slotTime: selectedTimeLabel
        });
      } else {
        navigation.navigate("Booking", {
          storeId,
          appointmentSlotId: selectedSlot,
          timeSlotId: selectedTimeSlot,
        });
      }
    } else {
      Alert.alert('Selection Required', 'Please choose a time slot first.');
    }
  };

  const handleUsers = async () => {
    if (!selectedTimeSlot) {
      Alert.alert("Notice", "Select a time slot to check queue position.");
      return;
    }
    setLoadingUsers(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/store/stores/${storeId}/slots/${selectedTimeSlot}/booked-users`
      );
      const usersWithSequence = response.data.map((user, index) => ({
        ...user,
        sequenceNumber: index + 1,
      }));
      const currentUser = usersWithSequence.find(u => u.user._id === userId);
      if (currentUser) {
        setBookedUsers([currentUser]);
      } else {
        setBookedUsers([]);
        setAlertConfig({
          title: "Information",
          message: "You haven't booked this slot yet.",
          type: "info"
        });
        setAlertVisible(true);
      }
    } catch (error) {
       console.error("Error fetching queue:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1e40af" />
        <Text className="mt-4 text-gray-500 font-medium">Loading Store Details...</Text>
      </View>
    );
  }

  const isOwner = storeDetails?.owner === userId;
  const today = new Date().toISOString().split("T")[0];
  const todaySlots = storeDetails?.appointmentSlots?.filter(
    (slot) => new Date(slot.date).toISOString().split("T")[0] === today
  ) || [];

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        
        {/* Modern Image Slider with Overlay */}
        <View className="h-72 relative">
          <Image
            source={{ uri: storeDetails.images?.[currentImageIndex]?.url || "https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=1856&auto=format&fit=crop" }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            className="absolute bottom-0 left-0 right-0 h-40 justify-end p-6"
          >
            <Animatable.Text animation="fadeInLeft" className="text-white text-3xl font-black">{storeDetails.name}</Animatable.Text>
            <View className="flex-row items-center mt-3">
               <View className="bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30 flex-row items-center">
                  <MaterialCommunityIcons name="map-marker" size={16} color="#10b981" />
                  <Text className="text-emerald-400 ml-1 font-black text-xs uppercase tracking-widest">{storeDetails.location}</Text>
               </View>
            </View>
          </LinearGradient>
          
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="absolute top-12 left-6 bg-white/20 w-10 h-10 items-center justify-center rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
          >
             <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity 
              onPress={() => setQrModalVisible(true)}
              className="absolute top-12 right-6 bg-white/20 w-10 h-10 items-center justify-center rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
            >
               <MaterialCommunityIcons name="qrcode" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-white rounded-t-3xl -mt-6 px-6 py-8">
          {/* Quick Stats Grid */}
          <View className="flex-row justify-between mb-8 bg-slate-50 p-5 rounded-[28px] border border-slate-100">
            <StatItem icon="storefront-outline" label="Type" value={storeDetails.type} color="#3b82f6" />
            <View className="w-[1px] h-8 bg-slate-200 self-center" />
            <StatItem icon="account-outline" label="Owner" value={storeDetails.fname} color="#10b981" />
            <View className="w-[1px] h-8 bg-slate-200 self-center" />
            <StatItem icon="account-group-outline" label="Queue" value={storeDetails.currentQueueNumber || 0} color="#f59e0b" />
          </View>

          <View className="mb-8">
            <Text className="text-slate-900 text-xl font-black mb-3">About the Store</Text>
            <Text className="text-slate-500 leading-6 text-sm font-medium">{storeDetails.description}</Text>
          </View>

          {/* Appointment Selection Section */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-5">
               <Text className="text-slate-900 text-xl font-black">Choose Slot</Text>
               <View className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                  <Text className="text-blue-600 text-xs font-black uppercase tracking-widest">{format(new Date(), 'EEEE, MMM dd')}</Text>
               </View>
            </View>

            {todaySlots.length > 0 ? (
              todaySlots.map((slot, sIdx) => (
                <View key={sIdx} className="mb-4">
                  <View className="flex-row flex-wrap">
                    {slot.timeSlots?.map((ts, tIdx) => {
                      const isSelected = selectedTimeSlot === ts._id;
                      return (
                        <TouchableOpacity
                          key={tIdx}
                          activeOpacity={0.7}
                          onPress={() => handleSlotSelect(slot._id, ts._id)}
                          className={`mr-2.5 mb-3 px-5 py-3.5 rounded-2xl border-2 ${isSelected ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/40' : 'bg-white border-slate-100 shadow-sm'}`}
                        >
                          <View className="flex-row items-center">
                            <MaterialCommunityIcons 
                              name={isSelected ? "clock-check" : "clock-outline"} 
                              size={16} 
                              color={isSelected ? "#fff" : "#64748b"} 
                            />
                            <Text className={`font-black ml-2 text-xs ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                              {ts.startTime} - {ts.endTime}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))
            ) : (
              <View className="bg-red-50 p-6 rounded-3xl items-center border border-red-50">
                 <MaterialCommunityIcons name="calendar-lock-outline" size={40} color="#ef4444" />
                 <Text className="text-red-500 font-black text-lg mt-4">Closed Today</Text>
                 <Text className="text-red-400 text-center font-medium mt-1">Check back later for new slots.</Text>
              </View>
            )}
          </View>

          {/* Feedbacks Section */}
          {storeDetails?.feedbacks?.length > 0 && (
            <View className="mb-8 pl-1">
              <Text className="text-slate-900 text-xl font-black mb-4">What People Say</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
                {storeDetails.feedbacks.map((fb, fIdx) => (
                  <View key={fIdx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mr-4 w-64">
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-3">
                        <Text className="text-blue-600 font-black text-lg">{fb.user?.name?.charAt(0) || 'U'}</Text>
                      </View>
                      <View>
                        <Text className="text-slate-800 font-bold text-sm" numberOfLines={1}>{fb.user?.name || 'User'}</Text>
                        <View className="flex-row items-center mt-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <MaterialCommunityIcons key={star} name={star <= fb.rating ? "star" : "star-outline"} size={12} color={star <= fb.rating ? "#f59e0b" : "#cbd5e1"} />
                          ))}
                        </View>
                      </View>
                    </View>
                    {fb.comment ? <Text className="text-slate-500 text-xs italic" numberOfLines={3}>"{fb.comment}"</Text> : null}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* User Status / Queue Checker */}
          <Animatable.View animation="fadeInUp" delay={400} className="bg-blue-900 p-5 rounded-3xl shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
               <Text className="text-white font-black text-lg">My Position</Text>
               <TouchableOpacity 
                 onPress={handleUsers}
                 className="bg-white/10 p-2.5 px-4 rounded-xl border border-white/10"
               >
                  <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
               </TouchableOpacity>
            </View>

            {loadingUsers ? (
               <ActivityIndicator color="#fff" />
            ) : bookedUsers.length > 0 ? (
              bookedUsers.map((user, idx) => (
                 <Animatable.View animation="pulse" iterationCount="infinite" key={idx} className="bg-white/10 p-6 rounded-3xl flex-row justify-between items-center border border-white/20">
                    <View>
                        <Text className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Queue Status</Text>
                        <Text className="text-white text-4xl font-black">#{user.sequenceNumber}</Text>
                    </View>
                    <View className="bg-emerald-500 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-emerald-500/30">
                        <MaterialCommunityIcons name="check-decagram" size={32} color="#fff" />
                    </View>
                 </Animatable.View>
              ))
            ) : (
               <View className="flex-row items-center bg-blue-800/50 p-4 rounded-2xl border border-blue-800">
                  <MaterialCommunityIcons name="information-outline" size={20} color="#93c5fd" />
                  <Text className="text-blue-100 font-medium ml-3 flex-1">Book a slot to view your live position in the queue.</Text>
               </View>
            )}
          </Animatable.View>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View className="absolute bottom-8 left-5 right-5 flex-row items-center">
        <TouchableOpacity
          onPress={() => setContactModalVisible(true)}
          className="bg-white w-14 h-14 rounded-2xl items-center justify-center shadow-2xl border border-slate-100 mr-3"
        >
          <MaterialCommunityIcons name="phone-outline" size={24} color="#1e40af" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBookNow}
          activeOpacity={0.9}
          className="flex-1 h-14 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/40"
        >
          <LinearGradient
            colors={isOwner ? (selectedTimeSlot ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']) : ['#1e40af', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-1 items-center justify-center flex-row px-4"
          >
            <Text className="text-white font-black text-lg mr-3 tracking-widest text-center">
              {isOwner ? (selectedTimeSlot ? 'MANAGE QUEUE' : 'MANAGE SHOP') : 'BOOK INSTANTLY'}
            </Text>
            <MaterialCommunityIcons name={isOwner ? (selectedTimeSlot ? "account-group" : "cog") : "calendar-check"} size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {isOwner && (
        <TouchableOpacity
          onPress={() => navigation.navigate("StoreRecords", { storeId })}
          className="absolute bottom-28 right-5 bg-emerald-500 rounded-2xl w-14 h-14 items-center justify-center shadow-lg shadow-emerald-500/40"
        >
          <MaterialCommunityIcons name="file-document-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modern Contact Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setContactModalVisible(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <View className="bg-white rounded-t-[50px] p-10 shadow-2xl">
            <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-10" />
            <Text className="text-slate-900 font-black text-3xl mb-2">Get in Touch</Text>
            <Text className="text-slate-400 mb-10 font-bold uppercase tracking-widest text-xs">Reach out to the store owner</Text>
            
            <ContactRow icon="map-marker-radius-outline" label="Location" value={storeDetails.location} color="#ef4444" />
            <ContactRow icon="phone-in-talk-outline" label="Contact Number" value={storeDetails.phoneNumber} color="#3b82f6" />
            
            <TouchableOpacity
               className="bg-emerald-500 py-5 rounded-[24px] mt-6 items-center flex-row justify-center shadow-xl shadow-emerald-500/20"
               onPress={() => {
                 const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeDetails.location)}`;
                 Linking.openURL(url);
               }}
            >
              <MaterialCommunityIcons name="google-maps" size={24} color="#fff" />
              <Text className="text-white font-black text-lg ml-3 tracking-widest">DIRECTIONS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setContactModalVisible(false)}
              className="mt-6 py-4 items-center"
            >
              <Text className="text-slate-400 font-black uppercase tracking-widest text-xs">Close Details</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
          className="flex-1 bg-black/60 justify-center items-center px-6"
        >
          <Animatable.View 
            animation="zoomIn" 
            className="bg-white p-6 rounded-3xl items-center w-full max-w-sm"
          >
            <Text className="text-slate-800 font-black text-xl mb-2 text-center">{storeDetails.name}</Text>
            <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">Store QR Code</Text>
            
            <View className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-8">
              <QRCode
                value={storeDetails._id}
                size={220}
                color="#1e293b"
                backgroundColor="#f8fafc"
              />
            </View>

            <TouchableOpacity 
              onPress={() => setQrModalVisible(false)}
              className="bg-blue-600 w-full py-4 rounded-2xl items-center shadow-lg shadow-blue-500/20"
            >
              <Text className="text-white font-black uppercase tracking-widest">Done</Text>
            </TouchableOpacity>
          </Animatable.View>
        </TouchableOpacity>
      </RNModal>
    </View>
  );
};

const StatItem = ({ icon, label, value, color }) => (
  <View className="items-center px-2">
    <View style={{ backgroundColor: color + '15' }} className="p-3 rounded-2xl mb-2">
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</Text>
    <Text className="text-slate-800 font-black text-xs" numberOfLines={1}>{value}</Text>
  </View>
);

const ContactRow = ({ icon, label, value, color }) => (
  <View className="flex-row items-center mb-6 bg-slate-50 p-5 rounded-[24px] border border-slate-100">
    <View style={{ backgroundColor: color + '10' }} className="p-3 rounded-2xl">
       <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View className="ml-5 flex-1">
       <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</Text>
       <Text className="text-slate-900 font-black text-base" numberOfLines={2}>{value}</Text>
    </View>
  </View>
);

export default StorePage;
