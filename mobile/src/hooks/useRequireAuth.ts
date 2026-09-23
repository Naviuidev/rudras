import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export type AuthReturnTarget =
  | { type: 'checkout' }
  | { type: 'subscription' }
  | { type: 'subscriptionCreate' }
  | { type: 'profile' };

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<any>();

  return (returnTo?: AuthReturnTarget): boolean => {
    if (isAuthenticated) return true;
    navigation.navigate('Login', { returnTo });
    return false;
  };
}
