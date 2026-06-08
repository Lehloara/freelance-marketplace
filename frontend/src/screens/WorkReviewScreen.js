import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import api from '../api/client';

export default function WorkReviewScreen() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState(null);
  const [selectedGigId, setSelectedGigId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useFocusEffect(useCallback(() => { fetch(); return () => {}; }, []));

   const fetch = async () => {
    try {
      const res = await api.get('/client/reviews/pending');
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error('Fetch reviews error:', err);
      setSubmissions([]);
    } finally { 
      setLoading(false); 
    }
  };

  const handleApprove = (item) => {
    setSelectedId(item.id);
    setSelectedFreelancerId(item.freelancerId);
    setSelectedGigId(item.gigId);
    setRating(5);
    setComment('');
    setModalVisible(true);
  };

  const submitRatingAndApprove = async () => {
    try {
      await api.post('/ratings', {
        freelancerId: selectedFreelancerId,
        gigId: selectedGigId,
        score: rating,
        comment
      });
      await api.post('/submissions/review', { proposalId: selectedId, action: 'approve', feedback: comment || 'Approved' });
      Alert.alert('Success', 'Work approved & rating submitted');
      setModalVisible(false);
      fetch();
    } catch (err) { Alert.alert('Error', err.message || 'Failed'); }
  };

  const handleReject = async (id) => {
    Alert.alert('Request Changes', 'Send back for revisions?', [
      { text: 'Cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await api.post('/submissions/review', { proposalId: id, action: 'revision_requested', feedback: 'Needs revision' });
          Alert.alert('Sent back', 'Freelancer notified');
          fetch();
        } catch (err) { Alert.alert('Error', err.message); }
      }}
    ]);
  };

  const render = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.gigTitle}</Text>
      <Text style={styles.meta}>Freelancer: {item.freelancerName}</Text>
      <Text style={styles.desc}>{item.description || 'No notes'}</Text>
      <Text style={styles.amount}>Escrow: M{item.bidAmount}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.green]} onPress={() => handleApprove(item)}><Text style={styles.btxt}> Approve & Rate</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.red]} onPress={() => handleReject(item.id)}><Text style={styles.btxt}> Changes</Text></TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0052FF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Reviews</Text>
      {submissions.length === 0 ? <Text style={styles.empty}>No submissions pending</Text> : <FlatList data={submissions} renderItem={render} keyExtractor={i => i.id} contentContainerStyle={styles.list} />}
      
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rate Freelancer</Text>
            <View style={styles.stars}>
              {[1,2,3,4,5].map(num => (
                <TouchableOpacity key={num} onPress={() => setRating(num)}>
                  <Text style={styles.star}>{num <= rating ? '★' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>{rating}/5 Stars</Text>
            <TextInput style={styles.commentInput} placeholder="Optional feedback..." value={comment} onChangeText={setComment} multiline />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitRatingAndApprove}><Text style={styles.submitTxt}>Submit Rating</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 }, list: { paddingBottom: 20 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 }, meta: { fontSize: 13, color: '#0052FF', marginBottom: 6 }, desc: { fontSize: 14, color: '#555', marginBottom: 8, lineHeight: 20 }, amount: { fontSize: 15, fontWeight: '700', color: '#0052FF', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 }, btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' }, green: { backgroundColor: '#1eff00' }, red: { backgroundColor: '#310ff5', borderWidth: 1, borderColor: '#FF3B30' }, btxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', width: '85%', padding: 24, borderRadius: 16, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 }, stars: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  star: { fontSize: 32, color: '#FFB800' }, ratingText: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  commentInput: { width: '100%', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#F9F9F9', marginBottom: 16, minHeight: 60, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', width: '100%', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#e90c0c', alignItems: 'center' }, cancelTxt: { fontSize: 15, fontWeight: '600', color: '#333' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#0052FF', alignItems: 'center' }, submitTxt: { fontSize: 15, fontWeight: '600', color: '#fff' },
});