import { Stack } from 'expo-router';

const COLORS = {
  background: '#0c371e',
  surface: '#164a2e',
  primary: '#FF6F00',
  text: '#eef3e0',
};

export default function AgentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="meal-plans/index" />
      <Stack.Screen name="meal-plans/[id]" />
    </Stack>
  );
}
