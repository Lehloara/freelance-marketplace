import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/client';

const schema = z.object({
  proposal: z.string().min(10, 'Cover letter too short'),
  bidAmount: z.string().min(1, 'Enter bid amount'),
  timeline: z.string().min(2, 'Enter delivery timeline'),
});

export default function ProposalScreen({ route, navigation }) {
  const { gigId, budgetMax } = route.params || {};
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { proposal: '', bidAmount: '', timeline: '' } });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/proposals', {
        gigId,
        proposal: data.proposal,
        bidAmount: Number(data.bidAmount),
        timeline: data.timeline,
      });
      Alert.alert('Success', 'Proposal submitted! You will be notified when the client responds.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit proposal');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Submit Proposal</Text>
      <Text style={styles.subtitle}>Budget Cap: M{budgetMax || 'Unlimited'}</Text>
      
      <Text style={styles.label}>Cover Letter *</Text>
      <Controller control={control} name="proposal" render={({ field: { onChange, value } }) => (
        <TextInput style={styles.textArea} placeholder="Explain why you are the best fit..." value={value} onChangeText={onChange} multiline numberOfLines={5} textAlignVertical="top" />
      )} />
      {errors.proposal && <Text style={styles.error}>{errors.proposal.message}</Text>}
      
      <Text style={styles.label}>Bid Amount (M) *</Text>
      <Controller control={control} name="bidAmount" render={({ field: { onChange, value } }) => (
        <TextInput style={styles.input} placeholder="3000" value={value} onChangeText={onChange} keyboardType="numeric" />
      )} />
      {errors.bidAmount && <Text style={styles.error}>{errors.bidAmount.message}</Text>}
      
      <Text style={styles.label}>Delivery Time *</Text>
      <Controller control={control} name="timeline" render={({ field: { onChange, value } }) => (
        <TextInput style={styles.input} placeholder="e.g. 7 days" value={value} onChangeText={onChange} />
      )} />
      {errors.timeline && <Text style={styles.error}>{errors.timeline.message}</Text>}
      
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit(onSubmit)} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Proposal</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#0052FF', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 6 },
  textArea: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, padding: 14, fontSize: 14, backgroundColor: '#F9F9F9', minHeight: 100, textAlignVertical: 'top' },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, padding: 14, fontSize: 14, backgroundColor: '#F9F9F9' },
  error: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
  btn: { backgroundColor: '#0052FF', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});