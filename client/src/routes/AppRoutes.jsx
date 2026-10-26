import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import MoviesPage from '../pages/MoviesPage';
import MovieDetailPage from '../pages/MovieDetailPage';
import SeatSelectionPage from '../pages/SeatSelectionPage';
import CheckoutPage from '../pages/CheckoutPage';
import ConfirmationPage from '../pages/ConfirmationPage';
import PublicPayConfirmPage from '../pages/PublicPayConfirmPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import MyBookingsPage from '../pages/MyBookingsPage';
import WatchlistPage from '../pages/WatchlistPage';
import NotificationsPage from '../pages/NotificationsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import { ProtectedRoute, AdminRoute } from '../components/common/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/movies" element={<MoviesPage />} />
      <Route path="/movies/:id" element={<MovieDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Seat Selection (Interactive) */}
      <Route path="/shows/:id/seats" element={<SeatSelectionPage />} />

      {/* Public QR Pay Confirmation Page (no login required) */}
      <Route path="/pay/confirm/:token" element={<PublicPayConfirmPage />} />

      {/* User Protected Routes */}
      <Route
        path="/checkout/:bookingId"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/confirmation/:bookingId"
        element={
          <ProtectedRoute>
            <ConfirmationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <WatchlistPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      {/* Fallback 404 Route */}
      <Route
        path="*"
        element={
          <div className="text-center py-5">
            <h1 className="display-1 fw-bold text-danger">404</h1>
            <h4 className="text-light">Page Not Found</h4>
            <p className="text-muted">The requested cinema reel does not exist.</p>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
