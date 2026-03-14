import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

const BookingPopup = ({ isVisible, onClose, store, slot }) => {
  if (!store || !slot) {
    return null; // If store or slot is null, render nothing
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ width: '80%', backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
          <Text className="text-lg font-bold mb-2">Booking Details</Text>
          <Text className="mb-2">Store: {store.name || 'N/A'}</Text>
          <Text className="mb-2">Slot: From {slot.startTime || 'N/A'} - To {slot.endTime || 'N/A'}</Text>
          <Text className="mb-4">Date: {new Date(slot.date).toDateString() || 'N/A'}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={{ backgroundColor: '#007bff', padding: 10, borderRadius: 5 }}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default BookingPopup;
