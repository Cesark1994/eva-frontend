import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function VoiceButton({ isRecording, onPress, disabled, loading }) {
  const label = isRecording ? 'Detener grabación' : 'Hablar con Eva';
  const helper = isRecording ? 'Toca para finalizar y escuchar la respuesta' : 'Eva te escucha con un toque';

  return (
    <View style={styles.wrapper}>
      {isRecording && <View style={styles.ring} />}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[styles.button, isRecording && styles.buttonActive, (disabled || loading) && styles.buttonDisabled]}
      >
        <View style={styles.content}>
          <View style={[styles.indicator, isRecording && styles.indicatorActive]}>
            {loading ? <ActivityIndicator color="#070F1E" /> : <View style={styles.innerDot} />}
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.helper}>{helper}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  ring: {
    position: 'absolute',
    width: '92%',
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 159, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 102, 0.35)',
  },
  button: {
    backgroundColor: '#66E3FF',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
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
    gap: 12,
  },
  indicator: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(7, 15, 30, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(7, 15, 30, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorActive: {
    backgroundColor: 'rgba(7, 15, 30, 0.25)',
    borderColor: 'rgba(7, 15, 30, 0.45)',
  },
  innerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#070F1E',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: '#0B1221',
    fontSize: 17,
    fontWeight: '800',
  },
  helper: {
    color: '#0B1221',
    opacity: 0.8,
    fontSize: 13,
    fontWeight: '600',
  },
});
