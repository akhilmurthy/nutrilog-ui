import {MaterialIcons, MaterialCommunityIcons} from '@expo/vector-icons';
import {Redirect, Tabs} from 'expo-router';
import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  if (loading) {
    return null;
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  // On web, use minimal padding (CSS handles safe area)
  // On native, use actual safe area insets
  const isWeb = Platform.OS === 'web';
  const bottomPadding = isWeb ? 8 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      sceneContainerStyle={{
        backgroundColor: COLORS.background,
        flex: 1,
      }}
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
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          borderTopWidth: 0,
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
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="calendar-month" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Coach',
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="robot-happy-outline" size={24} color={color} />
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
