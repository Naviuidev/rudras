import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import ServiceAreaPrompt from '../components/ServiceAreaPrompt';
import { checkServiceArea } from '../services/api';
import type { ServiceAreaCheckResult } from '../types/address';
import { fetchDeviceLocation, isLikelySimulator, simulatorLocationHint } from '../utils/deviceLocation';

export type ServiceAreaStatus =
  | 'unknown'
  | 'checking'
  | 'inside'
  | 'outside'
  | 'denied'
  | 'unsupported'
  | 'skipped'
  | 'no_locations';

interface StoredServiceAreaState {
  status: ServiceAreaStatus;
  lat?: number;
  lng?: number;
  matchedLocation?: string;
}

interface ServiceAreaContextType {
  status: ServiceAreaStatus;
  ensureServiceArea: () => Promise<boolean>;
  promptForServiceArea: () => void;
  requestLocation: () => void;
  clearServiceAreaCache: () => Promise<void>;
}

const STORAGE_KEY = 'service_area_state';

const ServiceAreaContext = createContext<ServiceAreaContextType | null>(null);

function buildBlockedMessage(result: ServiceAreaCheckResult): string {
  let message =
    result.message ||
    'Sorry, we do not deliver subscriptions or one-time orders to your location yet.';

  const distance = result.nearest?.distance_km;
  if (distance != null && distance > 100) {
    message += `\n\nYour device reported a location about ${distance.toFixed(1)} km from our nearest service area.`;
    if (isLikelySimulator()) {
      message += `\n\n${simulatorLocationHint()}`;
    } else {
      message +=
        '\n\nPlease enable precise location, or add a delivery address at checkout using your actual delivery coordinates.';
    }
  }

  return message;
}

async function readStoredState(): Promise<StoredServiceAreaState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredServiceAreaState) : null;
  } catch {
    return null;
  }
}

async function writeStoredState(state: StoredServiceAreaState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function clearStoredState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function ServiceAreaProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ServiceAreaStatus>('unknown');
  const [showPrompt, setShowPrompt] = useState(false);
  const [checking, setChecking] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const pendingResolveRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    void readStoredState().then((stored) => {
      if (stored?.status) setStatus(stored.status);
    });
  }, []);

  const completePending = useCallback((allowed: boolean) => {
    if (allowed) pendingActionRef.current?.();
    pendingActionRef.current = null;
    pendingResolveRef.current?.(allowed);
    pendingResolveRef.current = null;
  }, []);

  const showBlocked = useCallback((message: string) => {
    Alert.alert('Delivery unavailable', message);
  }, []);

  const clearServiceAreaCache = useCallback(async () => {
    await clearStoredState();
    setStatus('unknown');
  }, []);

  const applyCheckResult = useCallback(
    async (result: ServiceAreaCheckResult, latitude: number, longitude: number): Promise<boolean> => {
      if (result.in_service_area) {
        const nextStatus =
          result.message === 'No service boundaries configured' ||
          result.message === 'Service locations could not be resolved'
            ? 'no_locations'
            : 'inside';

        setStatus(nextStatus);
        await writeStoredState({
          status: nextStatus,
          lat: latitude,
          lng: longitude,
          matchedLocation: result.location?.name,
        });
        setShowPrompt(false);
        return true;
      }

      setStatus('outside');
      // Do not persist bad coordinates — forces a fresh GPS read next time.
      await clearStoredState();
      setShowPrompt(false);
      showBlocked(buildBlockedMessage(result));
      return false;
    },
    [showBlocked]
  );

  const evaluateCoordinates = useCallback(
    async (latitude: number, longitude: number): Promise<boolean> => {
      setChecking(true);
      setStatus('checking');

      try {
        const res = await checkServiceArea(latitude, longitude);
        return applyCheckResult(res.data.data, latitude, longitude);
      } catch {
        setStatus('unknown');
        showBlocked('Could not verify your location. Please try again.');
        return false;
      } finally {
        setChecking(false);
      }
    },
    [applyCheckResult, showBlocked]
  );

  const requestLocation = useCallback(() => {
    void (async () => {
      setChecking(true);
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== 'granted') {
          setChecking(false);
          setStatus('denied');
          await writeStoredState({ status: 'denied' });
          setShowPrompt(false);
          showBlocked(
            'Location access is required to order subscriptions or one-time delivery in your area.'
          );
          completePending(false);
          return;
        }

        const { latitude, longitude } = await fetchDeviceLocation();
        const allowed = await evaluateCoordinates(latitude, longitude);
        completePending(allowed);
      } catch {
        setChecking(false);
        const hint = isLikelySimulator() ? `\n\n${simulatorLocationHint()}` : '';
        showBlocked(`Could not fetch your location. Please try again.${hint}`);
        completePending(false);
      }
    })();
  }, [completePending, evaluateCoordinates, showBlocked]);

  const promptForServiceArea = useCallback(() => {
    if (status === 'denied' || status === 'unsupported') return;
    setShowPrompt(true);
  }, [status]);

  const ensureServiceArea = useCallback((): Promise<boolean> => {
    if (status === 'unsupported') {
      showBlocked('Location is not supported on this device.');
      return Promise.resolve(false);
    }

    if (status === 'denied') {
      showBlocked(
        'Location access is required to order subscriptions or one-time delivery in your area.'
      );
      return Promise.resolve(false);
    }

    const openPrompt = () =>
      new Promise<boolean>((resolve) => {
        pendingResolveRef.current = resolve;
        pendingActionRef.current = () => resolve(true);
        setShowPrompt(true);
      });

    return readStoredState().then(async (stored) => {
      if (stored?.lat != null && stored?.lng != null) {
        const allowed = await evaluateCoordinates(stored.lat, stored.lng);
        if (allowed) return true;
      }
      return openPrompt();
    });
  }, [evaluateCoordinates, showBlocked, status]);

  return (
    <ServiceAreaContext.Provider
      value={{ status, ensureServiceArea, promptForServiceArea, requestLocation, clearServiceAreaCache }}
    >
      {children}
      <ServiceAreaPrompt
        visible={showPrompt}
        loading={checking}
        onAllow={requestLocation}
        onDismiss={() => {
          setShowPrompt(false);
          setStatus('skipped');
          void writeStoredState({ status: 'skipped' });
          completePending(false);
        }}
      />
    </ServiceAreaContext.Provider>
  );
}

export function useServiceArea() {
  const ctx = useContext(ServiceAreaContext);
  if (!ctx) throw new Error('useServiceArea must be used within ServiceAreaProvider');
  return ctx;
}
