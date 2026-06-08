import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useNavigation } from '@react-navigation/native';

const SKILL_FILTERS = ['React Native', 'Node.js', 'Firebase', 'UI/UX', 'Web Development', 'Mobile App'];

export default function SearchScreen() {
  const [gigs, setGigs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const navigation = useNavigation();

  const fetchGigs = useCallback(async () => {
    try {
      const res = await api.get('/gigs');
      const open = (res.data.gigs || []).filter(g => g.status === 'open');
      setGigs(open);
      setFiltered(open);
    } catch { setGigs([]); setFiltered([]); } finally { setLoading(false); }
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

  const applyFilters = useCallback(() => {
    let result = gigs;
    if (keyword) {
      result = result.filter(g =>
        g.title?.toLowerCase().includes(keyword.toLowerCase()) ||
        g.description?.toLowerCase().includes(keyword.toLowerCase()) ||
        g.category?.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    if (selectedSkill) {
      result = result.filter(g => {
        const skills = g.requiredSkills || [];
        return skills.some(s => s.toLowerCase().includes(selectedSkill.toLowerCase()));
      });
    }
    setFiltered(result);
  }, [gigs, keyword, selectedSkill]);

  React.useEffect(() => { applyFilters(); }, [applyFilters]);

  const clearFilters = () => { setKeyword(''); setSelectedSkill(null); };

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
        <Text style={styles.header}>Search Gigs</Text>
        <Text style={styles.subheader}>Filter by skill or keyword</Text>
      </View>

      <View style={styles.controls}>
        <TextInput style={styles.searchInput} placeholder="Search gigs..." value={keyword} onChangeText={setKeyword} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillsScroll}>
          <TouchableOpacity style={[styles.skillBtn, !selectedSkill && styles.skillBtnActive]} onPress={() => setSelectedSkill(null)}>
            <Text style={[styles.skillTxt, !selectedSkill && styles.skillTxtActive]}>All</Text>
          </TouchableOpacity>
          {SKILL_FILTERS.map(skill => (
            <TouchableOpacity key={skill} style={[styles.skillBtn, selectedSkill === skill && styles.skillBtnActive]} onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}>
              <Text style={[styles.skillTxt, selectedSkill === skill && styles.skillTxtActive]}>{skill}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {(keyword || selectedSkill) && (
        <View style={styles.filterBar}>
          <Text style={styles.filterText}>
            {selectedSkill && `Skill: ${selectedSkill}`}
            {selectedSkill && keyword && ' • '}
            {keyword && `Search: "${keyword}"`}
          </Text>
          <TouchableOpacity onPress={clearFilters}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>
        </View>
      )}

      <Text style={styles.results}>Found: {filtered.length} gigs</Text>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No gigs match your filters</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or skill filter</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerContainer: { backgroundColor: '#fff', padding: 20, paddingTop: 30, borderBottomWidth: 1, borderBottomColor: '#eee' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  subheader: { fontSize: 14, color: '#666' },
  
  controls: { padding: 16, paddingBottom: 0 },
  searchInput: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 12, fontSize: 14, borderWidth: 1, borderColor: '#E5E5EA' },
  skillsScroll: { marginBottom: 16 },
  
  skillBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E5EA', marginRight: 10 },
  skillBtnActive: { backgroundColor: '#0052FF', borderColor: '#0052FF' },
  skillTxt: { fontSize: 13, color: '#666', fontWeight: '500' },
  skillTxtActive: { color: '#fff', fontWeight: '600' },
  
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F0FE', padding: 10, borderRadius: 8, marginHorizontal: 16, marginBottom: 12 },
  filterText: { fontSize: 13, color: '#0052FF', flex: 1 },
  clearText: { fontSize: 13, color: '#0052FF', fontWeight: '600' },
  
  results: { fontSize: 14, color: '#666', marginHorizontal: 16, marginBottom: 8 },
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