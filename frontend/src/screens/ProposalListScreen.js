import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function ProposalListScreen({ route, navigation }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const gigId = route.params?.gigId;

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      if (gigId) {
        const response = await api.get(`/gigs/${gigId}/proposals`);
        const props = response.data.proposals || [];
        const gigRes = await api.get(`/gigs/${gigId}`);
        const gig = gigRes.data.gig || gigRes.data;
        const enriched = props.map(p => ({ ...p, gigTitle: gig?.title, gigId }));
        setProposals(enriched);
      } else {
        const gigsRes = await api.get('/gigs');
        const myGigs = gigsRes.data.gigs?.filter(g => g.userId === user?.id) || [];
        const myGigIds = myGigs.map(g => g.id);
        if (myGigIds.length === 0) {
          setProposals([]);
          return;
        }
        const allProposals = [];
        for (const id of myGigIds) {
          try {
            const res = await api.get(`/gigs/${id}/proposals`);
            const props = res.data.proposals || [];
            const gig = myGigs.find(g => g.id === id);
            props.forEach(p => {
              allProposals.push({ ...p, gigTitle: gig?.title, gigId: id, gigStatus: gig?.status });
            });
          } catch (e) {}
        }
        setProposals(allProposals);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    } finally {
      setLoading(false);
    }
  }, [gigId, user]);

  useFocusEffect(
    useCallback(() => { 
      if (user) fetchProposals(); 
      return () => {};
    }, [fetchProposals, user])
  );

  const handleHire = async (proposal) => {
    Alert.alert('Hire Freelancer', `Hire ${proposal.freelancerName} for M${proposal.bidAmount}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await api.post(`/proposals/hire`, { proposalId: proposal.id });
            Alert.alert('Success', 'Freelancer hired! Proceed to payment.', [
              { 
                text: 'OK', 
                onPress: () => {
                  navigation.navigate('Payment', { 
                    gigId: proposal.gigId, 
                    amount: proposal.bidAmount, 
                    freelancerId: proposal.freelancerId 
                  });
                } 
              }
            ]);
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to hire freelancer');
          }
        }
      }
    ]);
  };

  const renderProposal = ({ item }) => (
    <View style={styles.card}>
      {item.gigTitle && !gigId && (
        <View style={styles.gigHeader}>
          <Text style={styles.gigTitle}>{item.gigTitle}</Text>
          {item.gigStatus && (
            <Text style={[styles.statusBadge, item.gigStatus === 'open' && styles.statusOpen]}>
              {item.gigStatus}
            </Text>
          )}
        </View>
      )}
      <View style={styles.cardHeader}>
        <Text style={styles.freelancerName}>{item.freelancerName}</Text>
        <Text style={styles.bid}>M{item.bidAmount}</Text>
      </View>
      <Text style={styles.experience}>Experience: {item.freelancerExperience || 'N/A'}</Text>
      <Text style={styles.skills}>Skills: {item.freelancerSkills?.join(', ') || 'N/A'}</Text>
      <Text style={styles.proposalText} numberOfLines={3}>{item.proposal}</Text>
      <Text style={styles.timeline}>Timeline: {item.timeline}</Text>
      <TouchableOpacity 
        style={[styles.hireButton, item.gigStatus !== 'open' && styles.hireButtonDisabled]} 
        onPress={() => item.gigStatus === 'open' && handleHire(item)}
        disabled={item.gigStatus !== 'open'}
      >
        <Text style={styles.hireButtonText}>
          {item.gigStatus === 'open' ? 'Hire Freelancer' : 'Gig Closed'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0052FF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{gigId ? 'Proposals for This Gig' : 'All Proposals'}</Text>
      {proposals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>{gigId ? 'No proposals yet for this gig' : 'No proposals for your posted gigs'}</Text>
          {!gigId && (
            <TouchableOpacity style={styles.postButton} onPress={() => navigation.navigate('Post Gig')}>
              <Text style={styles.postButtonText}>+ Post a New Gig</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList data={proposals} renderItem={renderProposal} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1A1A1A' },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  gigHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  gigTitle: { fontSize: 14, fontWeight: '600', color: '#0052FF', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  statusOpen: { backgroundColor: '#DCFCE7', color: '#166534' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  freelancerName: { fontSize: 16, fontWeight: '600', flex: 1 },
  bid: { fontSize: 16, color: '#0052FF', fontWeight: '700' },
  experience: { fontSize: 13, color: '#666', marginBottom: 4 },
  skills: { fontSize: 13, color: '#666', marginBottom: 8 },
  proposalText: { fontSize: 14, color: '#333', marginBottom: 8 },
  timeline: { fontSize: 13, color: '#666', marginBottom: 12 },
  hireButton: { backgroundColor: '#0052FF', padding: 12, borderRadius: 8, alignItems: 'center' },
  hireButtonDisabled: { backgroundColor: '#E5E5EA' },
  hireButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  empty: { textAlign: 'center', color: '#888', fontSize: 15, marginBottom: 20 },
  postButton: { backgroundColor: '#0052FF', padding: 14, borderRadius: 12 },
  postButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});