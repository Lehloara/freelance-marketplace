import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useNavigation } from '@react-navigation/native';

export default function GigListScreen() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchGigs = useCallback(async () => {
    try {
      const res = await api.get('/gigs');
      setGigs(res.data.gigs || []);
    } catch { setGigs([]); } finally { setLoading(false); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGigs();
      return () => {};
    }, [fetchGigs])
  );

  const getDeadlineDisplay = (gig) => {
    const raw = gig.deadline || gig.dueDate || gig.timeline;
    if (!raw) return 'Flexible';
    const date = new Date(raw);
    return isNaN(date.getTime()) ? raw : date.toLocaleDateString();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('FreelancerGigDetail', { gigId: item.id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>Open</Text></View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.budget}>M{item.budgetMin} - M{item.budgetMax}</Text>
      <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Category</Text>
          <Text style={styles.footerValue}>{item.category || 'General'}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Deadline</Text>
          <Text style={styles.footerValue}>{getDeadlineDisplay(item)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0052FF" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Available Gigs</Text>
        <Text style={styles.subheader}>Browse projects that match your skills</Text>
      </View>
      {gigs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}></Text>
          <Text style={styles.emptyText}>No open gigs available</Text>
          <Text style={styles.emptySubtext}>Check back later or refine your search</Text>
        </View>
      ) : (
        <FlatList data={gigs} renderItem={renderItem} keyExtractor={i => i.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  subheader: { fontSize: 14, color: '#666' },
  list: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', flex: 1, marginRight: 8 },
  badge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#166534', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  budget: { fontSize: 15, color: '#0052FF', fontWeight: '700', marginBottom: 8 },
  desc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerItem: { flex: 1 },
  footerLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  footerValue: { fontSize: 12, color: '#333', fontWeight: '500' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center' },
});