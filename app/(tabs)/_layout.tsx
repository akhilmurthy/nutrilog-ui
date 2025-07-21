import {MaterialIcons, MaterialCommunityIcons} from '@expo/vector-icons';
import {Redirect, Tabs} from 'expo-router';
import {useAuth} from '../../context/AuthContext';

export default function TabsLayout() {
  const {token} = useAuth();
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 60,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowOffset: {width: 0, height: -2},
          shadowRadius: 10,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({focused, size}) => (
            <MaterialIcons
              name="dashboard"
              size={focused ? 28 : 24}
              color={focused ? '#007AFF' : '#999'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          tabBarIcon: ({focused, size}) => (
            <MaterialCommunityIcons
              name="notebook"
              size={focused ? 28 : 24}
              color={focused ? '#007AFF' : '#999'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({focused, size}) => (
            <MaterialIcons
              name="insights"
              size={focused ? 28 : 24}
              color={focused ? '#007AFF' : '#999'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({focused, size}) => (
            <MaterialIcons
              name="settings"
              size={focused ? 28 : 24}
              color={focused ? '#007AFF' : '#999'}
            />
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
