import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { getErrorMessage, getServiceLocations } from '../services/api';
import type { AddressInput, ServiceLocation } from '../types';
import {
  applyServiceLocationToAddress,
  parseServiceLocationName,
} from '../utils/serviceAreaAddress';

const emptyAddress: AddressInput = {
  name: '',
  mobile: '',
  address_line: '',
  area: '',
  city: '',
  state: '',
  pincode: '',
  is_default: true,
  lat: null,
  lng: null,
};

function buildMapEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=16&output=embed`;
}

async function reverseGeocode(lat: number, lng: number): Promise<Partial<AddressInput>> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
      },
    }
  );

  if (!res.ok) return {};

  const data = await res.json();
  const addr = data.address || {};
  const addressLine = [addr.house_number, addr.road, addr.residential, addr.suburb]
    .filter(Boolean)
    .join(', ');

  return {
    address_line: addressLine || (typeof data.display_name === 'string' ? data.display_name.split(',')[0] : ''),
    area: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '',
    city: addr.city || addr.town || addr.village || addr.state_district || '',
    state: addr.state || '',
    pincode: addr.postcode || '',
  };
}

function matchConfiguredState(geocodedState: string, configuredStates: string[]): string {
  if (!geocodedState) return '';
  const normalized = geocodedState.trim().toLowerCase();
  return configuredStates.find((state) => state.toLowerCase() === normalized) || geocodedState;
}

interface CheckoutAddAddressModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (address: AddressInput) => Promise<void>;
}

export default function CheckoutAddAddressModal({ show, onHide, onSave }: CheckoutAddAddressModalProps) {
  const [form, setForm] = useState<AddressInput>(emptyAddress);
  const [selectedLocationId, setSelectedLocationId] = useState<number | ''>('');
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationHint, setLocationHint] = useState('');
  const [saving, setSaving] = useState(false);
  const didAutoLocate = useRef(false);

  const parsedLocations = useMemo(
    () =>
      serviceLocations.map((location) => ({
        ...location,
        parsed: parseServiceLocationName(location.name),
      })),
    [serviceLocations]
  );

  const configuredStates = useMemo(() => {
    const states = parsedLocations.map(({ parsed }) => parsed.state).filter(Boolean);
    return [...new Set(states)];
  }, [parsedLocations]);

  const cityOptions = useMemo(() => {
    if (!form.state) return [];
    return parsedLocations.filter(
      ({ parsed }) => parsed.state.toLowerCase() === form.state.trim().toLowerCase()
    );
  }, [parsedLocations, form.state]);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationHint('Location is not supported on this device.');
      return;
    }

    setLocating(true);
    setLocationHint('Fetching your current location…');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const geocoded = await reverseGeocode(lat, lng);
          const matchedState = matchConfiguredState(geocoded.state || '', configuredStates);
          const geocodedCity = (geocoded.city || '').trim().toLowerCase();
          const matchedLocation = parsedLocations.find(({ parsed }) => {
            if (matchedState && parsed.state.toLowerCase() !== matchedState.toLowerCase()) return false;
            return (
              parsed.city.toLowerCase() === geocodedCity ||
              parsed.locality.toLowerCase() === geocodedCity ||
              parsed.city.toLowerCase().includes(geocodedCity) ||
              geocodedCity.includes(parsed.city.toLowerCase())
            );
          });

          setForm((prev) => {
            const base = {
              ...prev,
              address_line: geocoded.address_line || prev.address_line,
              area: geocoded.area || prev.area,
              city: matchedLocation?.parsed.city || geocoded.city || prev.city,
              state: matchedLocation?.parsed.state || matchedState || prev.state,
              pincode: geocoded.pincode || prev.pincode,
            };

            if (matchedLocation) {
              return applyServiceLocationToAddress({ ...base, lat, lng }, matchedLocation);
            }

            return { ...base, lat, lng };
          });
          setSelectedLocationId(matchedLocation?.id ?? '');
          setLocationHint(
            matchedLocation
              ? 'Matched your delivery area. Confirm the address details and save.'
              : 'Location captured. Select your delivery city from the list below.'
          );
        } catch {
          setForm((prev) => ({ ...prev, lat, lng }));
          setLocationHint('Location captured. Please complete the address details below.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocationHint('Could not access your location. Allow location permission and try again.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, [configuredStates, parsedLocations]);

  useEffect(() => {
    if (!show) {
      didAutoLocate.current = false;
      return;
    }

    setForm(emptyAddress);
    setSelectedLocationId('');
    setLocationHint('');
    setLocating(false);

    getServiceLocations()
      .then(setServiceLocations)
      .catch(() => setServiceLocations([]));
  }, [show]);

  useEffect(() => {
    if (!show || configuredStates.length === 0 || didAutoLocate.current) return;
    didAutoLocate.current = true;
    captureLocation();
  }, [show, configuredStates.length, captureLocation]);

  const handleStateChange = (state: string) => {
    setSelectedLocationId('');
    setForm((prev) => ({ ...prev, state, city: '' }));
  };

  const handleCityChange = (locationId: number | '') => {
    setSelectedLocationId(locationId);
    if (locationId === '') {
      setForm((prev) => ({ ...prev, city: '' }));
      return;
    }

    const location = parsedLocations.find(({ id }) => id === locationId);
    if (!location) return;

    setForm((prev) => applyServiceLocationToAddress(prev, location));
  };

  const handleSave = async () => {
    let payload = form;

    if (selectedLocationId !== '') {
      const location = parsedLocations.find(({ id }) => id === selectedLocationId);
      if (location) {
        payload = applyServiceLocationToAddress(form, location);
      }
    }

    if (payload.lat == null || payload.lng == null) {
      setLocationHint('Select your delivery city from the configured service areas.');
      return;
    }

    if (!payload.name.trim() || !payload.mobile.trim() || !payload.address_line.trim() || !payload.city.trim() || !payload.state.trim() || !payload.pincode.trim()) {
      setLocationHint('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      await onSave(payload);
      onHide();
    } catch (err) {
      setLocationHint(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const mapUrl = form.lat != null && form.lng != null ? buildMapEmbedUrl(form.lat, form.lng) : null;

  return (
    <Modal show={show} onHide={onHide} centered className="checkout-add-address-modal">
      <Modal.Header closeButton>
        <Modal.Title>Add Address</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="checkout-add-address-map">
          {mapUrl ? (
            <iframe title="Delivery location preview" src={mapUrl} loading="lazy" />
          ) : (
            <div className="checkout-add-address-map-placeholder">
              {locating ? (
                <>
                  <div className="spinner-border spinner-border-sm text-success" role="status" />
                  <span>Locating you on the map…</span>
                </>
              ) : (
                <>
                  <span>Allow location access to preview your delivery point on the map.</span>
                  <Button
                    type="button"
                    variant="outline-success"
                    size="sm"
                    className="rounded-pill"
                    onClick={captureLocation}
                  >
                    Use current location
                  </Button>
                </>
              )}
            </div>
          )}
          {mapUrl && (
            <Button
              type="button"
              variant="light"
              size="sm"
              className="checkout-add-address-map-refresh rounded-pill"
              onClick={captureLocation}
              disabled={locating}
            >
              {locating ? 'Updating…' : 'Update location'}
            </Button>
          )}
        </div>

        {locationHint && <p className="checkout-add-address-location-hint mb-3">{locationHint}</p>}

        <Form className="checkout-add-address-form">
          <Row className="g-2 mb-2">
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Group>
                <Form.Label>Mobile</Form.Label>
                <Form.Control
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="10-digit mobile"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-2 mb-2">
            <Col xs={12} sm={8}>
              <Form.Group>
                <Form.Label>Address line</Form.Label>
                <Form.Control
                  value={form.address_line}
                  onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                  placeholder="House / street / landmark"
                  required
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Group>
                <Form.Label>State</Form.Label>
                <Form.Select
                  value={form.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  required
                >
                  <option value="">Select state</option>
                  {configuredStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-2">
            <Col xs={12} sm={4}>
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Select
                  value={selectedLocationId}
                  onChange={(e) =>
                    handleCityChange(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  required
                  disabled={!form.state}
                >
                  <option value="">{form.state ? 'Select city' : 'Select state first'}</option>
                  {cityOptions.map(({ id, parsed }) => (
                    <option key={id} value={id}>
                      {parsed.city}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Group>
                <Form.Label>Area</Form.Label>
                <Form.Control
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Locality / area"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Group>
                <Form.Label>Pincode</Form.Label>
                <Form.Control
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="PIN code"
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="rounded-pill" onClick={onHide} disabled={saving}>
          Cancel
        </Button>
        <Button className="btn-accent rounded-pill" onClick={handleSave} disabled={saving || locating}>
          {saving ? 'Saving…' : 'Save Address'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
