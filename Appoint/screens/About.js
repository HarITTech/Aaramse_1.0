import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import logo from '../assets/logo.png';
import { useTheme } from '../middleware/ThemeContext';
import { useAuth } from '../middleware/AuthContext';
import CustomAlert from '../components/CustomAlert';

const AboutUs = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isGuest, logout } = useAuth();
  const isDark = theme === 'dark';

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null, cancelText: null });

  const showCustomAlert = (title, message, type = "info", onConfirm = null, cancelText = null) => {
    setAlertConfig({ title, message, type, onConfirm, cancelText });
    setAlertVisible(true);
  };

  const handleBecomePartner = () => {
    if (isGuest) {
      showCustomAlert(
        "लॉगिन आवश्यक",
        "व्यवसाय नोंदणी करण्यासाठी कृपया लॉगिन करा किंवा नवीन खाते तयार करा.",
        "warning",
        async () => {
          setAlertVisible(false);
          await logout();
        },
        "Cancel"
      );
      return;
    }
    navigation.navigate("CreateStore");
  };

  const MissionPoint = ({ icon, title, text, delay }) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={delay} 
      className={`rounded-[32px] p-6 mb-5 border ${
        isDark ? 'bg-slate-900 border-slate-800/80 shadow-none' : 'bg-white border-slate-100/70 shadow-sm shadow-slate-100/50'
      }`}
    >
      <View className="flex-row items-center mb-3">
        <View className={`p-3 rounded-2xl mr-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <MaterialCommunityIcons name={icon} size={24} color="#3b82f6" />
        </View>
        <Text className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{title}</Text>
      </View>
      <Text className={`leading-6 font-semibold text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{text}</Text>
    </Animatable.View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Hero */}
        <View className="h-72 overflow-hidden relative">
          <LinearGradient
            colors={isDark ? ['#0f172a', '#020617'] : ['#1e3a8a', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: 50, left: 24, zIndex: 10 }}
            className={`w-10 h-10 items-center justify-center rounded-xl border backdrop-blur-md ${
              isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white/20 border-white/30'
            }`}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <SafeAreaView className="flex-1 items-center justify-center p-6 mt-6">
            <Animatable.View 
              animation="zoomIn"
              className={`p-3 rounded-[32px] border mb-4 shadow-xl backdrop-blur-md ${
                isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white/15 border-white/25'
              }`}
            >
               <Image source={logo} style={{ width: 70, height: 70 }} resizeMode="contain" />
            </Animatable.View>
            <Text className="text-white text-3xl font-black mb-1.5 tracking-tight">About आरामSe</Text>
            <View className="h-1 w-12 bg-emerald-400 rounded-full" />
          </SafeAreaView>
        </View>

        <View className="px-6 -mt-10 mb-10">
          <Animatable.View 
            animation="fadeInUp" 
            delay={200} 
            className={`rounded-[32px] p-6 shadow-xl shadow-slate-200/45 mb-6 border ${
              isDark ? 'bg-slate-900 shadow-none border-slate-800' : 'bg-white border-slate-100'
            }`}
          >
            <Text className={`text-xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>Our Vision</Text>
            <Text className={`text-xs leading-6 font-semibold ${isDark ? 'text-slate-350' : 'text-slate-500'}`}>
              At आरामSe, we believe your time is your most valuable asset. Our mission is to end the exhausting hours wasted standing in queues. By bridging local services and customers through our real-time queue platform, we make appointments seamless, comfortable, and stress-free.
            </Text>
          </Animatable.View>

          <MissionPoint 
            delay={350}
            icon="clock-check-outline"
            title="Real-Time Queue Tracking"
            text="Calculate your arrival perfectly by monitoring your live position in the queue, reducing unnecessary waiting room crowds."
          />
          <MissionPoint 
            delay={500}
            icon="storefront-outline"
            title="Empowering Local Business"
            text="Providing local shops, healthcare providers, and services with digital tools to streamline customer flow."
          />
          <MissionPoint 
            delay={650}
            icon="shield-check-outline"
            title="Guaranteed Slots"
            text="Book slots with absolute certainty. Enjoy secure scheduling without overlapping or double-bookings."
          />

          <TouchableOpacity 
            onPress={handleBecomePartner}
            className="mt-6 overflow-hidden rounded-[24px] shadow-lg shadow-blue-500/20"
          >
            <LinearGradient
              colors={['#1e40af', '#3b82f6']}
              className="py-4.5 px-6 flex-row items-center justify-center"
            >
              <Text className="text-white font-black text-sm mr-3 tracking-widest">BECOME A PARTNER</Text>
              <MaterialCommunityIcons name="rocket-launch-outline" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* App Credits & Metadata */}
          <Animatable.View 
            animation="fadeIn" 
            delay={800}
            className="mt-12 items-center justify-center border-t pt-8 border-slate-200/50 dark:border-slate-800/60"
          >
            <Text className={`font-black text-xs uppercase tracking-[3px] mb-1.5 ${isDark ? 'text-slate-550' : 'text-slate-400'}`}>आरामSe Platform</Text>
            <Text className={`font-bold text-[10px] mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>App Version 1.2.0</Text>
            <Text className={`font-medium text-[10px] text-center leading-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Developed & Managed by
            </Text>
            <Text className="font-black text-xs text-blue-500 mt-1 uppercase tracking-[1px]">
              HarIT Tech Solution
            </Text>
            <Text className={`font-medium text-[9px] mt-6 ${isDark ? 'text-slate-650' : 'text-slate-400'}`}>
              © 2026 HarIT Tech Solution. All rights reserved.
            </Text>
          </Animatable.View>
        </View>
      </ScrollView>

      <CustomAlert 
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        cancelText={alertConfig.cancelText}
      />
    </View>
  );
};

export default AboutUs;
