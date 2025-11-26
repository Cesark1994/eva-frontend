import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function VoiceButton({ isRecording, onPress, disabled, loading }) {
  const label = isRecording ? 'Detener' : 'Hablar con Eva';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.button, isRecording && styles.buttonActive, (disabled || loading) && styles.buttonDisabled]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator color="#0B1221" /> : <View style={[styles.dot, isRecording && styles.dotActive]} />}
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#66E3FF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    width: '100%',
  },
  buttonActive: {
    backgroundColor: '#FF9F66',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    color: '#0B1221',
    fontSize: 16,
    fontWeight: '700',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0B1221',
  },
  dotActive: {
    backgroundColor: '#FFF',
  },
});
