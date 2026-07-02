import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  Dimensions,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../middleware/ThemeContext';
import { API_BASE_URL } from '../config/api';
import OtpModal from '../components/OtpModal';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import logo from '../assets/logo.png';
import haritLogo from '../assets/harit_logo.png';
import backgroundImage from '../assets/background_concept.png';

const { width } = Dimensions.get('window');

// Compact Refined Input for Single Page View (Aligned with Login styling)
const RegistrationInput = ({ icon, label, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default', showPassword = false, onTogglePassword = null, isDark = true }) => (
  <View className="mb-4">
    <Text className={`text-[9px] font-black uppercase tracking-[1.5px] mb-2 ml-1 ${isDark ? 'text-slate-400' : 'text-blue-900/60'}`}>{label}</Text>
    <View className={`flex-row items-center rounded-2xl px-4 h-12 border ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <MaterialCommunityIcons name={icon} size={16} color="#3b82f6" />
      <TextInput
        className={`flex-1 font-semibold ml-2.5 h-full text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#475569" : "#cbd5e1"}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={{ paddingVertical: 0 }}
      />
      {secureTextEntry && onTogglePassword && (
        <TouchableOpacity onPress={onTogglePassword} className="p-2">
          <MaterialCommunityIcons 
            name={showPassword ? "eye-off-outline" : "eye-outline"} 
            size={16} 
            color="#3b82f6" 
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const { theme } = useTheme();
  const navigation = useNavigation();

  const isDark = theme === 'dark';

  const proceedRegistration = async () => {
    setLoading(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(email);
    
    try {
      const payload = {
        name,
        password,
        ...(isEmail ? { email } : { phone: email })
      };
      await axios.post(`${API_BASE_URL}/api/auth/register`, payload);
      Alert.alert('Success', 'Welcome! Please login to continue.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Basic validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    
    const isEmail = emailRegex.test(email);
    const isPhone = phoneRegex.test(email);

    if (!isEmail && !isPhone) {
      Alert.alert('Error', 'Please enter a valid email address or 10-digit mobile number');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (isEmail) {
      setOtpModalVisible(true);
    } else {
      await proceedRegistration();
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
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, padding: 32, justifyContent: 'center' }}
            >
              {/* Header Title Section */}
              <Animatable.View animation="fadeInDown" duration={1000} className="items-center mb-6">
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
                  <Image source={logo} style={{ width: 60, height: 60, borderRadius: 14 }} resizeMode="contain" />
                </View>
                
                {/* Brand Title (Fixed Android wrapping bug using adjustsFontSizeToFit) */}
                <Text 
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  className={`text-3xl font-black tracking-tight text-center w-full px-2 ${isDark ? 'text-white' : 'text-blue-955'}`}
                >
                  join आराम<Text className="text-blue-500">Se</Text>
                </Text>
                <Text className={`text-xs font-semibold text-center mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>खाते तयार करा / Register to get started</Text>
              </Animatable.View>

              {/* Form Input fields */}
              <Animatable.View animation="fadeInUp" delay={200} duration={1000}>
                
                <RegistrationInput 
                  icon="account-outline" 
                  label="Full Name" 
                  placeholder="Full Name" 
                  value={name} 
                  onChangeText={setName} 
                  isDark={isDark}
                />
                
                <RegistrationInput 
                  icon="email-outline" 
                  label="Email or Mobile Number" 
                  placeholder="Email or 10-digit Mobile Number" 
                  value={email} 
                  onChangeText={setEmail} 
                  keyboardType="email-address" 
                  isDark={isDark}
                />

                <RegistrationInput 
                  icon="lock-outline" 
                  label="Password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                  showPassword={showPassword} 
                  onTogglePassword={() => setShowPassword(!showPassword)} 
                  isDark={isDark}
                />

                {/* Submit Register Button */}
                <TouchableOpacity 
                  onPress={handleRegister}
                  className="mt-2 overflow-hidden rounded-2xl shadow-lg shadow-blue-500/20"
                  disabled={loading}
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
                        <Text className="text-white font-black text-xs tracking-widest mr-2 uppercase">नोंदणी करा / SIGN UP</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Redirect to Login */}
                <View className="flex-row justify-center mt-6 mb-6">
                  <Text className={`font-semibold text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text className="text-blue-500 font-black text-[10px] uppercase tracking-wider">LOGIN</Text>
                  </TouchableOpacity>
                </View>

                {/* Compact Branding */}
                <View className={`items-center flex-row justify-center py-2 px-4 rounded-xl border ${
                  isDark ? 'bg-white/5 border-white/5 opacity-40' : 'bg-blue-50/50 border-blue-100/30'
                }`}>
                  <Image source={haritLogo} style={{ width: 12, height: 12 }} className="mr-2 rounded-sm" />
                  <Text className={`text-[8px] font-bold tracking-widest uppercase ${isDark ? 'text-white/40' : 'text-blue-900/60'}`}>HarIT Tech Solution</Text>
                </View>
              </Animatable.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
      
      <OtpModal
        visible={otpModalVisible}
        email={email}
        buttonText="Verify & Register"
        onVerified={async () => {
          setOtpModalVisible(false);
          await proceedRegistration();
        }}
        onClose={() => setOtpModalVisible(false)}
      />
    </ImageBackground>
  );
};

export default RegisterScreen;
