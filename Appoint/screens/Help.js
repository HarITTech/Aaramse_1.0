import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

const Help = () => {
  const navigation = useNavigation();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const FAQItem = ({ question, answer, index, delay }) => {
    const isExpanded = expandedIndex === index;
    return (
      <Animatable.View animation="fadeInUp" delay={delay} className="mb-4">
        <TouchableOpacity 
          onPress={() => setExpandedIndex(isExpanded ? null : index)}
          className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex-row items-center justify-between ${isExpanded ? 'border-blue-100' : ''}`}
        >
          <Text className={`font-black text-base flex-1 pr-4 ${isExpanded ? 'text-blue-600' : 'text-slate-800'}`}>{question}</Text>
          <MaterialCommunityIcons 
            name={isExpanded ? "minus-circle-outline" : "plus-circle-outline"} 
            size={24} 
            color={isExpanded ? "#3b82f6" : "#94a3b8"} 
          />
        </TouchableOpacity>
        {isExpanded && (
          <Animatable.View animation="fadeInDown" duration={300} className="bg-blue-50/30 p-5 rounded-b-3xl -mt-4 pt-8">
            <Text className="text-slate-600 leading-6 font-medium">{answer}</Text>
          </Animatable.View>
        )}
      </Animatable.View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <LinearGradient
          colors={['#fff', '#f1f5f9']}
          className="px-8 pt-12 pb-12 rounded-b-3xl shadow-sm mb-8"
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="mb-6 w-10 h-10 bg-white items-center justify-center rounded-xl shadow-sm border border-slate-100"
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Animatable.View animation="fadeIn">
            <Text className="text-3xl font-black text-slate-900 mb-2">Help Center</Text>
            <Text className="text-slate-500 font-medium text-base leading-6">Everything you need to know about AaramSe.</Text>
          </Animatable.View>
        </LinearGradient>

        <View className="px-6">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6 ml-4">Common Questions</Text>
          
          <FAQItem 
            index={0} delay={100}
            question="How do I book an appointment?"
            answer="Browse the dashboard to find your desired store, select an available time slot that fits your schedule, and tap 'Book Appointment'. You'll see your queue number instantly."
          />
          <FAQItem 
            index={1} delay={200}
            question="Can I cancel my booking?"
            answer="Yes, navigate to your 'Profile' and tap on 'My Booking History'. Select the active booking you wish to cancel and confirm. Please cancel at least 30 minutes prior to avoid no-show penalties."
          />
          <FAQItem 
            index={2} delay={300}
            question="How do I know it's my turn?"
            answer="AaramSe sends real-time push notifications when there are only 2 people ahead of you. You can also monitor your live status on the store page."
          />
          <FAQItem 
            index={3} delay={400}
            question="How to register as a partner?"
            answer="Go to your Profile settings and select 'Register Your Shop'. Fill in your business details, upload images, and set your available time slots. It takes less than 2 minutes!"
          />

          <View className="mt-8 p-6 bg-blue-900 rounded-3xl shadow-lg">
            <Text className="text-white text-xl font-black mb-2">Still Stuck?</Text>
            <Text className="text-blue-100/70 font-medium mb-8">Our human support team is available 24/7 to assist you with any inquiries.</Text>
            
            <TouchableOpacity 
              className="bg-emerald-500 rounded-2xl py-4 items-center shadow-lg"
              onPress={() => Linking.openURL('mailto:support@aaramse.com')}
            >
              <Text className="text-white font-black text-base">Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Help;
