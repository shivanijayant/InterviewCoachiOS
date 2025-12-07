import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { Provider as PaperProvider, TextInput, Button, Card, Text, Appbar, RadioButton, ActivityIndicator, Divider, DataTable } from 'react-native-paper';
import Purchases from 'react-native-purchases';

// 🔧 REPLACE WITH YOUR HUGGING FACE URL
const API_URL = "https://interview-coach-api-iOS.hf.space"; 
const ADMIN_EMAIL = "admin@interviewcoach.com"; 

export default function App() {
  const [screen, setScreen] = useState('login'); 
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);
  
  // Interview Data
  const [role, setRole] = useState('Product Manager');
  const [industry, setIndustry] = useState('Tech');
  const [model, setModel] = useState('flash');
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sessionId, setSessionId] = useState('');
  
  // Admin Data
  const [stats, setStats] = useState([]);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setIsAdmin(data.is_admin);
      setScreen('home');
    } catch (e) { Alert.alert("Error", "Check backend connection"); }
  };

  const handleStart = async () => {
    if (model === 'pro' && !isPro) {
      // Simulate Paywall for now
      Alert.alert("Upgrade Required", "Gemini Pro requires a subscription.", [
        { text: "Buy Pro ($9.99)", onPress: () => setIsPro(true) }, // Simulating purchase
        { text: "Cancel" }
      ]);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/start`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, role, industry, model_key: model })
      });
      const data = await res.json();
      setSessionId(data.session_id);
      setQuestions(data.questions);
      setScreen('interview');
    } catch (e) { Alert.alert("Error", "Could not generate questions"); }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('question', questions[currentQIndex]);
      formData.append('answer_text', answer);
      
      const res = await fetch(`${API_URL}/api/submit`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (e) { Alert.alert("Error", "Submission failed"); }
  };

  const fetchStats = async () => {
    const res = await fetch(`${API_URL}/api/admin/stats`);
    const data = await res.json();
    setStats(data.users);
  };

  // --- RENDER SCREENS ---

  if (screen === 'login') {
    return (
      <View style={styles.center}>
        <Text variant="headlineMedium" style={{marginBottom:20}}>🎯 AI Interview Coach</Text>
        <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} />
        <Button mode="contained" onPress={handleLogin}>Login</Button>
      </View>
    );
  }

  if (screen === 'home') {
    return (
      <View style={{flex:1}}>
        <Appbar.Header>
          <Appbar.Content title="Dashboard" />
          {isAdmin && <Appbar.Action icon="shield-account" onPress={() => { fetchStats(); setScreen('admin'); }} />}
        </Appbar.Header>
        <View style={styles.container}>
          <TextInput label="Target Role" value={role} onChangeText={setRole} style={styles.input} />
          <TextInput label="Industry" value={industry} onChangeText={setIndustry} style={styles.input} />
          
          <Text variant="titleMedium" style={{marginTop:20}}>Select Intelligence:</Text>
          <RadioButton.Group onValueChange={setModel} value={model}>
            <RadioButton.Item label="⚡ Standard (Free)" value="flash" />
            <RadioButton.Item label="💎 Pro (Premium)" value="pro" />
          </RadioButton.Group>

          <Button mode="contained" onPress={handleStart} style={{marginTop:20}}>Start Interview</Button>
        </View>
      </View>
    );
  }

  if (screen === 'interview') {
    return (
      <View style={{flex:1}}>
        <Appbar.Header><Appbar.Content title="Interview" /></Appbar.Header>
        <ScrollView style={styles.container}>
          <Card style={{marginBottom:20}}>
            <Card.Content>
              <Text variant="titleLarge">Question {currentQIndex + 1}</Text>
              <Text variant="bodyLarge" style={{marginTop:10}}>{questions[currentQIndex]}</Text>
            </Card.Content>
          </Card>

          {!feedback ? (
            <>
              <TextInput 
                label="Your Answer" 
                value={answer} 
                onChangeText={setAnswer} 
                multiline 
                numberOfLines={6} 
                style={styles.input} 
              />
              <Button mode="contained" onPress={handleSubmit}>Submit Answer</Button>
            </>
          ) : (
            <Card style={{backgroundColor:'#f0fdf4'}}>
              <Card.Title title="Feedback" />
              <Card.Content><Text>{feedback}</Text></Card.Content>
              <Card.Actions>
                <Button onPress={() => {
                  setFeedback('');
                  setAnswer('');
                  if (currentQIndex < questions.length - 1) setCurrentQIndex(prev => prev + 1);
                  else Alert.alert("Done", "Interview Complete!");
                }}>Next Question</Button>
              </Card.Actions>
            </Card>
          )}
        </ScrollView>
      </View>
    );
  }

  if (screen === 'admin') {
    return (
      <View style={{flex:1}}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => setScreen('home')} />
          <Appbar.Content title="Admin Panel" />
        </Appbar.Header>
        <ScrollView>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Email</DataTable.Title>
              <DataTable.Title numeric>Sessions</DataTable.Title>
            </DataTable.Header>
            {stats.map((u) => (
              <DataTable.Row key={u.email}>
                <DataTable.Cell>{u.email}</DataTable.Cell>
                <DataTable.Cell numeric>{u.session_count}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 20 },
  container: { padding: 20 },
  input: { marginBottom: 15, backgroundColor: 'white' }
});