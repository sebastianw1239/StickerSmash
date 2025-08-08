import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { brandMessages, theme } from '../../constants/theme';

export default function About() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>About SameTime</Text>
        <Text style={styles.subtitle}>{brandMessages.voice.casual}</Text>
        
                  <View style={styles.section}>
            <Text style={styles.sectionTitle}>What is SameTime?</Text>
            <Text style={styles.description}>
              SameTime is a modern event planning app that helps you coordinate meetups 
              with friends and family. Create events, share locations, and track everyone&apos;s 
              arrival in real-time.
            </Text>
          </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.feature}>• Create and manage events</Text>
          <Text style={styles.feature}>• Real-time location tracking</Text>
          <Text style={styles.feature}>• ETA calculations</Text>
          <Text style={styles.feature}>• Interactive maps</Text>
          <Text style={styles.feature}>• Event sharing</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version</Text>
          <Text style={styles.description}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  feature: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 8,
    paddingLeft: 8,
  },
}); 