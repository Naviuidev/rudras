import { Row, Col } from 'react-bootstrap';
import PackagingSlider from './PackagingSlider';
import PaymentSupportForm from './PaymentSupportForm';

export default function PackagingSupportSection() {
  return (
    <section id="support-form" className="packaging-support-section category-grid-section mb-4 py-5">
      <Row className="g-4 align-items-stretch">
        <Col lg={6}>
          <PackagingSlider embedded />
        </Col>
        <Col lg={6}>
          <PaymentSupportForm />
        </Col>
      </Row>
    </section>
  );
}
