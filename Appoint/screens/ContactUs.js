import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from '../middleware/ThemeContext';

const ContactUs = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!name || !email || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    // Simulate sending message
    setTimeout(() => {
      Alert.alert('Success', 'Your message has been sent!');
      setName('');
      setEmail('');
      setMessage('');
      setLoading(false);
    }, 1500);
  };

  const ContactInfo = ({ icon, title, value, delay }) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={delay} 
      className={`rounded-3xl p-6 mb-4 border ${
        isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-50 shadow-sm'
      }`}
    >
      <View className="flex-row items-center">
        <View className={`p-3 rounded-2xl mr-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <MaterialCommunityIcons name={icon} size={24} color="#3b82f6" />
        </View>
        <View className="flex-1">
          <Text className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>{title}</Text>
          <Text className={`text-base font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{value}</Text>
        </View>
      </View>
    </Animatable.View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <StatusBar barStyle="light-content" translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Hero */}
        <View className="h-56 overflow-hidden relative">
          <LinearGradient
            colors={isDark ? ['#0a0f1d', '#020617'] : ['#1e3a8a', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 justify-end p-8 pb-12"
          >
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ position: 'absolute', top: 50, left: 24, zIndex: 10 }}
              className={`w-10 h-10 items-center justify-center rounded-xl border backdrop-blur-md ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white/20 border-white/30'
              }`}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Animatable.View animation="fadeInUp" delay={100} className="mt-8">
              <Text className="text-4xl font-black text-white mb-2">Contact Us</Text>
              <Text className="text-white/80 text-base font-medium">Get in touch with our support team</Text>
            </Animatable.View>
          </LinearGradient>
        </View>

        {/* Content */}
        <View className="px-6 pt-8 pb-8">
          {/* Contact Information */}
          <Animatable.View animation="fadeInUp" delay={200}>
            <Text className={`text-2xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>Reach Out</Text>
          </Animatable.View>

          <ContactInfo 
            icon="email-outline" 
            title="Email" 
            value="support@aaramse.com" 
            delay={300}
          />

          <ContactInfo 
            icon="phone-outline" 
            title="Phone" 
            value="+91 XXXXX XXXXX" 
            delay={400}
          />

          <ContactInfo 
            icon="map-marker-outline" 
            title="Address" 
            value="Bangalore, India" 
            delay={500}
          />

          {/* Contact Form */}
          <Animatable.View animation="fadeInUp" delay={600} className="mt-8">
            <Text className={`text-2xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>Send us a Message</Text>
            
            <View className={`rounded-3xl p-6 border mb-6 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-50 shadow-sm'
            }`}>
              <TextInput
                placeholder="Your Name"
                value={name}
                onChangeText={setName}
                className={`border rounded-2xl p-4 mb-4 font-medium ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
                placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
              />
              
              <TextInput
                placeholder="Your Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                className={`border rounded-2xl p-4 mb-4 font-medium ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
                placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
              />
              
              <TextInput
                placeholder="Your Message"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                className={`border rounded-2xl p-4 font-medium ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
                placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="bg-blue-600 rounded-2xl p-4 mb-8"
            >
              <Text className="text-white text-center font-black text-lg">
                {loading ? 'Sending...' : 'Send Message'}
              </Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Social Links */}
          <Animatable.View animation="fadeInUp" delay={700} className="items-center py-6">
            <Text className={`font-medium mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Follow Us</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity className={`rounded-full p-3 shadow-sm ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                <MaterialCommunityIcons name="facebook" size={24} color={isDark ? "#fff" : "#1f2937"} />
              </TouchableOpacity>
              <TouchableOpacity className={`rounded-full p-3 shadow-sm ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                <MaterialCommunityIcons name="twitter" size={24} color={isDark ? "#fff" : "#1f2937"} />
              </TouchableOpacity>
              <TouchableOpacity className={`rounded-full p-3 shadow-sm ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                <MaterialCommunityIcons name="instagram" size={24} color={isDark ? "#fff" : "#1f2937"} />
              </TouchableOpacity>
              <TouchableOpacity className={`rounded-full p-3 shadow-sm ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                <MaterialCommunityIcons name="linkedin" size={24} color={isDark ? "#fff" : "#1f2937"} />
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ContactUs;
