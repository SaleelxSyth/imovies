import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';

const CheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300s)
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  // 1. Fetch Booking and initialize Payment Order/Session
  useEffect(() => {
    let isMounted = true;

    const initPayment = async () => {
      try {
        setLoading(true);

        // Fetch booking
        const bookingRes = await api.get(`/bookings/${bookingId}`);
        const currentBooking = bookingRes.data.data;

        if (!isMounted) return;
        setBooking(currentBooking);

        // If booking is already confirmed, jump straight to ticket
        if (currentBooking.status === 'confirmed') {
          navigate(`/confirmation/${bookingId}`, { replace: true });
          return;
        }

        // If booking is already cancelled, show timeout state
        if (currentBooking.status === 'cancelled' || currentBooking.status === 'refunded') {
          setIsTimedOut(true);
          setLoading(false);
          return;
        }

        // Initialize / fetch payment order
        const orderRes = await api.post('/payments/create-order', { bookingId });
        if (!isMounted) return;

        const session = orderRes.data.data;
        setPaymentSession(session);

        // Compute remaining seconds from session expiresAt if available
        if (session.expiresAt) {
          const expiresDate = new Date(session.expiresAt);
          const diffSeconds = Math.max(0, Math.floor((expiresDate.getTime() - Date.now()) / 1000));
          setTimeLeft(diffSeconds > 0 ? diffSeconds : 300);
        } else {
          setTimeLeft(300);
        }
      } catch (err) {
        console.error('Checkout init error:', err);
        toast.error(err.response?.data?.message || 'Failed to initialize payment session');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initPayment();

    return () => {
      isMounted = false;
    };
  }, [bookingId, navigate]);

  // 2. Countdown Timer (5-minute TTL)
  useEffect(() => {
    if (loading || isTimedOut) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isTimedOut]);

  // 3. Status Polling (every 2 seconds) & Socket listener
  useEffect(() => {
    if (loading || isTimedOut) return;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/payments/status/${bookingId}`);
        const statusData = res.data.data;

        if (statusData.isConfirmed || statusData.bookingStatus === 'confirmed') {
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          navigate(`/confirmation/${bookingId}`, { replace: true });
        } else if (statusData.isCancelled || statusData.isExpired) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimedOut(true);
        }
      } catch (err) {
        // Silently continue polling
      }
    };

    // Poll every 2000ms
    pollRef.current = setInterval(checkStatus, 2000);

    // Socket.io real-time listener for instant notification
    const socket = getSocket();
    const handlePaymentConfirmed = (payload) => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      navigate(`/confirmation/${bookingId}`, { replace: true });
    };

    const handlePaymentCancelled = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimedOut(true);
    };

    socket.on(`paymentConfirmed:${bookingId}`, handlePaymentConfirmed);
    socket.on(`paymentCancelled:${bookingId}`, handlePaymentCancelled);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      socket.off(`paymentConfirmed:${bookingId}`, handlePaymentConfirmed);
      socket.off(`paymentCancelled:${bookingId}`, handlePaymentCancelled);
    };
  }, [bookingId, loading, isTimedOut, navigate]);

  // Handle timeout expiration on server and release seats
  const handleExpire = async () => {
    setIsTimedOut(true);
    try {
      await api.post(`/payments/expire/${bookingId}`);
    } catch (e) {
      console.warn('Expire call failed:', e);
    }
  };

  // User manually cancels payment
  const handleCancelPayment = async () => {
    try {
      setCancelling(true);
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      await api.post(`/payments/expire/${bookingId}`);
      setIsTimedOut(true);
    } catch (err) {
      toast.error('Could not cancel payment');
    } finally {
      setCancelling(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return <Loader message="Generating secure payment session..." fullScreen />;
  }

  const show = booking?.show || {};
  const movie = show?.movie || {};
  const theatre = show?.theatre || {};
  const showId = show?._id || '';

  // Render Timed Out / Cancelled Screen with "Try again" button
  if (isTimedOut) {
    return (
      <Container className="px-lg-5 py-5 text-center">
        <Row className="justify-content-center">
          <Col lg={6} md={8}>
            <Card className="imv-card p-5 text-center border-warning border-opacity-50">
              <div className="mb-3 text-warning">
                <i className="bi bi-hourglass-bottom display-3"></i>
              </div>
              <h2 className="text-light fw-bold mb-2">Payment timed out</h2>
              <p className="text-secondary mb-4" style={{ maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                The 5-minute payment window has elapsed or the reservation was cancelled. Your seat lock has been released.
              </p>
              <div>
                <Button
                  variant="cinema-primary"
                  className="btn-cinema-primary px-4 py-2"
                  onClick={() => navigate(showId ? `/shows/${showId}/seats` : '/movies')}
                >
                  <i className="bi bi-arrow-counterclockwise me-2"></i> Try again
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // QR Code Link construction
  const publicClientUrl = import.meta.env.VITE_PUBLIC_CLIENT_URL || window.location.origin;
  const qrToken = paymentSession?.token || '';
  const qrLink = qrToken ? `${publicClientUrl}/pay/confirm/${qrToken}` : '';

  return (
    <Container className="px-lg-5 py-5">
      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          {/* Top navigation link */}
          <div className="mb-3">
            <Link
              to={showId ? `/shows/${showId}/seats` : '/movies'}
              className="text-secondary small text-decoration-none"
            >
              <i className="bi bi-chevron-left me-1"></i> Back to Seat Selection
            </Link>
          </div>

          {/* 5-minute Countdown Timer Banner */}
          <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between p-3 mb-4 rounded border border-warning border-opacity-30 bg-black bg-opacity-40 gap-2 text-center text-sm-start">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-clock-history fs-4 text-warning"></i>
              <div>
                <strong className="text-light">Seats Locked</strong>
                <div className="text-muted small">Complete payment before timer expires</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 mt-1 mt-sm-0">
              <span className="text-muted small">Expires in:</span>
              <span
                className="fs-4 fw-bold font-monospace px-3 py-1 rounded border border-warning border-opacity-40"
                style={{ background: '#1c1c24', color: '#f59e0b' }}
              >
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>

          {/* Main Payment Card */}
          <Card className="imv-card p-3 p-md-5 mb-4">
            {/* Movie Name & Details */}
            <div className="border-bottom border-secondary border-opacity-25 pb-4 mb-4">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                <div>
                  <span className="badge badge-cinema-gold mb-2 text-uppercase">Payment Required</span>
                  <h2 className="text-light fw-bold mb-1" style={{ letterSpacing: '0.03em' }}>
                    {movie.title || 'Movie Reservation'}
                  </h2>
                  <div className="text-muted small">
                    {theatre.name} ({show.screenName}) • <span className="text-warning fw-semibold">{show.date} at {show.startTime}</span>
                  </div>
                </div>

                <div className="text-sm-end">
                  <div className="text-muted small">Booking Code</div>
                  <div className="text-light fw-bold font-monospace fs-5">{booking.bookingCode}</div>
                </div>
              </div>
            </div>

            {/* Seats & Total Amount */}
            <div className="p-3 rounded mb-4 border border-secondary border-opacity-25" style={{ background: '#121217' }}>
              <div className="row g-3 align-items-center">
                <Col sm={6}>
                  <div className="text-muted small mb-1">RESERVED SEATS</div>
                  <div className="d-flex flex-wrap gap-1">
                    {booking.seats?.map((seat) => (
                      <span key={seat} className="badge bg-warning text-dark fw-bold px-2 py-1 fs-6">
                        {seat}
                      </span>
                    ))}
                  </div>
                </Col>

                <Col sm={6} className="text-sm-end">
                  <div className="text-muted small mb-1">TOTAL AMOUNT DUE</div>
                  <div className="text-warning fw-bold fs-3">
                    ₹{booking.totalAmount}
                    <small className="text-muted fs-6 fw-normal ms-1">(incl. taxes)</small>
                  </div>
                </Col>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="text-center py-2">
              <h5 className="text-light fw-bold mb-3" style={{ letterSpacing: '0.04em' }}>
                Scan and pay to confirm your booking
              </h5>

              {qrLink ? (
                <div className="d-inline-flex justify-content-center p-3 bg-white rounded-3 shadow-lg mb-3" style={{ maxWidth: '230px', width: '100%' }}>
                  <QRCodeSVG
                    value={qrLink}
                    size={200}
                    style={{ width: '100%', height: 'auto', maxWidth: '200px' }}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#0c0c10"
                  />
                </div>
              ) : (
                <div className="p-4 text-muted">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating payment QR...
                </div>
              )}

              <p className="text-muted small mb-3 px-2" style={{ maxWidth: '440px', margin: '0 auto' }}>
                Open your phone's camera or QR scanner to open the confirmation page and complete payment.
              </p>

              {/* Direct Link Helper for local testing / clicking directly */}
              {qrLink && (
                <div className="mb-4">
                  <a
                    href={qrLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="small text-warning text-decoration-none d-inline-block py-1"
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i> Or click here to open payment link directly
                  </a>
                </div>
              )}

              {/* Status Indicator */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-black bg-opacity-40 border border-secondary border-opacity-25 small text-secondary mb-4">
                <span className="spinner-grow spinner-grow-sm text-warning" role="status"></span>
                <span>Waiting for payment confirmation...</span>
              </div>

              {/* Cancel Button */}
              <div className="w-100">
                <Button
                  variant="outline-secondary"
                  className="w-100 py-2"
                  style={{ minHeight: '44px', fontSize: '14px' }}
                  onClick={handleCancelPayment}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Payment & Release Seats'}
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;
