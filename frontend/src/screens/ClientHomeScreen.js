import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function ClientHomeScreen({ navigation }) {
  const [stats, setStats] = useState({ open: 0, in_progress: 0, work_submitted: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      if (user) fetchStats();
      return () => {};
    }, [user])
  );

  const fetchStats = async () => {
    try {
      const response = await api.get('/client/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Stats fetch error:', error);
      setStats({ open: 0, in_progress: 0, work_submitted: 0, completed: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0052FF" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user.fullName?.split(' ')[0] || 'Client'}!</Text>
        <Text style={styles.subtitle}>Manage your projects</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.open}</Text>
          <Text style={styles.statLabel}>Posted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.in_progress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.work_submitted}</Text>
          <Text style={styles.statLabel}>Pending Review</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('Post Gig')}>
        <Text style={styles.createButtonText}>+ Create New Gig</Text>
      </TouchableOpacity>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Home', { screen: 'MyGigs' })}>
          <Text style={styles.actionIcon}></Text>
          <Text style={styles.actionText}>View All My Gigs</Text>
        </TouchableOpacity>
      
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#0052FF', padding: 24, paddingBottom: 32 },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  statValue: { fontSize: 26, fontWeight: 'bold', color: '#0052FF' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
  createButton: { margin: 16, backgroundColor: '#0052FF', padding: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#0052FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  createButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  section: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionText: { fontSize: 15, color: '#333' },
});