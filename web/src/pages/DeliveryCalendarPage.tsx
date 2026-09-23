import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDeliveryLogs, getCarryForward } from '../services/api';
import type { DeliveryLog, CarryForwardLog } from '../types';

type DayStatus = 'scheduled' | 'skipped' | 'carry-forward' | 'none';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DeliveryCalendarPage() {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [carryForward, setCarryForward] = useState<CarryForwardLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    Promise.all([getDeliveryLogs(), getCarryForward()])
      .then(([l, c]) => {
        setLogs(l);
        setCarryForward(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const statusMap = useMemo(() => {
    const map = new Map<string, DayStatus>();
    logs.forEach((log) => {
      if (log.status === 'skipped') map.set(log.delivery_date, 'skipped');
      else if (log.status === 'scheduled' || log.status === 'delivered') map.set(log.delivery_date, 'scheduled');
      else if (log.status === 'paused') map.set(log.delivery_date, 'carry-forward');
    });
    carryForward.forEach((cf) => {
      const date = cf.created_at?.split(' ')[0];
      if (date) map.set(date, 'carry-forward');
    });
    return map;
  }, [logs, carryForward]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewDate]);

  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getDayStatus = (day: number): DayStatus => {
    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return statusMap.get(dateStr) || 'none';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-account-content">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="section-title mb-0">Delivery Calendar</h4>
        <Link to="/subscriptions" className="btn btn-sm btn-outline-success">
          Back
        </Link>
      </div>

      <Card className="card-brand mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Button size="sm" variant="outline-secondary" onClick={() => setMonthOffset((m) => m - 1)}>
              ← Prev
            </Button>
            <h6 className="mb-0 fw-semibold">{monthLabel}</h6>
            <Button size="sm" variant="outline-secondary" onClick={() => setMonthOffset((m) => m + 1)}>
              Next →
            </Button>
          </div>

          <div className="calendar-grid">
            {WEEKDAYS.map((d) => (
              <div key={d} className="calendar-day header">
                {d}
              </div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const status = getDayStatus(day);
              return (
                <div key={day} className={`calendar-day ${status}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      <Row xs={2} md={4} className="g-2">
        <Col>
          <small><span className="legend-dot" style={{ background: '#d4edda' }} />Scheduled</small>
        </Col>
        <Col>
          <small><span className="legend-dot" style={{ background: '#f8d7da' }} />Skipped</small>
        </Col>
        <Col>
          <small><span className="legend-dot" style={{ background: '#fff3cd' }} />Carry Forward</small>
        </Col>
        <Col>
          <small><span className="legend-dot" style={{ background: '#e9ecef' }} />None</small>
        </Col>
      </Row>
    </div>
  );
}
