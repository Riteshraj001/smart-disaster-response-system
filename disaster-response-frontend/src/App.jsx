import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import RequireRole from './components/common/RequireRole';
import PublicOnly from './components/common/PublicOnly';

// Layouts
import CitizenLayout from './components/layouts/CitizenLayout';
import AuthorityLayout from './components/layouts/AuthorityLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Landing & Auth
import LandingPage from './pages/LandingPage';
import CitizenLoginPage from './pages/auth/CitizenLoginPage';
import AuthorityLoginPage from './pages/auth/AuthorityLoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

// Citizen Experience
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ReportEmergencyPage from './pages/citizen/ReportEmergencyPage';
import MyReportsPage from './pages/citizen/MyReportsPage';
import CitizenNotificationsPage from './pages/citizen/CitizenNotificationsPage';
import SafetyGuidePage from './pages/citizen/SafetyGuidePage';
import CitizenProfilePage from './pages/citizen/CitizenProfilePage';
import CitizenIncidentTrackingPage from './pages/citizen/CitizenIncidentTrackingPage';

// Response Team Experience (Authority Layout & Pages)
import AuthorityDashboard from './pages/authority/AuthorityDashboard';
import LiveIncidentsPage from './pages/authority/LiveIncidentsPage';
import AuthorityIncidentCreatePage from './pages/authority/AuthorityIncidentCreatePage';
import AuthorityIncidentDetailsPage from './pages/authority/AuthorityIncidentDetailsPage';
import AuthorityIncidentEditPage from './pages/authority/AuthorityIncidentEditPage';
import IncidentMapPage from './pages/authority/IncidentMapPage';
import SensorMonitoringPage from './pages/authority/SensorMonitoringPage';
import PendingVerificationPage from './pages/authority/PendingVerificationPage';
import ResponseTeamsPage from './pages/authority/ResponseTeamsPage';
import AuthorityAnalyticsPage from './pages/authority/AuthorityAnalyticsPage';
import AuthorityProfilePage from './pages/authority/AuthorityProfilePage';
import ResponderLocationPage from './pages/authority/ResponderLocationPage';

// Admin Experience
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import AuthoritiesPage from './pages/admin/AuthoritiesPage';
import AdminSensorsPage from './pages/admin/AdminSensorsPage';
import AdminIncidentsPage from './pages/admin/AdminIncidentsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminHealthPage from './pages/admin/AdminHealthPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

// Documentation & Fallback
import AboutSystem from './pages/AboutSystem';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication Gateways */}
            <Route path="/login/citizen" element={<PublicOnly><CitizenLoginPage /></PublicOnly>} />
            <Route path="/login/team" element={<PublicOnly><AuthorityLoginPage /></PublicOnly>} />
            <Route path="/login/authority" element={<Navigate to="/login/team" replace />} />
            <Route path="/login/admin" element={<PublicOnly><AdminLoginPage /></PublicOnly>} />

            {/* Citizen Portal Routes */}
            <Route path="/citizen" element={<RequireRole role="citizen"><CitizenLayout /></RequireRole>}>
              <Route index element={<CitizenDashboard />} />
              <Route path="report" element={<ReportEmergencyPage />} />
              <Route path="reports" element={<MyReportsPage />} />
              <Route path="track/:id" element={<CitizenIncidentTrackingPage />} />
              <Route path="notifications" element={<CitizenNotificationsPage />} />
              <Route path="guide" element={<SafetyGuidePage />} />
              <Route path="profile" element={<CitizenProfilePage />} />
            </Route>

            {/* Response Team Portal Routes (maps to /team and keeps /authority for compatibility) */}
            <Route path="/team" element={<RequireRole role="team"><AuthorityLayout /></RequireRole>}>
              <Route index element={<AuthorityDashboard />} />
              <Route path="location" element={<ResponderLocationPage />} />
            </Route>
            <Route path="/authority" element={<RequireRole role="team"><AuthorityLayout /></RequireRole>}>
              <Route index element={<AuthorityDashboard />} />
              <Route path="incidents" element={<LiveIncidentsPage />} />
              <Route path="incidents/create" element={<AuthorityIncidentCreatePage />} />
              <Route path="incidents/:id" element={<AuthorityIncidentDetailsPage />} />
              <Route path="incidents/:id/edit" element={<AuthorityIncidentEditPage />} />
              <Route path="map" element={<IncidentMapPage />} />
              <Route path="verification" element={<PendingVerificationPage />} />
              <Route path="teams" element={<ResponseTeamsPage />} />
              <Route path="sensors" element={<SensorMonitoringPage />} />
              <Route path="analytics" element={<AuthorityAnalyticsPage />} />
              <Route path="profile" element={<AuthorityProfilePage />} />
              <Route path="location" element={<ResponderLocationPage />} />
            </Route>

            {/* Admin Portal Routes */}
            <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="authorities" element={<AuthoritiesPage />} />
              <Route path="incidents" element={<AdminIncidentsPage />} />
              <Route path="map" element={<IncidentMapPage />} />
              <Route path="teams" element={<ResponseTeamsPage />} />
              <Route path="sensors" element={<SensorMonitoringPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
              <Route path="health" element={<AdminHealthPage />} />
            </Route>

            {/* Backward Compatibility Redirects */}
            <Route path="/incidents" element={<Navigate to="/authority/incidents" replace />} />
            <Route path="/incidents/create" element={<Navigate to="/citizen/report" replace />} />
            <Route path="/incidents/:id" element={<Navigate to="/authority/incidents/:id" replace />} />
            <Route path="/sensors" element={<Navigate to="/authority/sensors" replace />} />
            <Route path="/about" element={<AboutSystem />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
