import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CustomAlert = ({ 
  visible, 
  onClose, 
  onConfirm,
  title = "Information", 
  message = "", 
  type = "info", // info, success, error, warning
  buttonText = "OK",
  cancelText = null // If provided, shows a cancel button
}) => {
  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle-outline',
          bg: 'bg-emerald-500',
          lightBg: 'bg-emerald-50',
          iconColor: '#10b981',
          colors: ['#059669', '#10b981']
        };
      case 'error':
        return {
          icon: 'alert-circle-outline',
          bg: 'bg-red-500',
          lightBg: 'bg-red-50',
          iconColor: '#ef4444',
          colors: ['#dc2626', '#ef4444']
        };
      case 'warning':
        return {
          icon: 'alert-outline',
          bg: 'bg-amber-500',
          lightBg: 'bg-amber-50',
          iconColor: '#f59e0b',
          colors: ['#d97706', '#f59e0b']
        };
      default:
        return {
          icon: 'information-outline',
          bg: 'bg-blue-500',
          lightBg: 'bg-blue-50',
          iconColor: '#3b82f6',
          colors: ['#1e40af', '#3b82f6']
        };
    }
  };

  const theme = getTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-900/60 justify-center items-center px-8">
        <Animatable.View 
          animation="zoomIn"
          duration={400}
          className="bg-white rounded-[40px] p-8 w-full items-center shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Background Elements */}
          <View style={{ backgroundColor: theme.iconColor + '08' }} className="absolute -top-10 -right-10 w-40 h-40 rounded-full" />
          
          <Animatable.View 
            animation="bounceIn"
            delay={200}
            style={{ backgroundColor: theme.iconColor + '15' }}
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
          >
            <MaterialCommunityIcons name={theme.icon} size={44} color={theme.iconColor} />
          </Animatable.View>

          <Animatable.Text 
            animation="fadeInUp"
            delay={300}
            className="text-slate-900 font-black text-2xl text-center mb-3"
          >
            {title}
          </Animatable.Text>

          <Animatable.Text 
            animation="fadeInUp"
            delay={400}
            className="text-slate-500 font-medium text-center mb-8 leading-6 px-2"
          >
            {message}
          </Animatable.Text>

          <View className="w-full space-y-3">
             <TouchableOpacity 
                onPress={onConfirm || onClose}
                activeOpacity={0.8}
                className="w-full rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 mb-3"
              >
                <LinearGradient
                  colors={theme.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="py-4 items-center justify-center"
                >
                  <Text className="text-white font-black uppercase tracking-widest">{buttonText}</Text>
                </LinearGradient>
              </TouchableOpacity>

              {cancelText && (
                <TouchableOpacity 
                  onPress={onClose}
                  activeOpacity={0.6}
                  className="w-full py-4 items-center justify-center bg-slate-100 rounded-2xl"
                >
                  <Text className="text-slate-500 font-bold uppercase tracking-widest">{cancelText}</Text>
                </TouchableOpacity>
              )}
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
