import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/layouts/ProtectedRoute';
import { PublicOnlyRoute } from '@/layouts/PublicOnlyRoute';
import { Loader2 } from 'lucide-react';

// Lazy-loaded routes for code-splitting
const HomePage = lazy(() => import('@/pages/Home').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('@/pages/Login').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/pages/Signup').then((m) => ({ default: m.SignupPage })));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallback').then((m) => ({ default: m.AuthCallbackPage })));
const DashboardPage = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.DashboardPage })));
const ProfilePage = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.ProfilePage })));
const ResumeStudioPage = lazy(() => import('@/pages/ResumeStudio').then((m) => ({ default: m.ResumeStudioPage })));
const SavedPage = lazy(() => import('@/pages/Saved').then((m) => ({ default: m.SavedPage })));
const NotificationsPage = lazy(() => import('@/pages/Notifications').then((m) => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFoundPage })));

function RouteFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F7FAF8] dark:bg-slate-950">
      <Loader2 className="h-8 w-8 animate-spin text-[#16A36A]" />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public Landing */}
            <Route path="/" element={<HomePage />} />

            {/* Public Auth Routes */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* OAuth Callback */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/resumes" element={<ResumeStudioPage />} />
              <Route path="/resume" element={<Navigate to="/profile/resumes" replace />} />
              <Route path="/resume/*" element={<Navigate to="/profile/resumes" replace />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
