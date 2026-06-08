import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function MyProjectsScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/freelancer/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
      return () => {};
    }, [fetchProjects])
  );

  const getStatusConfig = (item) => {
    if (item.gigDeleted) return { bg: '#F3F4F6', color: '#6B7280', label: ' Gig Deleted', canSubmit: false };
    const map = {
      pending: { bg: '#FFF3CD', color: '#856404', label: ' Proposal Pending', canSubmit: false },
      hired: { bg: '#D1ECF1', color: '#0C5460', label: ' Hired - Ready to Work', canSubmit: true },
      work_submitted: { bg: '#FFE5CC', color: '#CC5500', label: ' Awaiting Review', canSubmit: false },
      revision_requested: { bg: '#F8D7DA', color: '#842029', label: '↺ Changes Requested', canSubmit: true },
      completed: { bg: '#D4EDDA', color: '#155724', label: ' Completed & Paid', canSubmit: false },
      cancelled: { bg: '#F3F4F6', color: '#6B7280', label: ' Cancelled', canSubmit: false },
    };
    return map[item.status] || map.pending;
  };

  const renderItem = ({ item }) => {
    const status = getStatusConfig(item);
    const isDeleted = item.gigDeleted;
    const canNavigate = status.canSubmit && item.id && item.gigId && !isDeleted;
    
    return (
      <View style={[styles.card, isDeleted && styles.cardDisabled]}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{item.gigTitle}</Text>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Budget:</Text>
          <Text style={styles.infoValue}>M{item.budgetMin} - M{item.budgetMax}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Your Bid:</Text>
          <Text style={styles.infoValue}>M{item.bidAmount || 'N/A'}</Text>
        </View>
        
        {item.workSubmittedAt && !isDeleted && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Submitted:</Text>
            <Text style={styles.infoValue}>{new Date(item.workSubmittedAt).toLocaleDateString()}</Text>
          </View>
        )}
        
        {isDeleted ? (
          <View style={styles.deletedActions}>
            <Text style={styles.cancelNote}>This project was permanently deleted by the client.</Text>
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveProject(item.id)}>
              <Text style={styles.removeBtnText}>️ Remove from List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          status.canSubmit && (
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => navigation.navigate('UploadWork', {
                proposalId: item.id,
                gigId: item.gigId,
                gigTitle: item.gigTitle,
                isRevision: item.status === 'revision_requested',
              })}
            >
              <Text style={styles.actionBtnText}>
                {item.status === 'revision_requested' ? ' Submit Revisions' : ' Submit Work'}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    );
  };

  const handleRemoveProject = async (id) => {
    Alert.alert('Remove Project', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/proposals/${id}`);
          setProjects(prev => prev.filter(p => p.id !== id));
          Alert.alert('Success', 'Removed');
        } catch (err) { Alert.alert('Error', err.message); }
      }}
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0052FF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.screenHeader}>My Projects</Text>
      {projects.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No projects yet</Text>
          <Text style={styles.emptySubtext}>Submit proposals to get hired</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Browse')}>
            <Text style={styles.browseButtonText}>Browse Gigs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={projects} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenHeader: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  cardDisabled: { opacity: 0.6, backgroundColor: '#FAFAFA' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: '#666' },
  infoValue: { fontSize: 13, color: '#333', fontWeight: '500' },
  actionBtn: { backgroundColor: '#0052FF', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deletedActions: { marginTop: 12, alignItems: 'center' },
  cancelNote: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginBottom: 8, textAlign: 'center' },
  removeBtn: { backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FF3B30', padding: 10, borderRadius: 8 },
  removeBtnText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  browseButton: { backgroundColor: '#0052FF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});