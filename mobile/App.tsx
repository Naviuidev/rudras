import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ServiceAreaProvider } from './src/context/ServiceAreaContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import VerifyOtpScreen from './src/screens/VerifyOtpScreen';
import MainNavigator from './src/navigation/MainNavigator';
import { registerForPushNotifications } from './src/services/notifications';
import { COLORS } from './src/constants/theme';
import { View, ActivityIndicator } from 'react-native';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.accent,
    secondary: COLORS.secondary,
    background: '#f8f9f6',
  },
};

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="VerifyOtp"
          component={VerifyOtpScreen}
          options={{ presentation: 'modal', animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <ServiceAreaProvider>
            <AppContent />
          </ServiceAreaProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
