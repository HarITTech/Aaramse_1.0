import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Modal } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SuccessPopup = ({ visible, onClose, title = "Booking Successful!", message = "Your appointment has been confirmed.", buttonText = "Back to Home" }) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
    >
      <View className="flex-1 bg-slate-900/60 justify-center items-center px-6 backdrop-blur-md">
        <Animatable.View 
          animation="zoomIn"
          duration={500}
          className="bg-white rounded-[48px] p-8 w-full max-w-sm items-center shadow-2xl overflow-hidden"
        >
          {/* Animated Background Circles */}
          <View className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />
          <View className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full -ml-16 -mb-16 opacity-50" />

          {/* Icon Animation */}
          <Animatable.View 
            animation="bounceIn"
            delay={300}
            className="w-24 h-24 bg-emerald-500 rounded-full items-center justify-center shadow-lg shadow-emerald-500/40 mb-8"
          >
            <MaterialCommunityIcons name="check-all" size={50} color="#fff" />
          </Animatable.View>

          <Animatable.Text 
            animation="fadeInUp"
            delay={500}
            className="text-slate-900 font-black text-2xl text-center mb-3"
          >
            {title}
          </Animatable.Text>

          <Animatable.Text 
            animation="fadeInUp"
            delay={600}
            className="text-slate-500 font-medium text-center mb-10 leading-6"
          >
            {message}
          </Animatable.Text>

          <TouchableOpacity 
            onPress={onClose}
            activeOpacity={0.8}
            className="w-full rounded-3xl overflow-hidden shadow-xl shadow-blue-500/20"
          >
            <LinearGradient
              colors={['#1e40af', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-5 items-center justify-center flex-row"
            >
              <Text className="text-white font-black uppercase tracking-widest mr-2">{buttonText}</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Confetti-like bits */}
        <Animatable.View animation="fadeOutUp" delay={800} duration={1500} style={{ position: 'absolute', top: '30%', left: '20%' }}>
            <MaterialCommunityIcons name="star" size={20} color="#fbbf24" />
        </Animatable.View>
        <Animatable.View animation="fadeOutDown" delay={900} duration={1500} style={{ position: 'absolute', bottom: '30%', right: '20%' }}>
            <MaterialCommunityIcons name="circle" size={15} color="#10b981" />
        </Animatable.View>
      </View>
    </Modal>
  );
};

export default SuccessPopup;
