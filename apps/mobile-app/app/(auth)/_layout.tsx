// app/(auth)/_layout.tsx
import { useConvexAuth } from "convex/react";
import { Stack, useRouter } from "expo-router";

import { useEffect } from "react";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // If user is already authenticated, redirect to tabs
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}