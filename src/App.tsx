import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './lib/LanguageContext.tsx';
import { AuthProvider, useAuth } from './lib/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { EmergencyBanner } from './components/EmergencyBanner.tsx';
import { Footer } from './components/Footer.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';

// Public & Common Views
import { LandingView } from './views/LandingView.tsx';
import { LoginView } from './views/LoginView.tsx';
import { RegisterView } from './views/RegisterView.tsx';
import { EmergencyView } from './views/EmergencyView.tsx';
import { PrivacyTermsView } from './views/PrivacyTermsView.tsx';
import { AccountView } from './views/AccountView.tsx';

// Patient Views
import { PatientDashboardView } from './views/patient/PatientDashboardView.tsx';
import { PatientAppointmentsView } from './views/patient/PatientAppointmentsView.tsx';
import { PatientPrescriptionsView } from './views/patient/PatientPrescriptionsView.tsx';
import { PatientRecordsView } from './views/patient/PatientRecordsView.tsx';
import { PatientRemindersView } from './views/patient/PatientRemindersView.tsx';
import { PatientMessagesView } from './views/patient/PatientMessagesView.tsx';

// Doctor Views
import { DoctorDashboardView } from './views/doctor/DoctorDashboardView.tsx';
import { DoctorAppointmentsView } from './views/doctor/DoctorAppointmentsView.tsx';
import { DoctorPatientsView } from './views/doctor/DoctorPatientsView.tsx';
import { DoctorConsultationView } from './views/doctor/DoctorConsultationView.tsx';
import { DoctorAvailabilityView } from './views/doctor/DoctorAvailabilityView.tsx';

// Health Worker Views
import { HealthWorkerDashboardView } from './views/healthworker/HealthWorkerDashboardView.tsx';
import { HealthWorkerAssistedRegView } from './views/healthworker/HealthWorkerAssistedRegView.tsx';
import { HealthWorkerPatientsView } from './views/healthworker/HealthWorkerPatientsView.tsx';
import { HealthWorkerCallbacksView } from './views/healthworker/HealthWorkerCallbacksView.tsx';
import { HealthWorkerActivityView } from './views/healthworker/HealthWorkerActivityView.tsx';

