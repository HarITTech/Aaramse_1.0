import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../middleware/AuthContext';
import { API_BASE_URL } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import logo from '../assets/logo.png';
import haritLogo from '../assets/harit_logo.png';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
      Alert.alert('Required', 'Please enter both email and password');
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      await login(response.data.token);
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Decor */}
      <View className="absolute inset-0">
        <LinearGradient colors={['#020617', '#1e1b4b']} className="flex-1" />
        <View className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl opacity-50" />
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, padding: 32, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            <Animatable.View animation="fadeInDown" duration={1000} className="items-center mb-8">
              <View className="bg-white p-3 rounded-[28px] mb-4 shadow-xl shadow-blue-500/15 border border-slate-100">
                <Image source={logo} style={{ width: 64, height: 64 }} resizeMode="contain" />
              </View>
              <Text className="text-3xl font-black text-white mb-1">नमस्ते!</Text>
              <Text className="text-blue-400 text-xs font-medium text-center">Login to your AaramSe Account</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={200} duration={1000}>
              {/* Input Fields */}
              <View className="mb-4">
                <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-[1px] mb-2 ml-1">Email Address</Text>
                <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl p-3">
                  <MaterialCommunityIcons name="email-outline" size={16} color="#60a5fa" />
                  <TextInput
                    className="flex-1 text-white font-semibold ml-2 text-xs"
                    placeholder="Email"
                    placeholderTextColor="#475569"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-[1px] mb-2 ml-1">Password</Text>
                <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl p-3">
                  <MaterialCommunityIcons name="lock-outline" size={16} color="#60a5fa" />
                  <TextInput
                    className="flex-1 text-white font-semibold ml-2 text-xs"
                    placeholder="Password"
                    placeholderTextColor="#475569"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                onPress={handleLogin}
                disabled={loading}
                className="rounded-xl overflow-hidden shadow-lg shadow-blue-500/20"
                activeOpacity={0.8}
              >
                <LinearGradient
                   colors={['#2563eb', '#3b82f6']}
                   className="py-3 items-center justify-center flex-row"
                 >
                   {loading ? (
                     <ActivityIndicator size="small" color="#fff" />
                   ) : (
                     <>
                       <Text className="text-white font-black text-xs tracking-widest mr-2">LOGIN</Text>
                       <MaterialCommunityIcons name="login" size={16} color="#fff" />
                     </>
                   )}
                 </LinearGradient>
              </TouchableOpacity>

              {/* Alternative Actions */}
              <View className="mt-8 items-center">
                <View className="flex-row items-center mb-4">
                   <View className="h-[1px] w-8 bg-white/10" />
                   <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                      <Text className="text-blue-400 mx-3 font-bold text-[10px] uppercase tracking-widest">New? Create Account</Text>
                   </TouchableOpacity>
                   <View className="h-[1px] w-8 bg-white/10" />
                </View>

                {/* Compact Branding */}
                <View className="mt-6 items-center flex-row justify-center py-2 px-4 bg-white/5 rounded-xl border border-white/5">
                   <Image source={haritLogo} style={{ width: 14, height: 14 }} className="mr-2 rounded-sm" />
                   <Text className="text-white/40 text-[8px] font-black tracking-widest uppercase">HarIT Tech Solution</Text>
                </View>
              </View>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;
