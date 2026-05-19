import React, {useState} from 'react';
import {MaterialIcons, MaterialCommunityIcons} from '@expo/vector-icons';
import {Redirect, Tabs} from 'expo-router';
import {Platform, View, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import CoachFAB from '../../components/CoachFAB';
import CoachModal from '../../components/CoachModal';

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
  const [coachVisible, setCoachVisible] = useState(false);

  if (loading) {
    return null;
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  const isWeb = Platform.OS === 'web';
  // On native, apply safe area padding. On web, extend to bottom (CSS safe-area-inset handles coloring).
  const bottomInset = isWeb ? 0 : insets.bottom;

  return (
    <View style={styles.container}>
      <Tabs
        safeAreaInsets={{bottom: 0, top: 0, left: 0, right: 0}}
        sceneContainerStyle={styles.sceneContainer}
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
          tabBarStyle: [
            styles.tabBar,
            {
              paddingBottom: bottomInset,
              height: 56 + bottomInset,
            },
          ],
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
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="book-open-variant" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
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

      {/* Coach FAB */}
      <CoachFAB
        onPress={() => setCoachVisible(true)}
        bottomOffset={56 + bottomInset}
      />

      {/* Coach Modal */}
      <CoachModal
        visible={coachVisible}
        onClose={() => setCoachVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  sceneContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 8,
  },
});
