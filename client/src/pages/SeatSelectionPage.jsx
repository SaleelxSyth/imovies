import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSeatsForShow,
  toggleSeatSelection,
  clearSelectedSeats,
  lockSelectedSeats,
  handleSocketSeatsLocked,
  handleSocketSeatsReleased,
  handleSocketSeatsBooked
} from '../redux/slices/seatSlice';
import { createBooking } from '../redux/slices/bookingSlice';
import { getSocket, joinShowRoom, leaveShowRoom } from '../services/socket';
import api from '../services/api';
import SeatGrid from '../components/booking/SeatGrid';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';

const SeatSelectionPage = () => {
  const { id: showId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { seats, selectedSeats, selectedSeatObjects, loading, lockLoading, error } = useSelector(
    (state) => state.seats
  );
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [showDetails, setShowDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  // 1. Fetch Show Details and Seats
  useEffect(() => {
    const loadDetails = async () => {
      try {
        setDetailsLoading(true);
        const res = await api.get(`/shows/${showId}`);
        setShowDetails(res.data.data);
      } catch (err) {
        toast.error('Failed to load show details');
      } finally {
        setDetailsLoading(false);
      }
    };

    loadDetails();
    dispatch(clearSelectedSeats());
    dispatch(fetchSeatsForShow(showId));
  }, [dispatch, showId]);

  // 2. Real-Time Socket.io Connection & Room Listener
  useEffect(() => {
    const socket = getSocket();
    joinShowRoom(showId);

    // Socket Event Listeners
    socket.on('seatsLocked', (payload) => {
      if (payload.showId === showId) {
        dispatch(handleSocketSeatsLocked(payload));
      }
    });

    socket.on('seatsReleased', (payload) => {
      if (payload.showId === showId) {
        dispatch(handleSocketSeatsReleased(payload));
      }
    });

    socket.on('seatsBooked', (payload) => {
      if (payload.showId === showId) {
        dispatch(handleSocketSeatsBooked(payload));
      }
    });

    return () => {
      leaveShowRoom(showId);
      socket.off('seatsLocked');
      socket.off('seatsReleased');
      socket.off('seatsBooked');
    };
  }, [dispatch, showId]);

  const handleSeatClick = (seat) => {
    dispatch(toggleSeatSelection(seat));
  };

  const handleProceedToCheckout = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to complete your reservation');
      navigate(`/login?redirect=/shows/${showId}/seats`);
      return;
    }

    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat');
      return;
    }

    try {
      // 1. Atomically lock seats on the backend
      await dispatch(lockSelectedSeats({ showId, seats: selectedSeats })).unwrap();

      // 2. Initialize pending booking
      const booking = await dispatch(
        createBooking({ showId, seats: selectedSeats })
      ).unwrap();

      toast.info('Seats locked! Please complete payment to confirm your booking.');
      navigate(`/checkout/${booking._id}`);
    } catch (err) {
      toast.error(err || 'Failed to lock selected seats. They may have just been taken.');
      // Refresh seat layout
      dispatch(fetchSeatsForShow(showId));
    }
  };

  if (detailsLoading || loading) {
    return <Loader message="Setting up live seat map..." fullScreen />;
  }

  const movie = showDetails?.movie || {};
  const theatre = showDetails?.theatre || {};

  const totalAmount = selectedSeatObjects.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="seat-selection-page pb-5 mb-5">
      {/* Top Header Bar */}
      <div className="bg-black bg-opacity-40 border-bottom border-secondary border-opacity-25 py-3">
        <Container className="px-3 px-lg-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <Link to={`/movies/${movie._id}`} className="text-secondary small text-decoration-none mb-1 d-inline-block">
                <i className="bi bi-chevron-left me-1"></i> Back to Movie
              </Link>
              <h4 className="text-light fw-bold mb-0">{movie.title}</h4>
              <div className="text-muted small">
                {theatre.name} • {showDetails?.screenName} | <span className="text-warning fw-semibold">{showDetails?.date} at {showDetails?.startTime}</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="text-end d-none d-sm-block">
                <div className="text-muted small">Real-Time Sync</div>
                <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                  <span className="spinner-grow spinner-grow-sm" role="status" style={{ width: '8px', height: '8px' }}></span>
                  LIVE CONNECTED
                </Badge>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Seat Grid Section */}
      <Container className="px-3 px-lg-5 my-4">
        {error && (
          <Alert variant="danger" className="mb-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </Alert>
        )}

        <Card className="imv-card p-2 p-sm-4 overflow-hidden">
          <SeatGrid
            seats={seats}
            selectedSeats={selectedSeats}
            onSeatClick={handleSeatClick}
            currentUserId={user?.id || user?._id}
          />
        </Card>
      </Container>

      {/* Sticky Bottom Booking Bar */}
      {selectedSeats.length > 0 && (
        <div className="sticky-booking-bar">
          <Container className="px-3 px-lg-5">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="flex-grow-1 overflow-hidden pe-2">
                <div className="text-muted small text-truncate">
                  Selected: <strong className="text-warning">{selectedSeats.join(', ')}</strong> ({selectedSeats.length}/8)
                </div>
                <div className="text-light fw-bold fs-5">
                  Total: <span className="text-warning fw-bold">₹{totalAmount}</span>
                  <small className="text-muted fs-6 ms-1 d-none d-sm-inline">(incl. taxes)</small>
                </div>
              </div>

              <div className="flex-shrink-0">
                <Button
                  variant="cinema-primary"
                  className="btn-cinema-primary px-3 px-sm-4 py-2"
                  style={{ minHeight: '44px', fontSize: '15px' }}
                  onClick={handleProceedToCheckout}
                  disabled={lockLoading}
                >
                  {lockLoading ? 'Locking...' : 'Book'} <i className="bi bi-arrow-right ms-1"></i>
                </Button>
              </div>
            </div>
          </Container>
        </div>
      )}
    </div>
  );
};

export default SeatSelectionPage;
