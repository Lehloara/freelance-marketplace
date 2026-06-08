import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';

export default function Input({ label, error, ...props }) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput style={[styles.input, error && styles.inputError]} {...props} />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 14, borderRadius: 8, backgroundColor: '#fff', fontSize: 14 },
  inputError: { borderColor: '#ff4444' },
  errorText: { color: '#ff4444', fontSize: 12, marginTop: 4 },
});