// Sidebar.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

const Sidebar = ({ navigation, onLogout }) => {
  return (
    <View className="flex-1 bg-white shadow-md">
      <View className="p-6 border-b border-gray-100 bg-blue-50/50">
        <Text className="text-xl font-black text-blue-900">आराम<Text className="text-emerald-500">Se</Text></Text>
        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Main Navigation</Text>
      </View>
      
      <View className="p-2">
        <TouchableOpacity 
          onPress={() => navigation.navigate('Dashboard')} 
          className="flex-row items-center p-4 rounded-2xl hover:bg-blue-50"
        >
          <Icon name="view-dashboard-outline" size={24} color="#3b82f6" />
          <Text className="ml-4 font-bold text-slate-700">Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')} 
          className="flex-row items-center p-4 rounded-2xl"
        >
          <Icon name="account-outline" size={24} color="#3b82f6" />
          <Text className="ml-4 font-bold text-slate-700">Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('History')} 
          className="flex-row items-center p-4 rounded-2xl"
        >
          <Icon name="history" size={24} color="#3b82f6" />
          <Text className="ml-4 font-bold text-slate-700">Booking History</Text>
        </TouchableOpacity>

        <View className="h-[1px] bg-gray-100 my-4 mx-4" />

        <TouchableOpacity 
          onPress={onLogout} 
          className="flex-row items-center p-4 rounded-2xl"
        >
          <Icon name="logout" size={24} color="#ef4444" />
          <Text className="ml-4 font-bold text-red-600">Logout</Text>
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-6 left-6 right-6">
        <View className="h-[1px] bg-slate-50 w-full mb-4" />
        <Text className="text-slate-400 text-[9px] font-black uppercase tracking-[3px]">Official App</Text>
        <Text className="text-slate-800 font-black text-sm mt-1">आराम<Text className="text-emerald-500">Se</Text> Digital</Text>
        <Text className="text-blue-500 font-bold text-[8px] mt-0.5 italic">झटपट बुकिंग • आरामात रहा</Text>
      </View>
    </View>
  );
};

export default Sidebar;
