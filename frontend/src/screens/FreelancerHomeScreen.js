import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function FreelancerHomeScreen({ navigation }) {
  const [stats, setStats] = useState({ available: 0, active: 0, completed: 0 });
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
      const gigsRes = await api.get('/gigs');
      const allGigs = gigsRes.data.gigs || [];
      const available = allGigs.filter(g => g.status === 'open').length;

      const projectsRes = await api.get('/freelancer/projects');
      const myProjects = projectsRes.data.projects || [];
      const active = myProjects.filter(p => ['hired', 'work_submitted', 'revision_requested'].includes(p.status)).length;
      const completed = myProjects.filter(p => p.status === 'completed').length;

      setStats({ available, active, completed });
    } catch (err) {
      console.warn('Stats fetch failed', err);
      setStats({ available: 0, active: 0, completed: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user.fullName?.split(' ')[0] || 'Freelancer'}!</Text>
        <Text style={styles.subtitle}>Find your next project</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.available}</Text>
            <Text style={styles.statLabel}>Available Gigs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Browse')}>
          <Text style={styles.browseBtnText}> Browse Available Gigs</Text>
        </TouchableOpacity>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Search')}>
            <Text style={styles.quickText}>Search by Skill</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Projects')}>
            <Text style={styles.quickText}>My Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.quickIcon}></Text>
            <Text style={styles.quickText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0052FF' },
  header: { backgroundColor: '#0052FF', padding: 24, paddingBottom: 40 },
  welcome: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  content: { padding: 20, marginTop: -20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { backgroundColor: '#fff', flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#0052FF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  browseBtn: { backgroundColor: '#0052FF', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 24, shadowColor: '#0052FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  browseBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  quickSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
  quickItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  quickIcon: { fontSize: 20, marginRight: 16 },
  quickText: { fontSize: 16, color: '#333' },
});