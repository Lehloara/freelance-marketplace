import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function ClientProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); } }
    ]);
  };

  if (!user) return <View style={styles.center}><Text>Loading...</Text></View>;

  const fields = [
    { l: 'Full Name', v: user.fullName },
    { l: 'Email', v: user.email },
    { l: 'Role', v: user.role },
    { l: 'Joined', v: new Date(user.createdAt).toLocaleDateString() },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.letter}>{(user.fullName || 'C').charAt(0)}</Text></View>
        <Text style={styles.name}>{user.fullName}</Text>
      </View>
      <View style={styles.list}>
        {fields.map((f, i) => (
          <View key={i} style={styles.row}><Text style={styles.lbl}>{f.l}</Text><Text style={styles.val}>{f.v}</Text></View>
        ))}
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleLogout}><Text style={styles.btxt}>Logout</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 32, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0052FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  letter: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold' },
  list: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  lbl: { fontSize: 14, color: '#666' },
  val: { fontSize: 14, fontWeight: '600', color: '#333' },
  btn: { margin: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF3B30', padding: 16, borderRadius: 12, alignItems: 'center' },
  btxt: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});