import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AuthPopup from '../components/AuthPopup';
import ServiceAreaPrompt from '../components/ServiceAreaPrompt';
import { checkServiceArea } from '../services/api';
import type { ServiceAreaCheckResult } from '../types';

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
}

const STORAGE_KEY = 'service_area_state';

const ServiceAreaContext = createContext<ServiceAreaContextType | null>(null);

function readStoredState(): StoredServiceAreaState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredServiceAreaState) : null;
  } catch {
    return null;
  }
}

function writeStoredState(state: StoredServiceAreaState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function blockedMessageFromResult(result: ServiceAreaCheckResult): string {
  let message =
    result.message ||
    'Sorry, we do not deliver subscriptions or one-time orders to your location yet.';

  const distance = result.nearest?.distance_km;
  if (distance != null && distance > 100) {
    message += `\n\nYour device reported a location about ${distance.toFixed(1)} km from our nearest service area.`;
    message +=
      '\n\nPlease enable precise location, or add a delivery address at checkout using your actual delivery coordinates.';
  }

  return message;
}

export function ServiceAreaProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ServiceAreaStatus>(() => readStoredState()?.status ?? 'unknown');
  const [showPrompt, setShowPrompt] = useState(false);
  const [checking, setChecking] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  const pendingActionRef = useRef<(() => void) | null>(null);
  const pendingResolveRef = useRef<((value: boolean) => void) | null>(null);

  const completePending = useCallback((allowed: boolean) => {
    if (allowed) pendingActionRef.current?.();
    pendingActionRef.current = null;
    pendingResolveRef.current?.(allowed);
    pendingResolveRef.current = null;
  }, []);

  const applyCheckResult = useCallback(
    (result: ServiceAreaCheckResult, latitude: number, longitude: number): boolean => {
      if (result.in_service_area) {
        const nextStatus =
          result.message === 'No service boundaries configured' ||
          result.message === 'Service locations could not be resolved'
            ? 'no_locations'
            : 'inside';

        setStatus(nextStatus);
        writeStoredState({
          status: nextStatus,
          lat: latitude,
          lng: longitude,
          matchedLocation: result.location?.name,
        });
        setShowPrompt(false);
        return true;
      }

      setStatus('outside');
      writeStoredState({ status: 'outside', lat: latitude, lng: longitude });
      setShowPrompt(false);
      setBlockedMessage(blockedMessageFromResult(result));
      return false;
    },
    []
  );

  const evaluateCoordinates = useCallback(
    async (latitude: number, longitude: number): Promise<boolean> => {
      setChecking(true);
      setStatus('checking');

      try {
        const result = await checkServiceArea(latitude, longitude);
        return applyCheckResult(result, latitude, longitude);
      } catch {
        setStatus('unknown');
        setBlockedMessage('Could not verify your location. Please try again.');
        return false;
      } finally {
        setChecking(false);
      }
    },
    [applyCheckResult]
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      setBlockedMessage('Location is not supported on this device.');
      completePending(false);
      return;
    }

    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void evaluateCoordinates(position.coords.latitude, position.coords.longitude).then(
          (allowed) => completePending(allowed)
        );
      },
      (error) => {
        setChecking(false);
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          writeStoredState({ status: 'denied' });
          setShowPrompt(false);
          setBlockedMessage(
            'Location access is required to order subscriptions or one-time delivery in your area.'
          );
          completePending(false);
          return;
        }
        setBlockedMessage('Could not fetch your location. Please try again.');
        completePending(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, [completePending, evaluateCoordinates]);

  const promptForServiceArea = useCallback(() => {
    if (status === 'denied' || status === 'unsupported') return;
    setShowPrompt(true);
  }, [status]);

  const ensureServiceArea = useCallback((): Promise<boolean> => {
    if (status === 'unsupported') {
      setBlockedMessage('Location is not supported on this device.');
      return Promise.resolve(false);
    }

    if (status === 'denied') {
      setBlockedMessage(
        'Location access is required to order subscriptions or one-time delivery in your area.'
      );
      return Promise.resolve(false);
    }

    const stored = readStoredState();
    if (stored?.lat != null && stored?.lng != null) {
      return evaluateCoordinates(stored.lat, stored.lng).then((allowed) => {
        if (allowed) return true;

        return new Promise((resolve) => {
          pendingResolveRef.current = resolve;
          pendingActionRef.current = () => resolve(true);
          setShowPrompt(true);
        });
      });
    }

    return new Promise((resolve) => {
      pendingResolveRef.current = resolve;
      pendingActionRef.current = () => resolve(true);
      setShowPrompt(true);
    });
  }, [evaluateCoordinates, status]);

  return (
    <ServiceAreaContext.Provider value={{ status, ensureServiceArea, promptForServiceArea, requestLocation }}>
      {children}

      <ServiceAreaPrompt
        show={showPrompt}
        loading={checking}
        onAllow={requestLocation}
        onDismiss={() => {
          setShowPrompt(false);
          setStatus('skipped');
          writeStoredState({ status: 'skipped' });
          completePending(false);
        }}
      />

      <AuthPopup
        show={Boolean(blockedMessage)}
        title="Delivery unavailable"
        message={blockedMessage}
        confirmLabel="OK"
        onClose={() => setBlockedMessage('')}
      />
    </ServiceAreaContext.Provider>
  );
}

export function useServiceArea() {
  const ctx = useContext(ServiceAreaContext);
  if (!ctx) throw new Error('useServiceArea must be used within ServiceAreaProvider');
  return ctx;
}