// Admin Views
import { AdminDashboardView } from './views/admin/AdminDashboardView.tsx';
import { AdminUsersView } from './views/admin/AdminUsersView.tsx';
import { AdminAppointmentsView } from './views/admin/AdminAppointmentsView.tsx';
import { AdminCallbacksView } from './views/admin/AdminCallbacksView.tsx';
import { AdminCommunicationsView } from './views/admin/AdminCommunicationsView.tsx';
import { AdminAuditLogsView } from './views/admin/AdminAuditLogsView.tsx';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Guard Helper
  const requireRoleOrRedirect = (allowedRole: string, component: React.ReactNode) => {
    if (isLoading) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-500">
          Verifying security credentials...
        </div>
      );
    }
    if (!user) {
      return <LoginView navigate={navigate} />;
    }
    // Doctor Admin has dual authority over both doctor and admin views
    if (user.role === 'doctor_admin') {
      if (allowedRole === 'doctor' || allowedRole === 'admin') {
        return component;
      }
    }
    if (user.role !== allowedRole && user.role !== 'admin') {
      return <PrivacyTermsView type="unauthorized" navigate={navigate} />;
    }
    return component;
  };

  const renderCurrentView = () => {
    // Public routes
    if (currentPath === '/' || currentPath === '') {
      return <LandingView navigate={navigate} />;
    }
    if (currentPath === '/login') {
      return <LoginView navigate={navigate} />;
    }
    if (currentPath === '/register') {
      return <RegisterView navigate={navigate} />;
    }
    if (currentPath === '/forgot-password' || currentPath === '/reset-password') {
      return (
        <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4 text-xs">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Password Recovery</h2>
          <p className="text-slate-500">
            For security, rural accounts can be reset by providing your verified phone number or by asking your assigned ASHA worker to verify your identity.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        </div>
      );
    }
    if (currentPath === '/emergency') {
      return <EmergencyView navigate={navigate} />;
    }
    if (currentPath === '/privacy') {
      return <PrivacyTermsView type="privacy" navigate={navigate} />;
    }
    if (currentPath === '/terms') {
      return <PrivacyTermsView type="terms" navigate={navigate} />;
    }
    if (currentPath === '/unauthorized') {
      return <PrivacyTermsView type="unauthorized" navigate={navigate} />;
    }
    if (currentPath === '/offline') {
      return <PrivacyTermsView type="offline" navigate={navigate} />;
    }
    if (currentPath === '/account' || currentPath === '/notifications') {
      return <AccountView navigate={navigate} />;
    }

    // Patient Routes
    if (currentPath === '/patient/dashboard') {
      return requireRoleOrRedirect('patient', <PatientDashboardView navigate={navigate} />);
    }
    if (currentPath === '/patient/profile' || currentPath === '/patient/settings') {
      return requireRoleOrRedirect('patient', <AccountView navigate={navigate} />);
    }
    if (currentPath === '/patient/appointments') {
      return requireRoleOrRedirect('patient', <PatientAppointmentsView navigate={navigate} />);
    }
    if (currentPath === '/patient/appointments/new') {
      return requireRoleOrRedirect('patient', <PatientAppointmentsView navigate={navigate} openNewModalByDefault={true} />);
    }
    if (currentPath.startsWith('/patient/appointments/')) {
      return requireRoleOrRedirect('patient', <PatientAppointmentsView navigate={navigate} />);
    }
    if (currentPath === '/patient/prescriptions') {
      return requireRoleOrRedirect('patient', <PatientPrescriptionsView navigate={navigate} />);
    }
    if (currentPath.startsWith('/patient/records')) {
      return requireRoleOrRedirect('patient', <PatientRecordsView navigate={navigate} />);
    }
    if (currentPath === '/patient/reminders') {
      return requireRoleOrRedirect('patient', <PatientRemindersView navigate={navigate} />);
    }
    if (currentPath.startsWith('/patient/messages')) {
      return requireRoleOrRedirect('patient', <PatientMessagesView navigate={navigate} />);
    }

    // Doctor Routes
    if (currentPath === '/doctor/dashboard') {
      return requireRoleOrRedirect('doctor', <DoctorDashboardView navigate={navigate} />);
    }
    if (currentPath === '/doctor/appointments') {
      return requireRoleOrRedirect('doctor', <DoctorAppointmentsView navigate={navigate} />);
    }
    if (currentPath === '/doctor/patients') {
      return requireRoleOrRedirect('doctor', <DoctorPatientsView navigate={navigate} />);
    }
    if (currentPath.startsWith('/doctor/patients/')) {
      const pId = currentPath.split('/')[3];
      return requireRoleOrRedirect('doctor', <DoctorPatientsView patientId={pId} navigate={navigate} />);
    }
    if (currentPath.startsWith('/doctor/consultations/')) {
      const aptId = currentPath.split('/')[3];
      return requireRoleOrRedirect('doctor', <DoctorConsultationView appointmentId={aptId} navigate={navigate} />);
    }
    if (currentPath === '/doctor/availability') {
      return requireRoleOrRedirect('doctor', <DoctorAvailabilityView navigate={navigate} />);
    }
    if (currentPath === '/doctor/messages') {
      return requireRoleOrRedirect('doctor', <PatientMessagesView navigate={navigate} />);
    }
    if (currentPath === '/doctor/profile') {
      return requireRoleOrRedirect('doctor', <AccountView navigate={navigate} />);
    }

    // Health Worker Routes
    if (currentPath === '/health-worker/dashboard') {
      return requireRoleOrRedirect('health_worker', <HealthWorkerDashboardView navigate={navigate} />);
    }
    if (currentPath === '/health-worker/patients') {
      return requireRoleOrRedirect('health_worker', <HealthWorkerPatientsView navigate={navigate} />);
    }
    if (currentPath === '/health-worker/patients/new') {
      return requireRoleOrRedirect('health_worker', <HealthWorkerAssistedRegView navigate={navigate} />);
    }
    if (currentPath.startsWith('/health-worker/patients/')) {
      return requireRoleOrRedirect('health_worker', <HealthWorkerPatientsView navigate={navigate} />);
    }
    if (currentPath.startsWith('/health-worker/callbacks')) {
      return requireRoleOrRedirect('health_worker', <HealthWorkerCallbacksView navigate={navigate} />);
    }
    if (currentPath === '/health-worker/follow-ups' || currentPath === '/health-worker/activity') {
      return requireRoleOrRedirect('health_worker', <HealthWorkerActivityView navigate={navigate} />);
    }
    if (currentPath === '/health-worker/profile') {
      return requireRoleOrRedirect('health_worker', <AccountView navigate={navigate} />);
    }

    // Administrator Routes
    if (currentPath === '/admin/dashboard') {
      return requireRoleOrRedirect('admin', <AdminDashboardView navigate={navigate} />);
    }
    if (currentPath.startsWith('/admin/users')) {
      return requireRoleOrRedirect('admin', <AdminUsersView navigate={navigate} />);
    }
    if (currentPath === '/admin/appointments') {
      return requireRoleOrRedirect('admin', <AdminAppointmentsView navigate={navigate} />);
    }
    if (currentPath === '/admin/callbacks') {
      return requireRoleOrRedirect('admin', <AdminCallbacksView navigate={navigate} />);
    }
    if (currentPath === '/admin/communications') {
      return requireRoleOrRedirect('admin', <AdminCommunicationsView navigate={navigate} />);
    }
    if (currentPath === '/admin/audit-logs') {
      return requireRoleOrRedirect('admin', <AdminAuditLogsView navigate={navigate} />);
    }

    // Fallback
    return <LandingView navigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      <EmergencyBanner />
      <Navbar currentPath={currentPath} navigate={navigate} />

      <main className="grow">
        {renderCurrentView()}
      </main>

      <Footer navigate={navigate} />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
