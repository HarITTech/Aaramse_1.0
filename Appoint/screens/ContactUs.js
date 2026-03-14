import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Moved outside to fix keyboard focus issue
const ContactInput = ({ icon, label, placeholder, value, onChangeText, multiline = false }) => (
  <View className="mb-6">
    <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 ml-4">{label}</Text>
    <View className={`flex-row items-start bg-white rounded-3xl px-4 border border-slate-100 shadow-sm ${multiline ? 'h-32 pt-4' : 'h-16'}`}>
      <MaterialCommunityIcons name={icon} size={20} color="#3b82f6" className={multiline ? "mt-0 mr-3" : "mt-5 mr-3"} />
      <TextInput
        className="flex-1 text-slate-800 font-semibold ml-2 h-full"
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{ paddingVertical: Platform.OS === 'android' ? 0 : 10 }}
      />
    </View>
  </View>
);

const ContactUs = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      setResult("Please fill in required fields.");
      return;
    }
    
    setLoading(true);
    setResult("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("subject", subject);
    formData.append("message", message);
    formData.append("access_key", "90a35636-58cb-4e36-a45e-9e73ed09a09b");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResult("Message Sent Successfully!");
        setName(''); setEmail(''); setSubject(''); setMessage('');
      } else {
        setResult(data.message);
      }
    } catch (error) {
      setResult("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-slate-50"
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient
          colors={['#f8fafc', '#eff6ff']}
          className="px-8 pt-12 pb-12 rounded-b-[50px] shadow-sm"
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mb-6 w-12 h-12 bg-white items-center justify-center rounded-2xl shadow-sm border border-slate-100"
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#1e293b" />
          </TouchableOpacity>
          <Animatable.View animation="fadeInLeft">
             <Text className="text-4xl font-black text-slate-900 mb-2">Contact Us</Text>
             <Text className="text-slate-500 text-lg font-medium">We're here to help you solve your queue problems.</Text>
          </Animatable.View>
        </LinearGradient>

        <View className="px-8 -mt-8">
          <Animatable.View animation="fadeInUp" delay={200} className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-50">
            <ContactInput icon="account-outline" label="Your Name" placeholder="Ex: Mahesh Kumar" value={name} onChangeText={setName} />
            <ContactInput icon="email-outline" label="Email Address" placeholder="Ex: contact@mkhs.com" value={email} onChangeText={setEmail} />
            <ContactInput icon="message-outline" label="How can we help?" placeholder="Type your message here..." value={message} onChangeText={setMessage} multiline />

            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={loading}
              className="mt-4 rounded-3xl overflow-hidden shadow-lg shadow-blue-500/30"
            >
              <LinearGradient
                colors={['#1e3a8a', '#3b82f6']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="py-5 items-center justify-center flex-row"
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                   <>
                    <Text className="text-white font-black text-lg mr-2 tracking-widest">SEND MESSAGE</Text>
                    <MaterialCommunityIcons name="send-outline" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {result !== "" && (
              <Animatable.Text animation="fadeIn" className="mt-4 text-center text-blue-600 font-bold uppercase tracking-widest text-xs">
                {result}
              </Animatable.Text>
            )}
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={400} className="mt-8 bg-blue-900 rounded-[40px] p-8 shadow-lg">
             <Text className="text-white text-xl font-black mb-4">Visit Our Base</Text>
             <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons name="map-marker" size={20} color="#60a5fa" />
                <Text className="text-blue-100/80 ml-3 font-medium flex-1">1234, AaramSe Digital Hub, Mumbai, India</Text>
             </View>
             <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons name="email" size={20} color="#60a5fa" />
                <Text className="text-blue-100/80 ml-3 font-medium">support@aaramse.com</Text>
             </View>
             <View className="flex-row items-center">
                <MaterialCommunityIcons name="phone" size={20} color="#60a5fa" />
                <Text className="text-blue-100/80 ml-3 font-medium">+91-555-0199-22</Text>
             </View>
          </Animatable.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ContactUs;
