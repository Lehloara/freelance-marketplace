import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

const setupSchema = z.object({
  profession: z.string().min(2, 'Profession required'),
  skills: z.string().min(1, 'Add at least one skill'),
  education: z.string().optional(),
  experience: z.string().optional(),
  bio: z.string().max(500).optional(),
  portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export default function FreelancerProfileSetupScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const { setToken, setUser } = useAuthStore();
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(setupSchema),
    defaultValues: { profession: '', skills: '', education: '', experience: '', bio: '', portfolio: '' },
  });

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Allow photo access to upload your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('📷 ERROR:', err);
      Alert.alert('Error', 'Failed to open photo library');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const rawUser = await SecureStore.getItemAsync('userData');
      if (!rawUser) throw new Error('Session expired. Please register again.');
      const user = JSON.parse(rawUser);

      let finalImage = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        try {
          const formData = new FormData();
          formData.append('image', { uri: imageUri, name: 'profile.jpg', type: 'image/jpeg' });
          const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          finalImage = res.data.url || imageUri;
        } catch (e) {
        }
      }

      const profile = {
        profession: data.profession,
        skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
        education: data.education || '',
        experience: data.experience || '',
        bio: data.bio || '',
        portfolio: data.portfolio || '',
        profileImage: finalImage,
        profileCompleted: true,
      };

      await api.put(`/users/${user.id}/profile`, profile);

      const updatedUser = { ...user, ...profile };
      await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
      setToken(await SecureStore.getItemAsync('userToken'));
      setUser(updatedUser);

      Alert.alert('Setup Complete', 'Welcome! You can now browse gigs.', [
        { text: 'Continue' } 
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save profile.';
      Alert.alert('Setup Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Complete Your Profile</Text>
        
        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarPh]}><Text style={styles.avatarPhTxt}>📷</Text></View>}
          <Text style={styles.avatarHint}>{imageUri ? 'Tap to change' : 'Tap to upload photo'}</Text>
        </TouchableOpacity>

        {[
          { name: 'profession', ph: 'Profession (e.g., Mobile Developer)' },
          { name: 'skills', ph: 'Skills (comma separated)' },
          { name: 'education', ph: 'Education' },
          { name: 'experience', ph: 'Experience' },
          { name: 'portfolio', ph: 'Portfolio URL' },
          { name: 'bio', ph: 'Short bio' }
        ].map(f => (
          <View key={f.name} style={styles.field}>
            <Controller control={control} name={f.name} render={({ field: { onChange, value } }) => (
              <TextInput 
                style={[styles.input, errors[f.name] && styles.err]} 
                placeholder={f.ph} 
                value={value} 
                onChangeText={onChange} 
                multiline={f.name === 'bio'} 
                numberOfLines={f.name === 'bio' ? 3 : 1} 
                autoCapitalize={f.name === 'portfolio' ? 'none' : 'words'} 
              />
            )} />
            {errors[f.name] && <Text style={styles.errTxt}>{errors[f.name].message}</Text>}
          </View>
        ))}

        <TouchableOpacity style={[styles.btn, loading && styles.dis]} onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Complete Profile</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  avatarPh: { backgroundColor: '#E6F0FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#0052FF' },
  avatarPhTxt: { fontSize: 32 },
  avatarHint: { fontSize: 13, color: '#666' },
  field: { marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 14, fontSize: 14, backgroundColor: '#F9F9F9', minHeight: 48 },
  err: { borderColor: '#FF3B30' },
  errTxt: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
  btn: { backgroundColor: '#0052FF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  dis: { opacity: 0.7 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});