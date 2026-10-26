import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Tabs, Tab, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyBookings, cancelBooking } from '../redux/slices/bookingSlice';
import PrintableTicket from '../components/ticket/PrintableTicket';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';

const MyBookingsPage = () => {
  const dispatch = useDispatch();
  const { myBookings, loading } = useSelector((state) => state.booking);

  const [activeTab, setActiveTab] = useState('upcoming');
  const [ticketModalBooking, setTicketModalBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    dispatch(fetchMyBookings({ type: activeTab }));
  }, [dispatch, activeTab]);

  const handleCancelClick = (booking) => {
    setCancellingBooking(booking);
    setCancelReason('Change of plans');
  };

  const confirmCancellation = async () => {
    if (!cancellingBooking) return;
    try {
      setIsCancelling(true);
      const res = await dispatch(
        cancelBooking({
          bookingId: cancellingBooking._id,
          reason: cancelReason
        })
      ).unwrap();

      toast.success(
        res.refundEligible
          ? `Booking cancelled. Refund of ₹${res.refundAmount} initiated.`
          : 'Booking cancelled.'
      );
      setCancellingBooking(null);
      dispatch(fetchMyBookings({ type: activeTab }));
    } catch (err) {
      toast.error(err || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Container className="px-lg-5 py-5">
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-25 pb-3">
        <div>
          <h2 className="text-light fw-bold mb-1">My Bookings</h2>
          <div className="text-muted small">View your tickets, reservation details, and order history</div>
        </div>
        <Link to="/movies" className="btn btn-sm btn-cinema-primary">
          <i className="bi bi-plus-circle me-1"></i> Book New Show
        </Link>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 border-secondary border-opacity-50"
      >
        <Tab eventKey="upcoming" title="Upcoming Shows" />
        <Tab eventKey="past" title="Past Bookings & Cancelled" />
      </Tabs>

      {loading ? (
        <Loader message="Loading your bookings..." />
      ) : myBookings.length === 0 ? (
        <div className="text-center py-5 bg-dark rounded border border-secondary border-opacity-25">
          <i className="bi bi-ticket-perforated fs-1 text-secondary mb-3 d-inline-block"></i>
          <h4 className="text-light">No {activeTab} bookings found</h4>
          <p className="text-muted small mb-3">You haven't made any reservations in this category yet.</p>
          <Link to="/movies" className="btn btn-cinema-primary">
            Browse Movies & Schedule
          </Link>
        </div>
      ) : (
        <Row className="g-4">
          {myBookings.map((b) => {
            const show = b.show || {};
            const movie = show.movie || {};
            const theatre = show.theatre || {};

            return (
              <Col key={b._id} lg={6}>
                <Card className="imv-card p-3 h-100">
                  <div className="d-flex gap-3">
                    <img
                      src={movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'}
                      alt={movie.title}
                      className="rounded"
                      style={{ width: '90px', height: '130px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h5 className="text-light fw-bold mb-0 text-truncate" style={{ maxWidth: '220px' }}>
                          {movie.title}
                        </h5>
                        <Badge
                          bg={
                            b.status === 'confirmed'
                              ? 'success'
                              : b.status === 'refunded'
                              ? 'info'
                              : b.status === 'cancelled'
                              ? 'secondary'
                              : 'warning'
                          }
                          className="text-uppercase"
                        >
                          {b.status}
                        </Badge>
                      </div>

                      <div className="text-muted small mb-1">
                        {theatre.name} ({show.screenName})
                      </div>

                      <div className="text-warning small fw-semibold mb-2">
                        <i className="bi bi-calendar-event me-1"></i> {show.date} • {show.startTime}
                      </div>

                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {b.seats?.map((seat) => (
                          <Badge key={seat} bg="dark" className="border border-secondary text-info">
                            {seat}
                          </Badge>
                        ))}
                      </div>

                      <div className="d-flex justify-content-between align-items-center small text-secondary border-top border-secondary border-opacity-25 pt-2 mt-2">
                        <span>
                          Code: <strong className="text-light font-monospace">{b.bookingCode}</strong>
                        </span>
                        <span className="text-success fw-bold fs-6">₹{b.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap justify-content-end gap-2 mt-3 pt-2 border-top border-secondary border-opacity-25">
                    <Button
                      size="sm"
                      variant="outline-info"
                      className="flex-fill flex-sm-grow-0"
                      style={{ minHeight: '38px', fontSize: '14px' }}
                      onClick={() => setTicketModalBooking(b)}
                    >
                      <i className="bi bi-qr-code me-1"></i> View Ticket
                    </Button>

                    {b.status === 'confirmed' && b.isUpcoming && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        className="flex-fill flex-sm-grow-0"
                        style={{ minHeight: '38px', fontSize: '14px' }}
                        onClick={() => handleCancelClick(b)}
                      >
                        <i className="bi bi-x-circle me-1"></i> Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Ticket Pass Modal */}
      <Modal
        show={!!ticketModalBooking}
        onHide={() => setTicketModalBooking(null)}
        size="lg"
        centered
        contentClassName="bg-dark text-light border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fs-5">Cinema Ticket Pass</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ticketModalBooking && <PrintableTicket booking={ticketModalBooking} />}
        </Modal.Body>
      </Modal>

      {/* Cancellation Confirmation Modal */}
      <Modal
        show={!!cancellingBooking}
        onHide={() => setCancellingBooking(null)}
        centered
        contentClassName="bg-dark text-light border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fs-5 text-danger">Cancel Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to cancel booking{' '}
            <strong className="text-warning">{cancellingBooking?.bookingCode}</strong>?
          </p>

          <div className="p-3 bg-black rounded border border-secondary border-opacity-25 mb-3 small text-secondary">
            <strong className="text-light">Refund Policy:</strong>
            <ul className="mb-0 mt-1 ps-3">
              <li>100% refund if cancelled more than 2 hours before showtime.</li>
              <li>Non-refundable within 2 hours of showtime.</li>
            </ul>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="text-secondary small">Reason for cancellation</Form.Label>
            <Form.Select
              className="bg-black text-light border-secondary"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            >
              <option value="Change of plans">Change of plans</option>
              <option value="Booked wrong show or seats">Booked wrong show or seats</option>
              <option value="Emergency or unavailable">Emergency or unavailable</option>
              <option value="Other">Other</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="outline-secondary" onClick={() => setCancellingBooking(null)}>
            Keep Booking
          </Button>
          <Button
            variant="danger"
            onClick={confirmCancellation}
            disabled={isCancelling}
          >
            {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyBookingsPage;
