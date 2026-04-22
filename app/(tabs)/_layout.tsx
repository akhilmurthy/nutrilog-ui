import {MaterialIcons, MaterialCommunityIcons} from '@expo/vector-icons';
import {Redirect, Tabs} from 'expo-router';
import {useAuth} from '../../context/AuthContext';

// App Theme Colors
const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  primary: '#FF6F00',
  text: '#eef3e0',
  textSecondary: '#a8b99a',
  border: '#2d5a3f',
};

export default function TabsLayout() {
  const {token, loading} = useAuth();

  if (loading) {
    return null;
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: -4,
        },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({color}) => (
            <MaterialIcons name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="notebook-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({color}) => (
            <MaterialIcons name="insights" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({color}) => (
            <MaterialIcons name="settings" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
