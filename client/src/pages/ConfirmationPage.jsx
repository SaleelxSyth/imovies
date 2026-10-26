import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Button, Alert, Card } from 'react-bootstrap';
import api from '../services/api';
import PrintableTicket from '../components/ticket/PrintableTicket';
import Loader from '../components/common/Loader';

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${bookingId}`);
        setBooking(res.data.data);
      } catch (err) {
        console.error('Failed to load confirmed booking:', err);
        setError(err.response?.data?.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  if (loading) {
    return <Loader message="Verifying cinema pass..." fullScreen />;
  }

  if (error || !booking) {
    return (
      <Container className="px-lg-5 py-5 text-center">
        <Card className="imv-card p-5 mx-auto text-center" style={{ maxWidth: '520px' }}>
          <div className="text-warning mb-3">
            <i className="bi bi-ticket-detailed display-3"></i>
          </div>
          <h3 className="text-light fw-bold mb-2">Booking Not Found</h3>
          <p className="text-secondary small mb-4">
            {error || 'Unable to retrieve ticket pass for this reservation.'}
          </p>
          <Link to="/movies" className="btn btn-cinema-primary">
            Browse Movies
          </Link>
        </Card>
      </Container>
    );
  }

  // REQUIREMENT 7: Block direct URL access to the ticket for pending bookings
  if (booking.status === 'pending') {
    return (
      <Container className="px-lg-5 py-5 text-center">
        <Card className="imv-card p-5 mx-auto text-center border-warning border-opacity-40" style={{ maxWidth: '540px' }}>
          <div className="text-warning mb-3">
            <i className="bi bi-shield-lock display-3"></i>
          </div>
          <h3 className="text-light fw-bold mb-2">Ticket Pass Locked</h3>
          <p className="text-secondary small mb-4">
            This reservation is pending payment. The official cinema ticket pass is only unlocked and issued for confirmed bookings.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to={`/checkout/${booking._id}`} className="btn btn-cinema-primary">
              <i className="bi bi-credit-card me-2"></i> Complete Payment
            </Link>
            <Link to="/movies" className="btn btn-cinema-outline">
              Cancel
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  // Handle cancelled or refunded bookings
  if (booking.status === 'cancelled' || booking.status === 'refunded') {
    return (
      <Container className="px-lg-5 py-5 text-center">
        <Card className="imv-card p-5 mx-auto text-center border-secondary" style={{ maxWidth: '540px' }}>
          <div className="text-secondary mb-3">
            <i className="bi bi-x-octagon display-3"></i>
          </div>
          <h3 className="text-light fw-bold mb-2">Booking Cancelled</h3>
          <p className="text-secondary small mb-4">
            This booking was cancelled or refunded. Ticket pass is no longer active for admission.
          </p>
          <Link to="/movies" className="btn btn-cinema-primary">
            Browse Other Shows
          </Link>
        </Card>
      </Container>
    );
  }

  // Render confirmed ticket pass
  return (
    <Container className="px-lg-5 py-5 text-center">
      {/* Confirmation Banner */}
      <div className="mb-4">
        <div className="d-inline-flex p-3 rounded-circle bg-warning bg-opacity-15 text-warning mb-3 shadow">
          <i className="bi bi-check-circle-fill display-4"></i>
        </div>
        <h2 className="text-light fw-bold mb-2" style={{ letterSpacing: '0.04em' }}>
          Booking Confirmed!
        </h2>
        <p className="text-secondary" style={{ maxWidth: '520px', margin: '0 auto' }}>
          Your seats are confirmed. An email with your cinema pass and QR entry code has been dispatched.
        </p>
      </div>

      {/* Ticket Pass Component */}
      <PrintableTicket booking={booking} />

      {/* Navigation Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 gap-sm-3 mt-4 d-print-none">
        <Link to="/my-bookings" className="btn btn-cinema-outline w-100 w-sm-auto text-center" style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-ticket-perforated me-2"></i> View My Bookings
        </Link>
        <Link to="/movies" className="btn btn-cinema-primary w-100 w-sm-auto text-center" style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-compass me-2"></i> Browse More Movies
        </Link>
      </div>
    </Container>
  );
};

export default ConfirmationPage;
