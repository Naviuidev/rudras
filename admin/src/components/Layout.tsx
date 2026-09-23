import { Container } from 'react-bootstrap';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';

export default function Layout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="admin-app">
      <AdminHeader />
      <Container fluid className="admin-page-container">
        <div className="admin-shell">
          <Sidebar />
          <main className="admin-main">
            <div className="admin-content">
              {title ? <h1 className="section-title">{title}</h1> : null}
              {children}
            </div>
          </main>
        </div>
      </Container>
    </div>
  );
}
