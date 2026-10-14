import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { Landing } from './pages/Landing/Landing';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { AnalyzeEmail } from './pages/AnalyzeEmail/AnalyzeEmail';
import { ResultDetails } from './pages/ResultDetails/ResultDetails';
import { History } from './pages/History/History';
import { Analytics } from './pages/Analytics/Analytics';
import { Profile } from './pages/Profile/Profile';
import { Admin } from './pages/Admin/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Protected app routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analyze" element={<AnalyzeEmail />} />
              <Route path="/result/:id" element={<ResultDetails />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admin route */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Admin />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
