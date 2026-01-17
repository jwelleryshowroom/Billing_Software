import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { TransactionProvider } from './context/TransactionContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/useTheme';
import { InstallProvider } from './context/InstallContext';
import { MilestoneProvider } from './context/MilestoneContext';
import { InventoryProvider } from './context/InventoryContext';
import { SettingsProvider } from './context/SettingsContext';
import { CustomerProvider } from './context/CustomerContext';
import MilestoneModal from './components/MilestoneModal';
import SettingsDrawer from './components/SettingsDrawer';
import DataManagementDrawer from './components/DataManagementDrawer';
import Home from './components/Home';
import Login from './components/Login';
import InstallPrompt from './components/InstallPrompt';
import PendingApproval from './components/PendingApproval';
import BottomNav from './components/BottomNav';
import HapticHUD from './components/HapticHUD';
import ErrorBoundary from './components/ErrorBoundary';
import { setupGlobalErrorListeners } from './utils/logger';
import SuspenseLoader from './components/SuspenseLoader'; // [NEW]

// [Refactor] Lazy Load Heavy Components for Performance
const Billing = lazy(() => import('./components/Billing'));
const Orders = lazy(() => import('./components/Orders'));
const Inventory = lazy(() => import('./components/Inventory'));
const PublicInvoice = lazy(() => import('./components/PublicInvoice'));
// Analytics & Reports are currently inside Home/Dashboard, but if referenced by Route, lazy load them.
// Currently MainLayout defines routes.

import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';

const MainLayout = () => {
  const location = useLocation();

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <Suspense fallback={<SuspenseLoader />}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/billing" element={<PageTransition><Billing /></PageTransition>} />
              <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
              <Route path="/inventory" element={<PageTransition><Inventory /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      <BottomNav />
    </div>
  );
};

// Wrapper to pass User Context to ErrorBoundary
const ErrorBoundaryWrapper = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    setupGlobalErrorListeners(user);
  }, [user]);

  return (
    <ErrorBoundary user={user}>
      {children}
    </ErrorBoundary>
  );
};

const ProtectedApp = () => {
  const { user, isAllowed, loading } = useAuth();

  if (loading || isAllowed === null) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <div style={{ fontWeight: 500, letterSpacing: '0.5px' }}>Loading Tracker...</div>
    </div>
  );

  if (!user) return <Login />;

  if (isAllowed === false) return <PendingApproval />;

  return (
    <TransactionProvider>
      <MilestoneProvider>
        <InventoryProvider>
          <SettingsProvider>
            <CustomerProvider>
              <InstallPrompt />
              <MainLayout />
              <SettingsDrawer />
              <HapticHUD />
              <DataManagementDrawer />
              <MilestoneModal />
            </CustomerProvider>
          </SettingsProvider>
        </InventoryProvider>
      </MilestoneProvider>
    </TransactionProvider>
  );
};

const AppContent = () => {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes>
        {/* Public Route - Lazy Loaded */}
        <Route path="/view/:orderId" element={<PublicInvoice />} />

        {/* Protected Routes */}
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InstallProvider>
          <ThemeProvider>
            <ToastProvider>
              <ErrorBoundaryWrapper>
                <AppContent />
              </ErrorBoundaryWrapper>
            </ToastProvider>
          </ThemeProvider>
        </InstallProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
