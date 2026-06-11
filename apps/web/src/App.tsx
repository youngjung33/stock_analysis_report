import { useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wireAppServices } from './bootstrap';
import { AuthProvider } from './presentation/hooks/useAuth';
import { ServicesProvider } from './presentation/hooks/useServices';
import { ProtectedRoute } from './presentation/routes/ProtectedRoute';
import { LoginPage } from './presentation/pages/LoginPage';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { TransactionsPage } from './presentation/pages/TransactionsPage';

const queryClient = new QueryClient();

export function App() {
  const services = useMemo(() => wireAppServices(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ServicesProvider services={services}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ServicesProvider>
    </QueryClientProvider>
  );
}
