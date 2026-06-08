import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setToken, setUser } = useAuthStore();
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      
      await SecureStore.setItemAsync('userToken', response.data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
      setToken(response.data.token);
      setUser(response.data.user);
      Alert.alert('Success', 'Welcome back!');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Check your connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logoText}>FreelanceGig</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account to continue</Text>
        </View>

        <View style={styles.form}>
          <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="name@example.com" value={value} onChangeText={onChange} autoCapitalize="none" keyboardType="email-address" />
            </View>
          )} />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput style={[styles.input, errors.password && styles.inputError]} placeholder="••••••••" value={value} onChangeText={onChange} secureTextEntry={!showPassword} />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          )} />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleSubmit(onSubmit)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 40, alignItems: 'center' },
  logoText: { fontSize: 32, fontWeight: '900', color: '#0052FF', letterSpacing: -1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center' },
  form: { gap: 4 },
  inputContainer: { marginBottom: 4, position: 'relative' },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6, marginLeft: 4 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#F9F9F9', color: '#000' },
  inputError: { borderColor: '#FF3B30' },
  eyeIcon: { position: 'absolute', right: 16, top: 42, padding: 4 },
  eyeText: { color: '#0052FF', fontSize: 13, fontWeight: '600' },
  errorText: { color: '#FF3B30', fontSize: 12, marginLeft: 4, marginBottom: 12 },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 24 },
  forgotText: { color: '#0052FF', fontSize: 14, fontWeight: '600' },
  loginButton: { backgroundColor: '#0052FF', borderRadius: 12, padding: 18, alignItems: 'center', shadowColor: '#0052FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#666', fontSize: 15 },
  footerLink: { color: '#0052FF', fontSize: 15, fontWeight: '700' },
});