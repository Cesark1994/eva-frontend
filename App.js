import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1221' }}>
      <StatusBar barStyle="light-content" />
      <HomeScreen />
    </SafeAreaView>
  );
}
