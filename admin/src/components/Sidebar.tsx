import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { adminNav } from '../config/adminNav';
import AdminNavIcon from './AdminNavIcon';

function isPathActive(pathname: string, to: string) {
  if (to === '/admin/dashboard') return pathname === to;
  if (to === '/admin/orders') return pathname === '/admin/orders';
  return pathname === to || pathname.startsWith(`${to}/`);
}

function groupHasActive(pathname: string, group: (typeof adminNav)[0]) {
  if (group.to) return isPathActive(pathname, group.to);
  return group.children?.some((child) => isPathActive(pathname, child.to)) ?? false;
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      adminNav.forEach((group) => {
        if (group.children && groupHasActive(pathname, group)) {
          next[group.id] = true;
        }
      });
      return next;
    });
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {adminNav.map((group) => {
          if (group.to) {
            return (
              <NavLink
                key={group.id}
                to={group.to}
                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              >
                <AdminNavIcon name={group.icon} />
                <span className="admin-nav-label">{group.label}</span>
              </NavLink>
            );
          }

          const isOpen = openGroups[group.id] ?? false;
          const isActiveGroup = groupHasActive(pathname, group);

          return (
            <div key={group.id} className={`admin-nav-group ${isActiveGroup ? 'active-group' : ''}`}>
              <button
                type="button"
                className="admin-nav-group-toggle"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
              >
                <AdminNavIcon name={group.icon} />
                <span className="admin-nav-label">{group.label}</span>
                <span className={`admin-nav-chevron ${isOpen ? 'open' : ''}`} aria-hidden>
                  ›
                </span>
              </button>
              {isOpen && (
                <div className="admin-nav-children">
                  {group.children?.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.to === '/admin/orders' || child.to === '/admin/customers'}
                      className={({ isActive }) => `admin-nav-link admin-nav-link-child ${isActive ? 'active' : ''}`}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
