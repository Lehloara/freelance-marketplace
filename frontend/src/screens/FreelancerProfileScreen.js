import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name required'),
  profession: z.string().min(2, 'Profession required'),
  skills: z.string().min(1, 'Add at least one skill'),
  education: z.string().optional(),
  experience: z.string().optional(),
  certifications: z.string().optional(),
  portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
});

export default function FreelancerProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [stats, setStats] = useState({ completedProjects: 0, activeProjects: 0 });
  const [ratingData, setRatingData] = useState({ rating: 0, count: 0 });
  const { user, setUser, logout } = useAuthStore();
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', profession: '', skills: '', education: '', experience: '', certifications: '', portfolio: '', bio: '' },
  });

  useFocusEffect(
    useCallback(() => { 
      if (user) { 
        fetchProfile(); 
        fetchStats(); 
        fetchRating(); 
      }
      return () => {}; 
    }, [user])
  );

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${user.id}/profile`);
      const data = res.data.profile || res.data;
      reset({ 
        fullName: data.fullName || user.fullName || '', 
        profession: data.profession || '', 
        skills: data.skills?.join(', ') || '', 
        education: data.education || '', 
        experience: data.experience || '', 
        certifications: data.certifications || '', 
        portfolio: data.portfolio || '', 
        bio: data.bio || '' 
      });
      if (data.profileImage) setImageUri(data.profileImage);
    } catch (err) {
      console.warn('Fetch profile failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/freelancer/stats');
      if (res.data.success) setStats(res.data.stats);
    } catch (err) {
      console.warn('Fetch stats failed:', err);
      setStats({ completedProjects: 0, activeProjects: 0 });
    }
  };

  const fetchRating = async () => {
    try {
      const res = await api.get(`/ratings/${user.id}`);
      if (res.data.success) setRatingData(res.data);
    } catch (err) {
      console.warn('Fetch rating failed:', err);
      setRatingData({ rating: 0, count: 0 });
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Allow photo access to change your profile picture.');
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
      Alert.alert('Error', 'Failed to open photo library');
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      let finalImage = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        try {
          const fd = new FormData();
          fd.append('image', { uri: imageUri, name: 'profile.jpg', type: 'image/jpeg' });
          const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          finalImage = r.data.url || imageUri;
        } catch (e) {
          console.log('ℹ️ Upload fallback: using local URI');
        }
      }
      const updated = {
        ...data,
        skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
        profileImage: finalImage,
      };
      await api.put(`/users/${user.id}/profile`, updated);
      setUser({ ...user, ...updated });
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  if (!user || loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0052FF" /></View>;
  }

  const fields = [
    { name: 'fullName', label: 'Full Name' },
    { name: 'profession', label: 'Profession' },
    { name: 'skills', label: 'Skills (comma separated)' },
    { name: 'education', label: 'Education' },
    { name: 'experience', label: 'Experience' },
    { name: 'certifications', label: 'Certifications' },
    { name: 'portfolio', label: 'Portfolio URL', kb: 'url' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={editing ? pickImage : null}
          disabled={!editing}
          style={styles.avatarContainer}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh]}>
              <Text style={styles.avatarPhTxt}>{(user.fullName || 'F').charAt(0)}</Text>
            </View>
          )}
          {editing && <Text style={styles.editHint}>Tap to change photo</Text>}
        </TouchableOpacity>
        <Text style={styles.name}>{user.fullName}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>★ {ratingData.rating || 'N/A'}/5</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#E6F0FF' }]}>
            <Text style={[styles.badgeTxt, { color: '#0052FF' }]}>{ratingData.count} Reviews</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#D1ECF1' }]}>
            <Text style={[styles.badgeTxt, { color: '#0C5460' }]}>{stats.completedProjects} Completed</Text>
          </View>
        </View>
      </View>

      <View style={styles.form}>
        {fields.map(f => (
          <View key={f.name} style={styles.field}>
            <Text style={styles.label}>{f.label}</Text>
            <Controller
              control={control}
              name={f.name}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, !editing && styles.disabled]}
                  value={value || ''}
                  onChangeText={onChange}
                  editable={editing}
                  keyboardType={f.kb || 'default'}
                  autoCapitalize={f.name === 'portfolio' ? 'none' : 'words'}
                />
              )}
            />
            {errors[f.name] && <Text style={styles.errTxt}>{errors[f.name].message}</Text>}
          </View>
        ))}

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea, !editing && styles.disabled]}
                value={value || ''}
                onChangeText={onChange}
                editable={editing}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={editing ? styles.saveBtn : styles.editBtn}
          onPress={editing ? handleSubmit(onSubmit) : () => setEditing(true)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={editing ? '#fff' : '#0052FF'} />
          ) : (
            <Text style={[styles.btnTxt, editing ? styles.saveTxt : styles.editTxt]}>
              {editing ? 'Save Changes' : 'Edit Profile'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatarContainer: { alignItems: 'center', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  avatarPh: { backgroundColor: '#E6F0FF', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#0052FF' },
  avatarPhTxt: { fontSize: 36, color: '#0052FF', fontWeight: 'bold' },
  editHint: { fontSize: 12, color: '#0052FF', marginTop: 4 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { backgroundColor: '#FFF3CD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginHorizontal: 2 },
  badgeTxt: { fontSize: 12, fontWeight: '600' },
  form: { padding: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 14, fontSize: 14, backgroundColor: '#F9F9F9', color: '#000', minHeight: 48 },
  disabled: { backgroundColor: '#F0F0F0', color: '#666' },
  textArea: { height: 80, textAlignVertical: 'top' },
  errTxt: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
  editBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0052FF', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  saveBtn: { backgroundColor: '#0052FF', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  btnTxt: { fontSize: 16, fontWeight: '700' },
  editTxt: { color: '#0052FF' },
  saveTxt: { color: '#fff' },
  logoutBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF3B30', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutTxt: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});