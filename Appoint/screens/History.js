import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  RefreshControl,
  Modal,
  Linking,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from "@react-native-community/netinfo";
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config/api';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../middleware/ThemeContext';

const History = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { storeId: paramStoreId, userId: paramUserId } = route.params || {}; 
  
  const isDark = theme === 'dark';
  
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Feedback States
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackStoreId, setFeedbackStoreId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const decodedToken = jwtDecode(token);
      const uId = paramUserId || decodedToken.user?.id;
      
      let endpoint = "";
      if (paramStoreId) {
        endpoint = `${API_BASE_URL}/api/store/stores/${paramStoreId}/booking-history`;
      } else {
        endpoint = `${API_BASE_URL}/api/auth/history/${uId}`;
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setHistory(response.data);
        setFilteredHistory(response.data);
      }
    } catch (error) {
      console.error("History fetch error:", error);
      setHistory([]);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramStoreId, paramUserId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    let filtered = history;

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.store?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredHistory(filtered);
  }, [searchQuery, statusFilter, history]);

  const handleOpenFeedback = (storeId) => {
    setFeedbackStoreId(storeId);
    setRating(5);
    setComment('');
    setFeedbackModalVisible(true);
  };

  const submitFeedback = async () => {
    if (!feedbackStoreId) return;
    setSubmittingFeedback(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.post(`${API_BASE_URL}/api/store/stores/${feedbackStoreId}/feedback`, {
        rating, comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackModalVisible(false);
    } catch (error) {
      console.error("Feedback error:", error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const renderHistoryItem = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={index * 50} 
      className={`p-6 mb-6 rounded-[32px] border ${
        isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center mb-1">
             <MaterialCommunityIcons name="storefront-outline" size={16} color="#3b82f6" />
             <Text className={`font-black text-lg ml-2 ${isDark ? 'text-white' : 'text-slate-900'}`} numberOfLines={1}>
               {item.store?.name || 'Shop Name'}
             </Text>
          </View>
          <Text className={`text-[10px] font-black uppercase tracking-[1px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
             Booked for: {item.name}
          </Text>
        </View>
        <View className={`px-4 py-2 rounded-2xl ${
          item.status === 'Completed' ? (isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100') : 
          item.status === 'Canceled' ? (isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100') :
          (isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100')
        }`}>
           <Text className={`text-[10px] font-black uppercase tracking-widest ${
             item.status === 'Completed' ? 'text-emerald-500' : 
             item.status === 'Canceled' ? 'text-red-500' :
             'text-amber-500'
           }`}>
             {item.status}
           </Text>
        </View>
      </View>

      <View className={`h-[1px] w-full mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`} />

      <View className="flex-row flex-wrap justify-between">
         <View className="flex-row items-center mb-3 w-1/2">
            <View className={`w-8 h-8 rounded-xl items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
               <MaterialCommunityIcons name="calendar-range" size={16} color={isDark ? "#94a3b8" : "#64748b"} />
            </View>
            <View className="ml-3">
               <Text className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Appointment Date</Text>
               <Text className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                 {item.slot ? format(new Date(item.slot.date), 'MMM dd, yyyy') : format(new Date(item.bookingTime), 'MMM dd, yyyy')}
               </Text>
            </View>
         </View>
         
         <View className="flex-row items-center mb-3 w-1/2 justify-end">
            <View className={`w-8 h-8 rounded-xl items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
               <MaterialCommunityIcons name="clock-outline" size={16} color={isDark ? "#94a3b8" : "#64748b"} />
            </View>
            <View className="ml-3">
               <Text className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Time Slot</Text>
               <Text className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                 {item.slot ? `${item.slot.startTime} - ${item.slot.endTime}` : 'No Slot'}
               </Text>
            </View>
         </View>

         {item.status !== 'Scheduled' && item.completionTime && (
            <View className={`flex-row items-center mt-2 w-full pt-2 border-t mb-1 ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
              <MaterialCommunityIcons name="timeline-check-outline" size={12} color="#94a3b8" />
              <Text className="text-slate-500 text-[9px] font-black uppercase ml-1">
                 {item.status === 'Completed' ? 'Completed at: ' : 'Canceled at: '}
                 <Text className="text-slate-450">{format(new Date(item.completionTime), 'MMM dd, yyyy | hh:mm a')}</Text>
              </Text>
            </View>
         )}

         {item.documents && item.documents.length > 0 && (
            <View className={`mt-4 w-full pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
               <Text className={`text-[8px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Attached Documents</Text>
               <View className="flex-row flex-wrap">
                  {item.documents.map((doc, dIdx) => (
                    <TouchableOpacity 
                      key={dIdx} 
                      onPress={() => Linking.openURL(doc.url)}
                      className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 mr-2 mb-2 flex-row items-center"
                    >
                      <MaterialCommunityIcons name="file-download-outline" size={14} color="#2563eb" />
                      <Text className="text-blue-600 font-bold text-[10px] ml-1">View Doc {dIdx + 1}</Text>
                    </TouchableOpacity>
                  ))}
               </View>
            </View>
         )}
      </View>
      {item.status === 'Completed' && !paramStoreId && (
        <TouchableOpacity 
          onPress={() => handleOpenFeedback(item.store?._id)}
          className={`mt-4 py-3 rounded-2xl border items-center flex-row justify-center ${
            isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
          }`}
        >
          <MaterialCommunityIcons name="star-outline" size={18} color="#3b82f6" />
          <Text className="text-blue-500 font-bold ml-2 text-xs uppercase tracking-widest">Leave Feedback</Text>
        </TouchableOpacity>
      )}
    </Animatable.View>
  );

  const FilterChip = ({ label }) => {
    const isActive = statusFilter === label;
    return (
      <TouchableOpacity 
        onPress={() => setStatusFilter(label)}
        className={`px-6 py-3 rounded-2xl mr-3 ${isActive ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : (isDark ? 'bg-slate-900 border border-slate-800/80' : 'bg-white border border-slate-100')}`}
      >
        <Text className={`font-black text-xs uppercase tracking-widest ${isActive ? 'text-white' : (isDark ? 'text-slate-450' : 'text-slate-400')}`}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView className="flex-1">
        <View className="px-6 pt-6 pb-2">
            {isOffline && (
              <Animatable.View animation="fadeInDown" className="bg-red-500 p-2 rounded-xl mb-4 items-center flex-row justify-center">
                <MaterialCommunityIcons name="wifi-off" size={16} color="white" />
                <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-2">You are currently offline</Text>
              </Animatable.View>
            )}
            <View className="flex-row items-center mb-8">
               <TouchableOpacity 
                 onPress={() => navigation.goBack()}
                 className={`w-12 h-12 items-center justify-center rounded-2xl shadow-sm border ${
                   isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                 }`}
               >
                 <MaterialCommunityIcons name="chevron-left" size={28} color={isDark ? "#fff" : "#1e293b"} />
               </TouchableOpacity>
               <View>
                 <Text className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Booking History</Text>
                 <Text className="text-blue-500 font-bold text-[10px] uppercase tracking-[2px]">Trace your past sessions</Text>
               </View>
            </View>
            
            <View className={`flex-row items-center border rounded-3xl px-5 h-16 mb-6 shadow-sm ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <MaterialCommunityIcons name="magnify" size={22} color={isDark ? "#475569" : "#94a3b8"} />
              <TextInput
                placeholder="Search by store or name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className={`flex-1 ml-3 font-bold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}
                placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
              />
            </View>

            <View className="mb-6">
               <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                  <FilterChip label="All" />
                  <FilterChip label="Scheduled" />
                  <FilterChip label="Completed" />
                  <FilterChip label="Canceled" />
               </ScrollView>
            </View>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching past records...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item) => item._id}
            renderItem={renderHistoryItem}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Animatable.View animation="fadeInUp" className="items-center justify-center mt-20 px-10">
                 <View className={`p-10 rounded-[48px] items-center border shadow-sm w-full ${
                   isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                 }`}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={80} color={isDark ? "#1e293b" : "#e2e8f0"} />
                    <Text className={`text-xl font-black mt-6 ${isDark ? 'text-slate-350' : 'text-slate-800'}`}>No records found</Text>
                    <Text className={`text-center font-medium mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {statusFilter === 'All' 
                        ? "You haven't made any appointments yet." 
                        : `No appointments with status "${statusFilter}" found.`}
                    </Text>
                 </View>
              </Animatable.View>
            }
          />
        )}
      </SafeAreaView>

      <Modal visible={feedbackModalVisible} transparent animationType="slide" onRequestClose={() => setFeedbackModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`rounded-t-[40px] p-8 ${isDark ? 'bg-slate-900 border-t border-slate-800' : 'bg-white'}`}>
            <Text className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Rate Your Experience</Text>
            <Text className={`font-medium mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your feedback helps us improve.</Text>
            
            <View className="flex-row justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} className="px-2">
                  <MaterialCommunityIcons name={star <= rating ? "star" : "star-outline"} size={40} color={star <= rating ? "#f59e0b" : "#cbd5e1"} />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Leave a comment (optional)..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              className={`border rounded-2xl p-4 font-medium mb-6 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-100 text-slate-800'
              }`}
              placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
              textAlignVertical="top"
            />

            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => setFeedbackModalVisible(false)} className="flex-1 py-4 mr-3 items-center">
                <Text className="text-slate-400 font-black uppercase tracking-widest">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={submitFeedback}
                disabled={submittingFeedback}
                className="flex-1 bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-500/30"
              >
                {submittingFeedback ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase tracking-widest">Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default History;
