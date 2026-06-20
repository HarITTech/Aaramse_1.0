import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  StatusBar,
  Linking,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import logo from '../assets/logo.png';
import haritLogo from '../assets/harit_logo.png';
import backgroundImage from '../assets/background_concept.png';
import { useAuth } from '../middleware/AuthContext';
import { useTheme } from '../middleware/ThemeContext';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { loginAsGuest } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <ImageBackground 
      source={backgroundImage} 
      className="flex-1"
      resizeMode="cover"
    >
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        translucent 
        backgroundColor="transparent" 
      />
      
      {/* Dynamic Overlay Gradient based on active theme */}
      <LinearGradient
        colors={
          isDark 
            ? ['rgba(10, 15, 29, 0.9)', 'rgba(23, 37, 84, 0.65)', 'rgba(3, 7, 18, 0.98)']
            : ['rgba(255, 255, 255, 0.85)', 'rgba(239, 246, 255, 0.9)', 'rgba(219, 234, 254, 0.95)']
        }
        className="flex-1"
      >
        <SafeAreaView className="flex-1 justify-between px-8 py-8">
          
          {/* Top Header Label */}
          <Animatable.View animation="fadeInDown" duration={800} className="items-center mt-2">
            <View className={isDark ? "bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20" : "bg-blue-500/5 px-4 py-1.5 rounded-full border border-blue-500/15"}>
              <Text className="text-blue-500 text-[9px] font-black uppercase tracking-[2.5px]">Premium Booking Solution</Text>
            </View>
          </Animatable.View>

          {/* Center Content: Brand Logo, Title & Core Slogan */}
          <View className="items-center justify-center">
            
            {/* Logo Showcase (Glassmorphic Outer Frame) */}
            <Animatable.View 
              animation="zoomIn" 
              duration={1000} 
              className={`p-5 rounded-[36px] mb-6 shadow-2xl items-center justify-center border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-blue-100 shadow-blue-900/5'
              }`}
              style={{
                shadowColor: isDark ? '#3b82f6' : '#1e3a8a',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: isDark ? 0.2 : 0.1,
                shadowRadius: 24,
                elevation: 10
              }}
            >
              <Image 
                source={logo} 
                style={{ width: 90, height: 90, borderRadius: 22 }} 
                resizeMode="contain" 
              />
            </Animatable.View>

            {/* Brand Title */}
            <Animatable.View 
              animation="fadeInUp" 
              duration={800} 
              delay={200}
              className="items-center w-full"
            >
              <View className="flex-row items-center justify-center mb-3">
                <Text className={`text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-blue-950'}`}>आराम</Text>
                <Text className="text-blue-500 text-5xl font-black tracking-tight">Se</Text>
              </View>

              {/* Slogan */}
              <Text className={`text-sm font-black text-center tracking-wide mb-2 ${isDark ? 'text-slate-200' : 'text-blue-900/80'}`}>
                वेळेची बचत, सोपे बुकिंग।
              </Text>
              <Text className={`text-[11px] font-semibold text-center leading-5 px-6 ${isDark ? 'text-slate-400/80' : 'text-slate-600'}`}>
                डिजिटल रांग आणि स्मार्ट अपॉइंटमेंट व्यवस्थापन.{"\n"}रांगेत उभे राहण्याचे दिवस संपले!
              </Text>

              {/* Minimalist Micro-Feature Pills */}
              <View className="flex-row items-center justify-center mt-5">
                <View className={`flex-row items-center border px-3 py-1 rounded-full mx-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-blue-50 border-blue-100/40'}`}>
                  <MaterialCommunityIcons name="clock-fast" size={10} color="#3b82f6" />
                  <Text className={`text-[8px] font-black ml-1 uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-blue-900/70'}`}>झटपट बुकिंग</Text>
                </View>
                <View className={`flex-row items-center border px-3 py-1 rounded-full mx-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-blue-50 border-blue-100/40'}`}>
                  <MaterialCommunityIcons name="map-marker-radius" size={10} color="#10b981" />
                  <Text className={`text-[8px] font-black ml-1 uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-blue-900/70'}`}>ाईव्ह ट्रॅक</Text>
                </View>
                <View className={`flex-row items-center border px-3 py-1 rounded-full mx-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-blue-50 border-blue-100/40'}`}>
                  <MaterialCommunityIcons name="shield-check" size={10} color="#818cf8" />
                  <Text className={`text-[8px] font-black ml-1 uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-blue-900/70'}`}>सुरक्षित</Text>
                </View>
              </View>

            </Animatable.View>
          </View>

          {/* Bottom Actions & Tech Partner Credits */}
          <View className="w-full">
            
            {/* Action Buttons Container */}
            <Animatable.View animation="fadeInUp" duration={800} delay={400} className="mb-8">
              {/* Primary GET STARTED Button */}
              <TouchableOpacity 
                className="rounded-2xl overflow-hidden shadow-lg shadow-blue-500/25"
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#2563eb', '#1d4ed8']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  className="py-4 flex-row items-center justify-center"
                >
                  <Text className="text-white font-black text-xs tracking-widest uppercase mr-2">सुरुवात करूया / GET STARTED</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Guest Exploration Option */}
              <TouchableOpacity 
                onPress={async () => {
                  await loginAsGuest();
                }}
                className="mt-4 py-2 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-blue-500 font-black text-xs uppercase tracking-widest">अतिथी म्हणून सुरू ठेवा / Continue as Guest</Text>
              </TouchableOpacity>
            </Animatable.View>

            {/* Minimalist Footer Credits */}
            <Animatable.View animation="fadeInUp" duration={800} delay={600} className="items-center">
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://harittech.vercel.app/')}
                className={`flex-row items-center border py-1.5 px-4 rounded-xl ${
                  isDark ? 'bg-white/5 border-white/5 opacity-40 hover:opacity-100' : 'bg-blue-50 border-blue-100/30'
                }`}
              >
                <Image source={haritLogo} style={{ width: 10, height: 10 }} className="rounded-sm mr-2" />
                <Text className={`text-[8px] font-bold tracking-[1.5px] uppercase ${isDark ? 'text-white' : 'text-blue-900/60'}`}>harittech.app</Text>
              </TouchableOpacity>
              <Text className={`text-[6px] font-bold uppercase tracking-[2px] mt-1.5 ${isDark ? 'text-white/10' : 'text-slate-400/50'}`}>AaramSe © 2026</Text>
            </Animatable.View>
          </View>

        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
};

export default HomeScreen;
