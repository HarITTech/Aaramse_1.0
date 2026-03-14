import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import logo from '../assets/logo.png';

const AboutUs = () => {
  const navigation = useNavigation();
  const MissionPoint = ({ icon, title, text, delay }) => (
    <Animatable.View animation="fadeInUp" delay={delay} className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-slate-50">
      <View className="flex-row items-center mb-3">
        <View className="bg-blue-50 p-3 rounded-2xl mr-4">
          <MaterialCommunityIcons name={icon} size={24} color="#3b82f6" />
        </View>
        <Text className="text-xl font-black text-slate-800">{title}</Text>
      </View>
      <Text className="text-slate-500 leading-6 font-medium">{text}</Text>
    </Animatable.View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Hero */}
        <View className="h-64 overflow-hidden relative">
          <LinearGradient
            colors={['#1e3a8a', '#3b82f6']}
            className="absolute inset-0"
          />
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: 50, left: 24, zIndex: 10 }}
            className="w-10 h-10 bg-white/20 items-center justify-center rounded-xl border border-white/30 backdrop-blur-md"
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <SafeAreaView className="flex-1 items-center justify-center p-6">
            <Animatable.View animation="zoomIn" className="bg-white/10 p-4 rounded-3xl border border-white/20 mb-4 backdrop-blur-md">
               <Image source={logo} style={{ width: 60, height: 60 }} resizeMode="contain" />
            </Animatable.View>
            <Text className="text-white text-3xl font-black mb-2">About আরামSe</Text>
            <View className="h-1 w-16 bg-emerald-400 rounded-full" />
          </SafeAreaView>
        </View>

        <View className="px-6 -mt-10 mb-10">
          <Animatable.View animation="fadeInUp" delay={200} className="bg-white rounded-3xl p-6 shadow-xl mb-8">
            <Text className="text-2xl font-black text-slate-800 mb-4">Our Vision</Text>
            <Text className="text-slate-500 text-lg leading-7 font-medium">
              We're here to reclaim your time. AaramSe is more than just a booking app; it's a movement to end the era of standing in lines.
            </Text>
          </Animatable.View>

          <MissionPoint 
            delay={400}
            icon="clock-check-outline"
            title="Time Efficiency"
            text="Calculate your arrival perfectly with our real-time queue tracking system."
          />
          <MissionPoint 
            delay={600}
            icon="store-outline"
            title="Local Support"
            text="Empowering local store owners with digital management tools."
          />
          <MissionPoint 
            delay={800}
            icon="shield-check-outline"
            title="Secure Booking"
            text="Your spot is guaranteed. No double bookings, no confusion."
          />

          <TouchableOpacity className="mt-8 overflow-hidden rounded-2xl shadow-lg shadow-blue-500/30">
            <LinearGradient
              colors={['#1e40af', '#3b82f6']}
              className="py-4 px-6 flex-row items-center justify-center"
            >
              <Text className="text-white font-black text-base mr-3">BECOME A PARTNER</Text>
              <MaterialCommunityIcons name="rocket-launch" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default AboutUs;
