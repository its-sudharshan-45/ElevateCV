import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/layouts/ProtectedRoute';
import { PublicOnlyRoute } from '@/layouts/PublicOnlyRoute';

// Pages
import { HomePage } from '@/pages/Home';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';
import { AuthCallbackPage } from '@/pages/AuthCallback';
import { DashboardPage } from '@/pages/Dashboard';
import { ProfilePage } from '@/pages/Profile';
import { ResumeStudioPage } from '@/pages/ResumeStudio';
import { SavedPage } from '@/pages/Saved';
import { NotificationsPage } from '@/pages/Notifications';
import { SettingsPage } from '@/pages/Settings';
import { NotFoundPage } from '@/pages/NotFound';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
