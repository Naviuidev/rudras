import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import UserSidebar from './UserSidebar';

export default function UserAccountLayout() {
  return (
    <Container className="page-container">
      <div className="category-shop-page user-account-shell">
        <UserSidebar />
        <main className="category-shop-main user-account-main">
          <Outlet />
        </main>
      </div>
    </Container>
  );
}
