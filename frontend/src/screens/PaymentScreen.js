import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import api from '../api/client';

const PAYMENT_METHODS = [
  { id: 'mpesa', name: 'M-Pesa', icon: '📱' },
  { id: 'ecocash', name: 'EcoCash', icon: '📱' },
  { id: 'fnb', name: 'FNB Lesotho', icon: '💳' },
  { id: 'nedbank', name: 'Nedbank Lesotho', icon: '💳' },
  { id: 'standard_bank', name: 'Standard Lesotho Bank', icon: '💳' },
  { id: 'postbank', name: 'PostBank', icon: '💳' },
];

export default function PaymentScreen({ route, navigation }) {
  const { gigId, amount, freelancerId } = route.params;
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }
    setLoading(true);
    try {
      await api.post('/payments/initiate', { gigId, amount, paymentMethod: selectedMethod, freelancerId });
      Alert.alert('Payment Secured', `M${amount} is held in escrow. Freelancer notified.`, [
        { text: 'OK', onPress: () => navigation.navigate('WorkReview') }
      ]);
    } catch (error) {
      Alert.alert('Payment Failed', error.response?.data?.message || 'Could not process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Secure Escrow Payment</Text>
      <Text style={styles.amount}>M{amount.toFixed(2)}</Text>

      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.methodsGrid}>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity key={method.id} style={[styles.methodCard, selectedMethod === method.id && styles.methodCardActive]} onPress={() => setSelectedMethod(method.id)}>
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <Text style={[styles.methodName, selectedMethod === method.id && styles.methodNameActive]}>{method.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.payButton} onPress={handlePayment} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Pay & Hold in Escrow</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  amount: { fontSize: 36, fontWeight: 'bold', color: '#0052FF', marginBottom: 32, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  methodCard: { width: '48%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', backgroundColor: '#F9F9F9', alignItems: 'center' },
  methodCardActive: { borderColor: '#0052FF', backgroundColor: '#E8F0FE' },
  methodIcon: { fontSize: 24, marginBottom: 8 },
  methodName: { fontSize: 13, fontWeight: '600', color: '#333' },
  methodNameActive: { color: '#0052FF' },
  payButton: { backgroundColor: '#0052FF', padding: 18, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});