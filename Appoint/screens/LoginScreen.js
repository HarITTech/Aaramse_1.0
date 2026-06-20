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
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../middleware/AuthContext';
import { useTheme } from '../middleware/ThemeContext';
import { API_BASE_URL } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import logo from '../assets/logo.png';
import haritLogo from '../assets/harit_logo.png';
import backgroundImage from '../assets/background_concept.png';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const isDark = theme === 'dark';

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!email || !password) {
      Alert.alert('Required', 'Please enter email/mobile and password');
      return;
    }

    const isEmail = emailRegex.test(email);
    const isPhone = phoneRegex.test(email);

    if (!isEmail && !isPhone) {
      Alert.alert('Error', 'Please enter a valid email address or 10-digit mobile number');
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
      
      {/* Radial Vignette Overlay for focus & legibility */}
      <LinearGradient 
        colors={
          isDark 
            ? ['rgba(10, 15, 29, 0.9)', 'rgba(23, 37, 84, 0.7)', 'rgba(3, 7, 18, 0.98)']
            : ['rgba(255, 255, 255, 0.85)', 'rgba(239, 246, 255, 0.9)', 'rgba(219, 234, 254, 0.95)']
        } 
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1, padding: 32, justifyContent: 'center' }}
              showsVerticalScrollIndicator={false}
            >
              {/* Logo & Subtitle Section */}
              <Animatable.View animation="fadeInDown" duration={1000} className="items-center mb-8">
                <View 
                  className={`p-4 rounded-[32px] mb-4 backdrop-blur-md ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-blue-100'}`}
                  style={{
                    shadowColor: isDark ? '#3b82f6' : '#1e3a8a',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDark ? 0.15 : 0.08,
                    shadowRadius: 16,
                    elevation: 5
                  }}
                >
                  <Image source={logo} style={{ width: 64, height: 64, borderRadius: 16 }} resizeMode="contain" />
                </View>
                
                {/* Brand Title (Fixed Android wrapping bug) */}
                <Text 
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  className={`text-3xl font-black tracking-tight text-center w-full px-2 ${isDark ? 'text-white' : 'text-blue-950'}`}
                >
                  नमस्ते आराम<Text className="text-blue-500">Se</Text>
                </Text>
                <Text className={`text-xs font-semibold text-center mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>लॉगिन करा / Sign in to continue</Text>
              </Animatable.View>

              {/* Form Input Fields */}
              <Animatable.View animation="fadeInUp" delay={200} duration={1000}>
                
                {/* Email / Mobile Field */}
                <View className="mb-4">
                  <Text className={`text-[9px] font-black uppercase tracking-[1.5px] mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-blue-900/60'}`}>Email or Mobile Number</Text>
                  <View className={`flex-row items-center rounded-2xl px-4 h-12 border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <MaterialCommunityIcons name="email-outline" size={16} color="#3b82f6" />
                    <TextInput
                      className={`flex-1 font-semibold ml-2.5 text-xs h-full ${isDark ? 'text-white' : 'text-slate-800'}`}
                      placeholder="Email or 10-digit Mobile Number"
                      placeholderTextColor={isDark ? "#475569" : "#cbd5e1"}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={{ paddingVertical: 0 }}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View className="mb-6">
                  <Text className={`text-[9px] font-black uppercase tracking-[1.5px] mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-blue-900/60'}`}>Password</Text>
                  <View className={`flex-row items-center rounded-2xl px-4 h-12 border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <MaterialCommunityIcons name="lock-outline" size={16} color="#3b82f6" />
                    <TextInput
                      className={`flex-1 font-semibold ml-2.5 text-xs h-full ${isDark ? 'text-white' : 'text-slate-800'}`}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? "#475569" : "#cbd5e1"}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      style={{ paddingVertical: 0 }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                      <MaterialCommunityIcons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={16} 
                        color="#3b82f6" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity 
                  onPress={handleLogin}
                  disabled={loading}
                  className="rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#2563eb', '#1d4ed8']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    className="py-4 items-center justify-center flex-row"
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text className="text-white font-black text-xs tracking-widest mr-2 uppercase">लॉगिन करा / LOGIN</Text>
                        <MaterialCommunityIcons name="login" size={16} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Alternative Actions */}
                <View className="mt-8 items-center">
                  <View className="flex-row items-center mb-6">
                    <View className={`h-[1px] w-6 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                      <Text className="text-blue-500 mx-3 font-black text-[10px] uppercase tracking-widest">नवीन खाते? / Create Account</Text>
                    </TouchableOpacity>
                    <View className={`h-[1px] w-6 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                  </View>

                  {/* Compact Branding */}
                  <View className={`items-center flex-row justify-center py-2 px-4 rounded-xl border ${
                    isDark ? 'bg-white/5 border-white/5 opacity-40' : 'bg-blue-50/50 border-blue-100/30'
                  }`}>
                    <Image source={haritLogo} style={{ width: 12, height: 12 }} className="mr-2 rounded-sm" />
                    <Text className={`text-[8px] font-bold tracking-widest uppercase ${isDark ? 'text-white/40' : 'text-blue-900/60'}`}>HarIT Tech Solution</Text>
                  </View>
                </View>

              </Animatable.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
};

export default LoginScreen;
