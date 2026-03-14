import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  StatusBar,
  ScrollView,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import logo from '../assets/logo.png';
import haritLogo from '../assets/harit_logo.png';

const { width } = Dimensions.get('window');

const TypingQuote = () => {
  const quotes = [
    "वेळेची बचत, आरामात बुकिंग।",
    "रांगेत उभे राहण्याचे दिवस संपले!",
    "Life is short, don't spend it in a queue.",
    "आता सर्व काही डिजिटल, सर्व काही सोपे।",
    "Smart Booking for a Smart Lifestyle."
  ];
  
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(100);

  useEffect(() => {
    const handleTyping = () => {
      const fullText = quotes[currentQuoteIndex];
      
      if (!isDeleting) {
        setDisplayedText(fullText.substring(0, displayedText.length + 1));
        setSpeed(100);
        
        if (displayedText === fullText) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayedText(fullText.substring(0, displayedText.length - 1));
        setSpeed(50);
        
        if (displayedText === '') {
          setIsDeleting(false);
          setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, speed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentQuoteIndex]);

  return (
    <View className="h-10 justify-center items-center">
      <Text className="text-blue-300 text-sm font-medium text-center">
        {displayedText}<Text className="text-white">|</Text>
      </Text>
    </View>
  );
};

const FeatureItem = ({ icon, text, title, delay }) => (
  <Animatable.View 
    animation="fadeInUp" 
    delay={delay} 
    className="w-[48%] bg-white/10 p-5 rounded-[32px] border border-white/20 mb-4 backdrop-blur-md"
  >
    <View className="bg-blue-500/20 w-12 h-12 rounded-2xl items-center justify-center mb-4">
      <MaterialCommunityIcons name={icon} size={28} color="#60a5fa" />
    </View>
    <Text className="text-white font-black text-sm mb-1">{title}</Text>
    <Text className="text-blue-100/60 text-[10px] leading-4 font-medium">{text}</Text>
  </Animatable.View>
);

const HomeScreen = () => {
  const navigation = useNavigation();
  
  return (
    <View className="flex-1 bg-[#020617]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Decor */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={['#0f172a', '#1e1b4b', '#020617']}
          className="flex-1"
        />
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          className="absolute -top-40 -left-20 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]" 
        />
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite" 
          delay={1000}
          className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" 
        />
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="px-6"
        >
          {/* Header Branding */}
          <Animatable.View animation="fadeInDown" className="flex-row justify-between items-center py-4 mb-4">
            <View className="flex-row items-center flex-1">
              <View className="bg-white/10 p-2.5 rounded-2xl border border-white/10 mr-4">
                 <Image source={logo} style={{ width: 40, height: 40 }} resizeMode="contain" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-black text-2xl tracking-tighter" numberOfLines={1}>
                  आराम<Text className="text-blue-400">Se</Text>
                </Text>
                <Text className="text-blue-400/60 text-[9px] font-bold uppercase tracking-[2px]">Premium Booking Solution</Text>
              </View>
            </View>
          </Animatable.View>

          {/* Hero Section */}
          <Animatable.View animation="fadeInUp" delay={200} className="mb-6 mt-4 items-center">
            <View className="bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 mb-6">
              <Text className="text-blue-400 text-[10px] font-black uppercase tracking-[3px]">Made in Maharashtra</Text>
            </View>
            <Text className="text-white text-5xl font-black text-center leading-[60px]" numberOfLines={2}>
              आपला वेळ{"\n"}वाचवा <Text className="text-blue-400">आरामSe</Text>
            </Text>
            <View className="mt-6">
               <TypingQuote />
            </View>
          </Animatable.View>

          {/* Feature Card - Minimalist */}
          <Animatable.View 
            animation="zoomIn" 
            delay={400} 
            className="w-full h-28 rounded-[24px] overflow-hidden mb-4 shadow-lg shadow-blue-500/10"
          >
            <LinearGradient
              colors={['#1e40af', '#3b82f6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              className="flex-1 p-4 justify-center"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-white text-base font-black mb-0.5">Digital Queue</Text>
                  <Text className="text-blue-100 text-[9px] font-medium leading-3">No more physical lines. Book instantly from your home comfort.</Text>
                </View>
                <View className="bg-white/20 p-2 rounded-xl">
                   <MaterialCommunityIcons name="lightning-bolt" size={24} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </Animatable.View>

          {/* Action Button */}
          <Animatable.View animation="fadeInUp" delay={600} className="mt-2">
            <TouchableOpacity 
              className="rounded-2xl overflow-hidden shadow-xl shadow-blue-500/30"
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="py-3 px-8 flex-row items-center justify-center"
              >
                <Text className="text-white font-black text-sm mr-2 tracking-widest">सुरुवात करूया</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          {/* Quick Stats Grid */}
          <View className="flex-row justify-between mt-6 px-1">
            <View className="items-center w-[30%]">
              <MaterialCommunityIcons name="clock-fast" size={18} color="#60a5fa" />
              <Text className="text-white/40 text-[7px] mt-1 font-bold uppercase tracking-widest">Instant</Text>
            </View>
            <View className="items-center w-[30%]">
              <MaterialCommunityIcons name="shield-check" size={18} color="#10b981" />
              <Text className="text-white/40 text-[7px] mt-1 font-bold uppercase tracking-widest">Secure</Text>
            </View>
            <View className="items-center w-[30%]">
              <MaterialCommunityIcons name="heart-pulse" size={18} color="#f43f5e" />
              <Text className="text-white/40 text-[7px] mt-1 font-bold uppercase tracking-widest">Smart</Text>
            </View>
          </View>

          {/* Professional HarIT Branding - Compact Footer */}
          <Animatable.View 
            animation="fadeInUp" 
            delay={800} 
            className="mt-auto pt-4 items-center"
          >
            <View className="bg-white/5 w-full py-3 rounded-2xl border border-white/5 items-center">
               <View className="flex-row items-center mb-1.5 px-4 h-6">
                  <Image source={haritLogo} style={{ width: 16, height: 16 }} resizeMode="contain" className="rounded-sm mr-2" />
                  <Text className="text-white/60 font-black text-[9px] tracking-[2px] uppercase">HarIT Tech Solution</Text>
               </View>
               <TouchableOpacity 
                 onPress={() => Linking.openURL('https://harittech.vercel.app/')}
                 className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20"
               >
                 <Text className="text-blue-400 text-[7px] font-bold">harittech.app</Text>
               </TouchableOpacity>
            </View>
            <Text className="text-white/10 text-[6px] font-black uppercase tracking-[3px] mt-3">AaramSe © 2026</Text>
          </Animatable.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;
