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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import logo from '../assets/logo.png';
import haritLogo from '../assets/harit_logo.png';

const { width } = Dimensions.get('window');

// Compact Input for Single Page View
const RegistrationInput = ({ icon, label, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default' }) => (
  <View className="mb-3">
    <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-[1px] mb-1 ml-1">{label}</Text>
    <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-3 h-11">
      <MaterialCommunityIcons name={icon} size={15} color="#10b981" />
      <TextInput
        className="flex-1 text-white font-semibold ml-2 h-full text-xs"
        placeholder={placeholder}
        placeholderTextColor="#475569"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={{ paddingVertical: 0 }}
      />
    </View>
  </View>
);

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password });
      Alert.alert('Success', 'Welcome! Please login to continue.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#020617', '#1e1b4b']} className="flex-1">
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
            >
              <Animatable.View animation="fadeInDown" duration={1000} className="items-center mb-8">
                <View className="bg-white/10 p-3 rounded-[28px] border border-white/10 mb-4 backdrop-blur-md">
                   <Image source={logo} style={{ width: 60, height: 60 }} resizeMode="contain" />
                </View>
                <Text className="text-white text-3xl font-black mb-1">Join आराम<Text className="text-emerald-500">Se</Text></Text>
                <Text className="text-slate-400 font-medium text-xs">Manage queues digitally and grow.</Text>
              </Animatable.View>

              <Animatable.View animation="fadeInUp" delay={200} duration={1000}>
                <RegistrationInput icon="account-outline" label="Full Name" placeholder="Name" value={name} onChangeText={setName} />
                
                <RegistrationInput icon="email-outline" label="Email" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />

                <RegistrationInput icon="lock-outline" label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

                <TouchableOpacity 
                  onPress={handleRegister}
                  className="mt-3 overflow-hidden rounded-xl shadow-lg shadow-emerald-500/10"
                  disabled={loading}
                >
                  <LinearGradient colors={['#10b981', '#059669']} className="py-3 items-center justify-center">
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-black text-xs tracking-widest">SIGN UP</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-6">
                  <Text className="text-slate-500 font-medium text-[10px]">Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text className="text-emerald-400 font-black text-[10px] uppercase">LOGIN</Text>
                  </TouchableOpacity>
                </View>

                {/* Compact Branding */}
                <View className="mt-8 items-center flex-row justify-center py-2 px-4 bg-white/5 rounded-xl border border-white/5 opacity-80">
                   <Image source={haritLogo} style={{ width: 14, height: 14 }} className="mr-2 rounded-sm" />
                   <Text className="text-white/50 text-[8px] font-black tracking-widest uppercase">HarIT Tech Solution</Text>
                </View>
              </Animatable.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default RegisterScreen;
