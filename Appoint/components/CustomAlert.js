import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../middleware/ThemeContext';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!visible) return null;

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle-outline',
          bg: 'bg-emerald-500',
          lightBg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
          iconColor: '#10b981',
          colors: ['#059669', '#10b981']
        };
      case 'error':
        return {
          icon: 'alert-circle-outline',
          bg: 'bg-red-500',
          lightBg: isDark ? 'bg-red-500/10' : 'bg-red-50',
          iconColor: '#ef4444',
          colors: ['#dc2626', '#ef4444']
        };
      case 'warning':
        return {
          icon: 'alert-outline',
          bg: 'bg-amber-500',
          lightBg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
          iconColor: '#f59e0b',
          colors: ['#d97706', '#f59e0b']
        };
      default:
        return {
          icon: 'information-outline',
          bg: 'bg-blue-500',
          lightBg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
          iconColor: '#3b82f6',
          colors: ['#1e40af', '#3b82f6']
        };
    }
  };

  const alertTheme = getTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className={`flex-1 justify-center items-center px-8 ${isDark ? 'bg-black/70' : 'bg-slate-900/60'}`}>
        <Animatable.View 
          animation="zoomIn"
          duration={350}
          className={`rounded-[40px] p-8 w-full items-center border relative overflow-hidden shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'
          }`}
        >
          {/* Decorative Background Elements */}
          <View style={{ backgroundColor: alertTheme.iconColor + '05' }} className="absolute -top-10 -right-10 w-40 h-40 rounded-full" />
          
          <Animatable.View 
            animation="bounceIn"
            delay={150}
            style={{ backgroundColor: alertTheme.iconColor + (isDark ? '15' : '10') }}
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
          >
            <MaterialCommunityIcons name={alertTheme.icon} size={44} color={alertTheme.iconColor} />
          </Animatable.View>

          <Animatable.Text 
            animation="fadeInUp"
            delay={250}
            className={`font-black text-2xl text-center mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            {title}
          </Animatable.Text>

          <Animatable.Text 
            animation="fadeInUp"
            delay={350}
            className={`font-medium text-center mb-8 leading-6 px-2 text-sm ${isDark ? 'text-slate-450' : 'text-slate-500'}`}
          >
            {message}
          </Animatable.Text>

          <View className="w-full space-y-3">
             <TouchableOpacity 
                onPress={onConfirm || onClose}
                activeOpacity={0.8}
                className="w-full rounded-2xl overflow-hidden shadow-lg shadow-blue-500/10 mb-3"
              >
                <LinearGradient
                  colors={alertTheme.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="py-4 items-center justify-center"
                >
                  <Text className="text-white font-black uppercase tracking-widest text-xs">{buttonText}</Text>
                </LinearGradient>
              </TouchableOpacity>

              {cancelText && (
                <TouchableOpacity 
                  onPress={onClose}
                  activeOpacity={0.6}
                  className={`w-full py-4 items-center justify-center rounded-2xl ${
                    isDark ? 'bg-slate-800' : 'bg-slate-100'
                  }`}
                >
                  <Text className={`font-bold uppercase tracking-widest text-xs ${
                    isDark ? 'text-slate-300' : 'text-slate-500'
                  }`}>{cancelText}</Text>
                </TouchableOpacity>
              )}
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
