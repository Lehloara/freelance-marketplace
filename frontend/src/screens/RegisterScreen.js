import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['client', 'freelancer']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', role: 'freelancer' },
  });
  const { setToken, setUser } = useAuthStore();
  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await api.post('/auth/register', registerData);
      
      await SecureStore.setItemAsync('userToken', response.data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
      
      setToken(response.data.token);
      setUser(response.data.user);
      
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        
        <Controller control={control} name="fullName" render={({ field: { onChange, value } }) => (
          <TextInput style={[styles.input, errors.fullName && styles.err]} placeholder="Full Name (e.g., Mothae Lehloara)" value={value} onChangeText={onChange} autoCapitalize="words" />
        )} />
        
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <TextInput style={[styles.input, errors.email && styles.err]} placeholder="Email Address" value={value} onChangeText={onChange} autoCapitalize="none" keyboardType="email-address" />
        )} />
        
        <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
          <TextInput style={[styles.input, errors.password && styles.err]} placeholder="Create Password (min 6 chars)" value={value} onChangeText={onChange} secureTextEntry />
        )} />
        
        <Controller control={control} name="confirmPassword" render={({ field: { onChange, value } }) => (
          <TextInput style={[styles.input, errors.confirmPassword && styles.err]} placeholder="Confirm Password" value={value} onChangeText={onChange} secureTextEntry />
        )} />
        
        <View style={styles.roleRow}>
          <TouchableOpacity style={[styles.roleBtn, selectedRole === 'client' && styles.roleActive]} onPress={() => setValue('role', 'client')}>
            <Text style={styles.roleTxt}>Client</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleBtn, selectedRole === 'freelancer' && styles.roleActive]} onPress={() => setValue('role', 'freelancer')}>
            <Text style={styles.roleTxt}>Freelancer</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={[styles.btn, loading && styles.dis]} onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Create Account</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#F9F9F9', marginBottom: 14 },
  err: { borderColor: '#FF3B30' },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center' },
  roleActive: { backgroundColor: '#0052FF', borderColor: '#0052FF' },
  roleTxt: { color: '#333', fontWeight: '600' },
  btn: { backgroundColor: '#0052FF', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  dis: { opacity: 0.7 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: '#0052FF', fontWeight: '600' },
});