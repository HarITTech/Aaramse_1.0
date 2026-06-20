import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../middleware/ThemeContext';

const BookingPopup = ({ isVisible, onClose, store, slot }) => {
  const { theme } = useTheme();

  if (!store || !slot) {
    return null; // If store or slot is null, render nothing
  }

  const isDark = theme === 'dark';

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ 
          width: '80%', 
          borderRadius: 15, 
          padding: 20, 
          backgroundColor: isDark ? '#0f172a' : 'white',
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? '#1e293b' : 'transparent'
        }}>
          <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Booking Details</Text>
          <Text className={`mb-2 font-medium ${isDark ? 'text-slate-350' : 'text-slate-700'}`}>Store: {store.name || 'N/A'}</Text>
          <Text className={`mb-2 font-medium ${isDark ? 'text-slate-350' : 'text-slate-700'}`}>Slot: From {slot.startTime || 'N/A'} - To {slot.endTime || 'N/A'}</Text>
          <Text className={`mb-6 font-medium ${isDark ? 'text-slate-350' : 'text-slate-700'}`}>Date: {new Date(slot.date).toDateString() || 'N/A'}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={{ backgroundColor: '#007bff', padding: 12, borderRadius: 10 }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default BookingPopup;
