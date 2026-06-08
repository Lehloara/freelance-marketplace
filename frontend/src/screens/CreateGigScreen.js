import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

const gigSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Category required'),
  budgetMin: z.string().refine((val) => !isNaN(val) && Number(val) >= 0, 'Invalid amount'),
  budgetMax: z.string().refine((val) => !isNaN(val) && Number(val) >= 0, 'Invalid amount'),
  deadline: z.string().min(1, 'Deadline required'),
  requiredSkills: z.string().min(1, 'Add at least one skill'),
});

export default function CreateGigScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(gigSchema),
    defaultValues: { title: '', description: '', category: '', budgetMin: '', budgetMax: '', deadline: '', requiredSkills: '' },
  });


  const selectedCategory = watch('category');

  const categories = ['Mobile Development', 'Web Development', 'Design', 'Writing', 'Marketing', 'Data Science'];

  const onSubmit = async (data) => {
    if (Number(data.budgetMin) > Number(data.budgetMax)) {
      Alert.alert('Error', 'Minimum budget cannot exceed maximum budget');
      return;
    }
    setLoading(true);
    try {
      await api.post('/gigs', {
        ...data,
        userId: user.id,
        budgetMin: Number(data.budgetMin),
        budgetMax: Number(data.budgetMax),
        requiredSkills: data.requiredSkills.split(',').map(s => s.trim()).filter(s => s),
        status: 'open',
        paymentStatus: 'pending',
      });
      Alert.alert('Success', 'Gig posted successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Post a New Gig</Text>
        
        <Controller control={control} name="title" render={({ field: { onChange, value } }) => (
          <View style={styles.inputContainer}><Text style={styles.label}>Project Title *</Text><TextInput style={[styles.input, errors.title && styles.inputError]} placeholder="e.g., Build a Food Delivery App" value={value} onChangeText={onChange} /></View>
        )} />
        {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

        <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
          <View style={styles.inputContainer}><Text style={styles.label}>Description *</Text><TextInput style={[styles.input, styles.textArea, errors.description && styles.inputError]} placeholder="Describe the project requirements..." value={value} onChangeText={onChange} multiline numberOfLines={4} textAlignVertical="top" /></View>
        )} />
        {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

        <Text style={styles.label}>Category *</Text>
        <View style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]} 
              onPress={() => setValue('category', cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}

        <View style={styles.budgetRow}>
          <View style={styles.budgetField}>
            <Text style={styles.label}>Min Budget (M)</Text>
            <Controller control={control} name="budgetMin" render={({ field: { onChange, value } }) => (<TextInput style={[styles.input, errors.budgetMin && styles.inputError]} placeholder="5000" value={value} onChangeText={onChange} keyboardType="numeric" />)} />
            {errors.budgetMin && <Text style={styles.errorText}>{errors.budgetMin.message}</Text>}
          </View>
          <View style={styles.budgetField}>
            <Text style={styles.label}>Max Budget (M)</Text>
            <Controller control={control} name="budgetMax" render={({ field: { onChange, value } }) => (<TextInput style={[styles.input, errors.budgetMax && styles.inputError]} placeholder="10000" value={value} onChangeText={onChange} keyboardType="numeric" />)} />
            {errors.budgetMax && <Text style={styles.errorText}>{errors.budgetMax.message}</Text>}
          </View>
        </View>

        <Controller control={control} name="deadline" render={({ field: { onChange, value } }) => (
          <View style={styles.inputContainer}><Text style={styles.label}>Deadline *</Text><TextInput style={[styles.input, errors.deadline && styles.inputError]} placeholder="e.g., 30 Days" value={value} onChangeText={onChange} /></View>
        )} />
        {errors.deadline && <Text style={styles.errorText}>{errors.deadline.message}</Text>}

        <Controller control={control} name="requiredSkills" render={({ field: { onChange, value } }) => (
          <View style={styles.inputContainer}><Text style={styles.label}>Required Skills *</Text><TextInput style={[styles.input, errors.requiredSkills && styles.inputError]} placeholder="React Native, Firebase, Node.js" value={value} onChangeText={onChange} /></View>
        )} />
        {errors.requiredSkills && <Text style={styles.errorText}>{errors.requiredSkills.message}</Text>}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Post Gig</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 14, fontSize: 14, backgroundColor: '#F9F9F9' },
  inputError: { borderColor: '#FF3B30' },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4, marginBottom: 12 },
  categoryScroll: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5EA' },
  categoryChipActive: { backgroundColor: '#0052FF', borderColor: '#0052FF' },
  categoryText: { fontSize: 12, color: '#666' },
  categoryTextActive: { color: '#fff' },
  budgetRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  budgetField: { flex: 1 },
  submitButton: { backgroundColor: '#0052FF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});