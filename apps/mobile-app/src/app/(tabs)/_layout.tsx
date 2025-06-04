// app/(tabs)/_layout.tsx
import { useConvexAuth } from 'convex/react';
import { Tabs, useRouter } from 'expo-router';
import { QrCode, CircleUser as UserCircle } from 'lucide-react-native';

import { useEffect } from "react";

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // If user is not authenticated, redirect to login
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render tabs if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (

    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e1e1e1',
          height: 50,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => <QrCode size={size} color={color} />,
        }}
      />     
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  
  );
}