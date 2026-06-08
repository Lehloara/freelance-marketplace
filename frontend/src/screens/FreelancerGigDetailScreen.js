import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function FreelancerGigDetailScreen({ route, navigation }) {
  const [gig, setGig] = useState(null);
  const [proposalsCount, setProposalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const gigId = route.params?.gigId;

  const fetchGig = useCallback(async () => {
    if (!gigId) return;
    setLoading(true);
    try {
      const gigRes = await api.get(`/gigs/${gigId}`);
      const gigData = gigRes.data.gig || gigRes.data;
      let clientInfo = { fullName: 'Anonymous Client', avatarUrl: '', rating: 'N/A', completedProjects: 0 };
      if (gigData.userId && gigData.userId !== user?.id) {
        try {
          const userRes = await api.get(`/users/${gigData.userId}/profile`);
          const userData = userRes.data.profile || userRes.data;
          clientInfo = {
            fullName: userData.fullName || 'Anonymous Client',
            avatarUrl: userData.profileImage || '',
            rating: userData.rating || 'N/A',
            completedProjects: userData.completedProjects || 0,
          };
        } catch (e) {}
      }
      setGig({ ...gigData, clientInfo });
      try {
        const propRes = await api.get(`/gigs/${gigId}/proposals`);
        setProposalsCount(propRes.data.proposals?.length || 0);
      } catch (e) { setProposalsCount(0); }
    } catch (error) {
      console.error('Failed to load gig:', error);
      Alert.alert('Error', 'Could not load gig details');
      navigation.goBack();
    } finally { setLoading(false); }
  }, [gigId, navigation, user?.id]);

  useFocusEffect(
    useCallback(() => { fetchGig(); return () => {}; }, [fetchGig])
  );

  if (!gigId) {
    return (<View style={styles.center}><Text>No gig selected</Text><TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>Go Back</Text></TouchableOpacity></View>);
  }
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0052FF" /></View>;
  if (!gig) {
    return (<View style={styles.center}><Text>Gig not found</Text><TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>Go Back</Text></TouchableOpacity></View>);
  }

  const isOwnGig = gig.userId === user?.id;
  const statusStyle = gig.status === 'open' ? { bg: '#DCFCE7', c: '#166534', t: 'Open' } : gig.status === 'in_progress' ? { bg: '#FFE5CC', c: '#CC5500', t: 'In Progress' } : gig.status === 'work_submitted' ? { bg: '#E0E7FF', c: '#3730A3', t: 'Work Submitted' } : { bg: '#D4EDDA', c: '#155724', t: 'Completed' };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.clientCard}>
        <View style={styles.clientAvatar}>
          {gig.clientInfo?.avatarUrl ? (<Image source={{ uri: gig.clientInfo.avatarUrl }} style={styles.avatarImage} />) : (<Text style={styles.avatarInitial}>{(gig.clientInfo?.fullName || 'A').charAt(0).toUpperCase()}</Text>)}
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{gig.clientInfo?.fullName || 'Anonymous Client'}</Text>
          <View style={styles.clientStats}>
            <Text style={styles.clientStat}>★ {gig.clientInfo?.rating}</Text>
            <Text style={styles.clientStat}>•</Text>
            <Text style={styles.clientStat}>{gig.clientInfo?.completedProjects} Projects</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.header}>
        <Text style={styles.title}>{gig.title || 'Untitled Gig'}</Text>
        <Text style={styles.budget}>Budget: M{gig.budgetMin} - M{gig.budgetMax}</Text>
        <Text style={styles.deadline}>Deadline: {gig.deadline || 'Not specified'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}><Text style={[styles.statusBadgeText, { color: statusStyle.c }]}>{statusStyle.t}</Text></View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{gig.description || 'No description provided'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{gig.category || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Proposals:</Text>
          <Text style={styles.proposalsCount}>{proposalsCount} received</Text>
        </View>
      </View>
      
      {gig.requiredSkills?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Skills</Text>
          <View style={styles.skillsContainer}>
            {gig.requiredSkills.map((skill, index) => (<Text key={index} style={styles.skillChip}>{skill}</Text>))}
          </View>
        </View>
      )}
      
      {!isOwnGig && gig.status === 'open' && (
        <TouchableOpacity style={styles.proposalButton} onPress={() => navigation.navigate('SubmitProposal', { gigId, budgetMax: gig.budgetMax })}>
          <Text style={styles.proposalButtonText}>Submit Proposal</Text>
        </TouchableOpacity>
      )}
      
      {isOwnGig && (
        <TouchableOpacity 
          style={styles.proposalsButton} 
          onPress={() => navigation.navigate('Proposals', { 
            screen: 'ProposalList', 
            params: { gigId } 
          })}
          disabled={proposalsCount === 0}
        >
          <Text style={styles.proposalsButtonText}>View Proposals ({proposalsCount})</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>← Back</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, margin: 16, marginTop: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  clientAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#0052FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  avatarInitial: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  clientStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clientStat: { fontSize: 13, color: '#666' },
  header: { backgroundColor: '#fff', padding: 20, margin: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  budget: { fontSize: 16, color: '#0052FF', fontWeight: '600', marginBottom: 4 },
  deadline: { fontSize: 14, color: '#666', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  description: { fontSize: 14, color: '#666', lineHeight: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  proposalsCount: { color: '#0052FF', fontWeight: '700' },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: '#e6f2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, fontSize: 12, color: '#0052FF' },
  proposalButton: { margin: 16, backgroundColor: '#0052FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  proposalButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  proposalsButton: { margin: 16, backgroundColor: '#0052FF', padding: 16, borderRadius: 12, alignItems: 'center' },
  proposalsButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backButton: { margin: 16, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E5EA' },
  backButtonText: { color: '#0052FF', fontSize: 15, fontWeight: '600' },
});