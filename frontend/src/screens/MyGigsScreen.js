import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function MyGigsScreen({ navigation }) {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useFocusEffect(useCallback(() => { fetchGigs(); return () => {}; }, []));

  const fetchGigs = async () => {
    try {
      const res = await api.get('/client/gigs');
      setGigs(res.data.gigs || []);
    } catch { setGigs([]); } finally { setLoading(false); }
  };

  const handleDelete = async (id, title) => {
    Alert.alert('Delete Gig', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/gigs/${id}`);
          Alert.alert('Success', 'Gig deleted');
          fetchGigs();
        } catch (err) { Alert.alert('Error', err.message || 'Failed to delete'); }
      }}
    ]);
  };

  const statusStyle = (s) => s === 'open' ? { bg: '#DCFCE7', c: '#166534', t: 'Open' } : s === 'in_progress' ? { bg: '#FFE5CC', c: '#CC5500', t: 'In Progress' } : s === 'work_submitted' ? { bg: '#E0E7FF', c: '#3730A3', t: 'Work Submitted' } : { bg: '#D4EDDA', c: '#155724', t: 'Completed' };

  const render = ({ item }) => {
    const st = statusStyle(item.status);
    return (
      <View style={styles.card}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('ClientGigDetail', { gigId: item.id })}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.budget}>M{item.budgetMin} - M{item.budgetMax}</Text>
          <View style={[styles.badge, { backgroundColor: st.bg }]}><Text style={[styles.badgeTxt, { color: st.c }]}>{st.t}</Text></View>
          <Text style={styles.date}>Deadline: {item.deadline || 'Flexible'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.title)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0052FF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Gigs</Text>
      {gigs.length === 0 ? <Text style={styles.empty}>No gigs posted yet</Text> : <FlatList data={gigs} renderItem={render} keyExtractor={i => i.id} contentContainerStyle={styles.list} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1A1A1A' },
  list: { paddingBottom: 20 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  budget: { fontSize: 14, color: '#0052FF', fontWeight: '600', marginBottom: 6 },
  badge: { padding: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  badgeTxt: { fontSize: 12, fontWeight: '700' },
  date: { fontSize: 12, color: '#888' },
  deleteBtn: { marginLeft: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF0F0', borderRadius: 8, borderWidth: 1, borderColor: '#FF3B30' },
  deleteText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 16 },
});