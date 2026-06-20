import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../middleware/ThemeContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const RESEND_COOLDOWN = 60; // seconds

const OtpModal = ({ visible, email, onVerified, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setOtp(['', '', '', '', '', '']);
      setOtpSent(false);
      setCountdown(0);
      setErrorMsg('');
      setSuccessMsg('');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible]);

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendOtp = async () => {
    if (!email) return;
    setErrorMsg('');
    setSuccessMsg('');
    setSending(true);
    try {
      await axios.post(`${API_BASE_URL}/api/otp/send`, { email });
      setOtpSent(true);
      setSuccessMsg('OTP sent! Check your inbox.');
      startCountdown();
      // Focus first OTP box
      setTimeout(() => inputRefs.current[0]?.focus(), 400);
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Failed to send OTP. Try again.';
      setErrorMsg(msg);
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg('');

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are filled
    if (digit && index === 5) {
      const fullOtp = [...newOtp].join('');
      if (fullOtp.length === 6) {
        Keyboard.dismiss();
        handleVerifyOtp(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpString) => {
    const code = otpString || otp.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP.');
      return;
    }
    setErrorMsg('');
    setVerifying(true);
    try {
      await axios.post(`${API_BASE_URL}/api/otp/verify`, { email, otp: code });
      onVerified(); // parent will create the store
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Invalid OTP. Please try again.';
      setErrorMsg(msg);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setVerifying(false);
    }
  };

  if (!visible) return null;

  const allFilled = otp.every(d => d !== '');

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
      >
        <Animatable.View
          animation="zoomIn"
          duration={400}
          style={{
            width: '100%',
            borderRadius: 40,
            overflow: 'hidden',
            backgroundColor: isDark ? '#0f172a' : '#fff',
            borderWidth: 1,
            borderColor: isDark ? '#1e293b' : '#f1f5f9',
          }}
        >
          {/* Header */}
          <LinearGradient
            colors={['#1e40af', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 28, alignItems: 'center' }}
          >
            <Animatable.View animation="bounceIn" delay={200} style={{
              width: 64, height: 64,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 32,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <MaterialCommunityIcons name="email-check-outline" size={32} color="#fff" />
            </Animatable.View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>
              Verify Your Email
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              {email}
            </Text>
          </LinearGradient>

          <View style={{ padding: 28 }}>
            {/* Instruction */}
            <Animatable.Text animation="fadeInUp" delay={200} style={{
              color: isDark ? '#94a3b8' : '#64748b',
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 28,
            }}>
              {otpSent
                ? 'Enter the 6-digit code we sent to your email.'
                : 'Click "Send OTP" to receive a verification code on your email.'}
            </Animatable.Text>

            {/* OTP 6-box Input */}
            {otpSent && (
              <Animatable.View animation="fadeInUp" delay={100} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 28, gap: 10 }}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => (inputRefs.current[index] = ref)}
                    value={digit}
                    onChangeText={val => handleOtpChange(val, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    style={{
                      width: 44,
                      height: 54,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: digit
                        ? '#3b82f6'
                        : isDark ? '#1e293b' : '#e2e8f0',
                      backgroundColor: digit
                        ? (isDark ? '#1e3a5f' : '#eff6ff')
                        : (isDark ? '#0f172a' : '#f8fafc'),
                      textAlign: 'center',
                      fontSize: 22,
                      fontWeight: '900',
                      color: isDark ? '#f1f5f9' : '#1e293b',
                    }}
                  />
                ))}
              </Animatable.View>
            )}

            {/* Messages */}
            {successMsg && !errorMsg ? (
              <Animatable.View animation="fadeIn" style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: isDark ? '#052e16' : '#f0fdf4',
                borderRadius: 12, padding: 12, marginBottom: 20,
              }}>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color="#10b981" />
                <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>{successMsg}</Text>
              </Animatable.View>
            ) : null}

            {errorMsg ? (
              <Animatable.View animation="shakeX" style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: isDark ? '#450a0a' : '#fef2f2',
                borderRadius: 12, padding: 12, marginBottom: 20,
              }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600', marginLeft: 8, flex: 1 }}>{errorMsg}</Text>
              </Animatable.View>
            ) : null}

            {/* Send / Resend OTP Button */}
            {!otpSent ? (
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={sending}
                style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}
              >
                <LinearGradient
                  colors={['#1e40af', '#3b82f6']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                  {sending
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <MaterialCommunityIcons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 }}>Send OTP</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                {/* Verify Button */}
                <TouchableOpacity
                  onPress={() => handleVerifyOtp()}
                  disabled={verifying || !allFilled}
                  style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 16, opacity: allFilled ? 1 : 0.5 }}
                >
                  <LinearGradient
                    colors={['#059669', '#10b981']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                  >
                    {verifying
                      ? <ActivityIndicator color="#fff" />
                      : <>
                          <MaterialCommunityIcons name="check-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 }}>
                            Verify & Create Store
                          </Text>
                        </>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                {/* Resend OTP */}
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={countdown > 0 || sending}
                  style={{ alignItems: 'center', paddingVertical: 10, marginBottom: 4 }}
                >
                  {countdown > 0 ? (
                    <Text style={{ color: isDark ? '#475569' : '#94a3b8', fontSize: 13 }}>
                      Resend OTP in <Text style={{ color: '#3b82f6', fontWeight: '800' }}>{countdown}s</Text>
                    </Text>
                  ) : (
                    <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '700' }}>
                      {sending ? 'Sending...' : '↻  Resend OTP'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Cancel */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                alignItems: 'center', paddingVertical: 14,
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                borderRadius: 18, marginTop: 4,
              }}
            >
              <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: '700', fontSize: 13 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
};

export default OtpModal;
