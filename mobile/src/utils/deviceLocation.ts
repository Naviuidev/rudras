import * as Location from 'expo-location';
import * as Device from 'expo-device';

export interface DeviceCoords {
  latitude: number;
  longitude: number;
}

/** Fetch the device's current GPS coordinates (always fresh, not cached). */
export async function fetchDeviceLocation(): Promise<DeviceCoords> {
  const lastKnown = await Location.getLastKnownPositionAsync();
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    mayShowUserSettingsDialog: true,
  });

  // Prefer the fresher reading when both are available.
  if (lastKnown && position) {
    const lastTs = lastKnown.timestamp ?? 0;
    const currentTs = position.timestamp ?? 0;
    const coords = currentTs >= lastTs ? position.coords : lastKnown.coords;
    return { latitude: coords.latitude, longitude: coords.longitude };
  }

  const coords = position?.coords ?? lastKnown?.coords;
  if (!coords) {
    throw new Error('Could not determine your location.');
  }

  return { latitude: coords.latitude, longitude: coords.longitude };
}

export function isLikelySimulator(): boolean {
  return !Device.isDevice;
}

export function simulatorLocationHint(): string {
  return (
    'If you are using the iOS Simulator, set a custom location near your delivery area ' +
    '(Simulator menu → Features → Location → Custom Location, e.g. Hyderabad 17.44, 78.39). ' +
    'Or add a delivery address at checkout with your saved coordinates.'
  );
}
