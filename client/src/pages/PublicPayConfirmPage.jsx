import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';

const PublicPayConfirmPage = () => {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null); // 'expired' | 'used' | 'cancelled' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/payments/pay-info/${token}`);

        if (res.data.success && res.data.status === 'active') {
          setSessionData(res.data.data);
        } else {
          setErrorStatus(res.data.status || 'error');
          setErrorMessage(res.data.message || 'Payment link is not valid.');
        }
      } catch (err) {
        const status = err.response?.data?.status || 'error';
        const msg = err.response?.data?.message || 'Invalid or expired payment link';
        setErrorStatus(status);
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInfo();
    }
  }, [token]);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const res = await api.post(`/payments/public-confirm/${token}`);
      if (res.data.success) {
        setConfirmed(true);
      } else {
        setErrorStatus('error');
        setErrorMessage(res.data.message || 'Failed to confirm payment');
      }
    } catch (err) {
      setErrorStatus('error');
      setErrorMessage(err.response?.data?.message || 'Payment confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      await api.post(`/payments/public-cancel/${token}`);
      setCancelled(true);
    } catch (err) {
      setErrorMessage('Could not cancel payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="py-5">
          <Spinner animation="border" variant="warning" className="mb-3" />
          <h5 className="text-light">Verifying payment session...</h5>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4 py-md-5">
      <Row className="justify-content-center">
        <Col lg={6} md={8} sm={10}>
          {/* Cinema Header */}
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center mb-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="me-2"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.45))' }}
              >
                <circle cx="16" cy="16" r="13" stroke="#f59e0b" strokeWidth="2.5" fill="#181820" />
                <circle cx="16" cy="16" r="4" fill="#f59e0b" />
                <circle cx="16" cy="8.5" r="2" fill="#f59e0b" />
                <circle cx="16" cy="23.5" r="2" fill="#f59e0b" />
                <circle cx="8.5" cy="16" r="2" fill="#f59e0b" />
                <circle cx="23.5" cy="16" r="2" fill="#f59e0b" />
              </svg>
              <span className="brand-logo-text fs-2">i<span className="gold-text">Movies</span> Pay</span>
            </div>
            <div className="text-muted small">Quick Secure Payment Portal</div>
          </div>

          {/* Confirmed State */}
          {confirmed && (
            <Card className="imv-card p-4 p-md-5 text-center border-success border-opacity-50">
              <div className="text-success mb-3">
                <i className="bi bi-check-circle-fill display-3"></i>
              </div>
              <h2 className="text-light fw-bold mb-2">Payment Confirmed!</h2>
              <p className="text-secondary mb-4">
                Your payment has been recorded and your tickets are officially booked. You can now view your cinema pass on your main booking screen.
              </p>
              <div className="p-3 rounded border border-secondary border-opacity-25 bg-black bg-opacity-30 mb-3 small text-muted">
                Booking Code: <strong className="text-light font-monospace">{sessionData?.bookingCode}</strong>
              </div>
            </Card>
          )}

          {/* Cancelled State */}
          {cancelled && (
            <Card className="imv-card p-4 p-md-5 text-center border-secondary border-opacity-50">
              <div className="text-warning mb-3">
                <i className="bi bi-x-circle display-3"></i>
              </div>
              <h2 className="text-light fw-bold mb-2">Payment Cancelled</h2>
              <p className="text-secondary mb-3">
                You cancelled this payment request. The reserved seats have been unlocked and released.
              </p>
            </Card>
          )}

          {/* Expired / Used / Error Message State */}
          {!confirmed && !cancelled && errorStatus && (
            <Card className="imv-card p-4 p-md-5 text-center border-warning border-opacity-50">
              <div className="text-warning mb-3">
                <i className="bi bi-exclamation-triangle-fill display-3"></i>
              </div>
              <h3 className="text-light fw-bold mb-2">
                {errorStatus === 'expired'
                  ? 'Payment Link Expired'
                  : errorStatus === 'used' || errorStatus === 'already_confirmed'
                  ? 'Payment Already Processed'
                  : 'Invalid Payment Session'}
              </h3>
              <p className="text-secondary mb-4">
                {errorMessage || 'This payment link has expired or has already been used.'}
              </p>
              <div>
                <Link to="/" className="btn btn-cinema-outline">
                  <i className="bi bi-house me-1"></i> Go to Homepage
                </Link>
              </div>
            </Card>
          )}

          {/* Active Payment Session State */}
          {!confirmed && !cancelled && !errorStatus && sessionData && (
            <Card className="imv-card p-4 p-md-5 shadow-lg">
              <div className="text-center pb-3 border-bottom border-secondary border-opacity-25 mb-4">
                <span className="badge badge-cinema-gold text-uppercase mb-2">Instant Ticket Checkout</span>
                <h3 className="text-light fw-bold mb-1">{sessionData.movieTitle}</h3>
                <div className="text-muted small">
                  {sessionData.theatreName} ({sessionData.screenName})
                </div>
                <div className="text-warning small fw-semibold mt-1">
                  {sessionData.date} • {sessionData.startTime}
                </div>
              </div>

              {/* Order breakdown */}
              <div className="p-3 rounded mb-4 border border-secondary border-opacity-25" style={{ background: '#121217' }}>
                <div className="d-flex justify-content-between text-secondary small mb-2">
                  <span>Booking Reference</span>
                  <span className="text-light fw-bold font-monospace">{sessionData.bookingCode}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary small mb-2">
                  <span>Reserved Seats</span>
                  <span className="text-warning fw-bold">{sessionData.seats?.join(', ')}</span>
                </div>
                <div className="d-flex justify-content-between text-light fw-bold fs-4 pt-3 border-top border-secondary border-opacity-25">
                  <span>Amount to Pay</span>
                  <span className="text-warning">₹{sessionData.amount}</span>
                </div>
              </div>

              {/* Confirm & Cancel Buttons */}
              <div className="d-grid gap-3">
                <Button
                  variant="cinema-primary"
                  className="btn-cinema-primary py-3 fs-5"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-2"></i> Confirm Payment (₹{sessionData.amount})
                    </>
                  )}
                </Button>

                <Button
                  variant="outline-secondary"
                  className="py-2"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>

              <div className="text-center text-muted small mt-4" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-shield-lock me-1"></i> End-to-end verified cinema transaction.
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PublicPayConfirmPage;
