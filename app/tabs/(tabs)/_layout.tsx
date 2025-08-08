import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => (<Ionicons name="home" color={color} size={size} />) }} />
      <Tabs.Screen name="about" options={{ title: 'About', tabBarIcon: ({ color, size }) => (<Ionicons name="information-circle" color={color} size={size} />) }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: ({ color, size }) => (<Ionicons name="calendar" color={color} size={size} />) }} />
    </Tabs>
  );
}
