import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import HomePage from './pages/HomePage';

// Each page becomes its own JS chunk, downloaded the first time it's visited.
// The home page is imported normally because almost everyone lands there first.
const DoctorsPage = lazy(() => import('./features/doctors/DoctorsPage'));
const DoctorDetailPage = lazy(() => import('./features/doctors/DoctorDetailPage'));
const LabTestsPage = lazy(() => import('./features/labs/LabTestsPage'));
const MedicinesPage = lazy(() => import('./features/pharmacy/MedicinesPage'));
const CartPage = lazy(() => import('./features/cart/CartPage'));
const BookingsPage = lazy(() => import('./features/bookings/BookingsPage'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="doctors/:doctorId" element={<DoctorDetailPage />} />
        <Route path="lab-tests" element={<LabTestsPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="bookings" element={<BookingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
