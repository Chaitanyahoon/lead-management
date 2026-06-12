import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'var(--bg-app)' }}>
      <Navbar />
      <main className="flex-grow-1">
        <div className="container-fluid py-4 px-3 px-md-4">
          <Outlet />
        </div>
      </main>
      <footer className="text-muted text-center py-3 small border-top mt-auto" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        &copy; {new Date().getFullYear()} LeadFlow — Lead Management System
      </footer>
    </div>
  );
}
