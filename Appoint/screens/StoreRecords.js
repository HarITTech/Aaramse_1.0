import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, TouchableOpacity, 
  SafeAreaView, StatusBar, ScrollView, RefreshControl, Dimensions, Alert
} from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import NetInfo from "@react-native-community/netinfo";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

const { width } = Dimensions.get('window');

const StoreRecords = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { storeId } = route.params || {}; 
  
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState('All');
  const [availableDates, setAvailableDates] = useState(['All']);
  const [exporting, setExporting] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get(`${API_BASE_URL}/api/store/stores/${storeId}/booking-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data || [];
      setRecords(data);
      setFilteredRecords(data);

      const dates = ['All', ...new Set(data.map(item => {
          const dateStr = item.slot ? item.slot.date : item.bookingTime;
          return format(new Date(dateStr), 'MMM dd, yyyy');
      }))];
      setAvailableDates(dates);

    } catch (error) {
      console.error("Fetch records error:", error);
      setRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (selectedDate === 'All') {
      setFilteredRecords(records);
    } else {
      setFilteredRecords(records.filter(item => {
        const dateStr = item.slot ? item.slot.date : item.bookingTime;
        return format(new Date(dateStr), 'MMM dd, yyyy') === selectedDate;
      }));
    }
  }, [selectedDate, records]);

  const exportPDF = async () => {
    if (filteredRecords.length === 0) return Alert.alert("No Data", "No records found to export.");
    setExporting(true);
    try {
      let htmlRows = filteredRecords.map((item, index) => {
        const dateStr = item.slot ? item.slot.date : item.bookingTime;
        const formattedDate = format(new Date(dateStr), 'MMM dd, yyyy');
        const timeStr = item.slot ? `${item.slot.startTime} - ${item.slot.endTime}` : 'No Slot';
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${item.name || 'N/A'}</td>
            <td>${item.phoneNumber || 'N/A'}</td>
            <td>${formattedDate}</td>
            <td>${timeStr}</td>
            <td style="color: ${item.status === 'Completed' ? 'green' : 'red'};">${item.status}</td>
          </tr>
        `;
      }).join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; }
              h1 { text-align: center; color: #1e40af; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f1f5f9; color: #334155; }
            </style>
          </head>
          <body>
            <h1>Store Booking Records</h1>
            <table>
              <tr>
                <th>#</th>
                <th>User Name</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Status</th>
              </tr>
              ${htmlRows}
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error(e);
      Alert.alert("Export Error", "Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  };

  const exportCSV = async () => {
    if (filteredRecords.length === 0) return Alert.alert("No Data", "No records found to export.");
    setExporting(true);
    try {
      let csvContent = "S.No,User Name,Phone,Date,Time Slot,Status\n";
      filteredRecords.forEach((item, index) => {
        const dateStr = item.slot ? item.slot.date : item.bookingTime;
        const formattedDate = format(new Date(dateStr), 'MMM dd, yyyy');
        const timeStr = item.slot ? `${item.slot.startTime} - ${item.slot.endTime}` : 'No Slot';
        
        const row = [
          index + 1,
          `"${item.name || 'N/A'}"`,
          `"${item.phoneNumber || 'N/A'}"`,
          `"${formattedDate}"`,
          `"${timeStr}"`,
          item.status
        ].join(",");
        csvContent += row + "\n";
      });

      const fileUri = FileSystem.documentDirectory + "Store_Records.csv";
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
    } catch (e) {
      console.error(e);
      Alert.alert("Export Error", "Failed to export CSV.");
    } finally {
      setExporting(false);
    }
  };

  const pickAndUploadDocument = async (historyId) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      setUploadingId(historyId);
      
      const formData = new FormData();
      const uriParts = file.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('document', {
        uri: file.uri,
        name: `document_${historyId}.${fileType}`,
        type: file.mimeType || `application/${fileType}`
      });

      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_BASE_URL}/api/store/history/${historyId}/document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      Alert.alert('Success', 'Document uploaded successfully!');
      fetchRecords(); // Refresh list to show attached status
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', 'Could not upload the document.');
    } finally {
      setUploadingId(null);
    }
  };

  const renderRecordItem = ({ item, index }) => (
    <View className="flex-row items-center border-b border-slate-100 py-4 px-2">
      <Text className="w-10 text-slate-500 font-bold text-xs">{index + 1}</Text>
      <View className="flex-1 pr-2">
        <Text className="text-slate-800 font-bold text-sm" numberOfLines={1}>{item.name}</Text>
        <Text className="text-slate-400 text-[10px] font-medium mt-0.5">{item.phoneNumber}</Text>
      </View>
      <View className="flex-1 pr-2">
        <Text className="text-slate-700 font-bold text-xs">
           {item.slot ? format(new Date(item.slot.date), 'MMM dd') : format(new Date(item.bookingTime), 'MMM dd')}
        </Text>
        <Text className="text-slate-400 text-[9px] font-black uppercase mt-0.5" numberOfLines={1}>
           {item.slot ? `${item.slot.startTime}-${item.slot.endTime}` : 'No Slot'}
        </Text>
      </View>
      <View className="flex-row items-center w-24 justify-end">
        {item.documents && item.documents.length > 0 ? (
          <View className="bg-emerald-100 p-1.5 rounded-lg mr-2">
            <MaterialCommunityIcons name="file-check" size={14} color="#059669" />
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => pickAndUploadDocument(item._id)} 
            disabled={uploadingId === item._id}
            className="bg-blue-50 p-1.5 rounded-lg mr-2"
          >
            {uploadingId === item._id ? <ActivityIndicator size="small" color="#2563eb" /> : <MaterialCommunityIcons name="upload" size={14} color="#2563eb" />}
          </TouchableOpacity>
        )}
        <View className={`px-2 py-1.5 rounded-lg ${item.status === 'Completed' ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <Text className={`text-[9px] font-black uppercase tracking-widest ${item.status === 'Completed' ? 'text-emerald-600' : 'text-red-600'}`}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1">
        {isOffline && (
          <Animatable.View animation="slideInDown" className="bg-red-500 py-1.5 items-center flex-row justify-center z-50">
            <MaterialCommunityIcons name="wifi-off" size={14} color="white" />
            <Text className="text-white font-black text-[9px] uppercase tracking-widest ml-2">Offline Mode - Syncing may fail</Text>
          </Animatable.View>
        )}
        {/* Header */}
        <View className="px-5 pt-6 pb-4 bg-slate-50 rounded-b-[40px] shadow-sm mb-4">
            <View className="flex-row items-center mb-6">
               <TouchableOpacity 
                 onPress={() => navigation.goBack()}
                 className="w-10 h-10 bg-white items-center justify-center rounded-xl shadow-sm border border-slate-100 mr-4"
               >
                 <MaterialCommunityIcons name="chevron-left" size={24} color="#1e293b" />
               </TouchableOpacity>
               <View className="flex-1">
                 <Text className="text-2xl font-black text-slate-900">Store Records</Text>
                 <Text className="text-blue-500 font-bold text-[10px] uppercase tracking-[2px]">Export tracking easily</Text>
               </View>
               <View className="flex-row">
                 <TouchableOpacity onPress={exportCSV} disabled={exporting} className="w-10 h-10 bg-emerald-100 items-center justify-center rounded-xl mr-2">
                   <MaterialCommunityIcons name="microsoft-excel" size={20} color="#059669" />
                 </TouchableOpacity>
                 <TouchableOpacity onPress={exportPDF} disabled={exporting} className="w-10 h-10 bg-red-100 items-center justify-center rounded-xl">
                   <MaterialCommunityIcons name="file-pdf-box" size={20} color="#dc2626" />
                 </TouchableOpacity>
               </View>
            </View>

            <View>
               <Text className="text-slate-400 font-bold text-xs uppercase ml-1 mb-2">Filter By Date</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {availableDates.map((date) => (
                    <TouchableOpacity 
                      key={date}
                      onPress={() => setSelectedDate(date)}
                      className={`px-5 py-2.5 rounded-xl mr-3 ${selectedDate === date ? 'bg-blue-600' : 'bg-white border border-slate-200'}`}
                    >
                      <Text className={`font-black text-[10px] uppercase tracking-widest ${selectedDate === date ? 'text-white' : 'text-slate-500'}`}>
                        {date}
                      </Text>
                    </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>
        </View>

        {/* Table View */}
        <View className="flex-1 px-4">
            <View className="flex-row bg-slate-100 py-3 px-2 rounded-t-2xl mt-2 border border-slate-200">
               <Text className="w-10 text-slate-500 font-bold text-[10px] uppercase tracking-widest">S.No</Text>
               <Text className="flex-1 text-slate-500 font-bold text-[10px] uppercase tracking-widest">User Details</Text>
               <Text className="flex-1 text-slate-500 font-bold text-[10px] uppercase tracking-widest">Time Slot</Text>
               <Text className="w-20 text-center text-slate-500 font-bold text-[10px] uppercase tracking-widest">Status</Text>
            </View>

            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching records...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredRecords}
                keyExtractor={(item) => item._id}
                renderItem={renderRecordItem}
                contentContainerStyle={{ paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                  <View className="items-center justify-center mt-20">
                     <MaterialCommunityIcons name="file-document-outline" size={60} color="#cbd5e1" />
                     <Text className="text-slate-500 text-lg font-black mt-4">No Records Found</Text>
                     <Text className="text-slate-400 font-medium text-xs mt-1">Select a different date filter.</Text>
                  </View>
                }
              />
            )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default StoreRecords;
