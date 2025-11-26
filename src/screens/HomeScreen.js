import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { recordAudio, transcribeAudio } from '../services/sttService';
import { generateResponse } from '../services/llmService';

export default function HomeScreen() {
  const [ transcript, setTranscript ] = useState('');
  const [ response, setResponse ] = useState('');
  const [ loading, setLoading ] = useState(false);

  const handleTalk = async () => {
    setLoading(true);
    const { uri } = await recordAudio();
    const { text } = await transcribeAudio(uri);
    setTranscript(text);
    const { answer } = await generateResponse(text);
    setResponse(answer);
    setLoading(false);
  };

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Button title="Hablar con Eva" onPress={handleTalk} />
      { loading && <ActivityIndicator /> }
      { transcript ? <Text>Texto: {transcript}</Text> : null }
      { response ? <Text>Eva dice: {response}</Text> : null }
    </View>
  );
}