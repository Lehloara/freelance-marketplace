import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Button({ title, onPress, loading, variant = 'primary', style }) {
  return (
    <TouchableOpacity style={[styles.btn, styles[variant], style]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#007AFF' },
  secondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF' },
  danger: { backgroundColor: '#ff4444' },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
});