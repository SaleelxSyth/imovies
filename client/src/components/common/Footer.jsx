import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto py-5 position-relative border-top text-secondary" style={{ background: 'rgba(7, 7, 11, 0.8)', backdropFilter: 'blur(16px)', borderColor: 'rgba(245, 184, 75, 0.12)', zIndex: 1 }}>
      <Container className="px-3 px-lg-5">
        <Row className="gy-4">
          <Col lg={4} md={6}>
            <div className="d-flex align-items-center mb-2">
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="me-2 d-inline-block"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.45))' }}
              >
                <circle cx="16" cy="16" r="13" stroke="#f59e0b" strokeWidth="2.5" fill="#181820" />
                <circle cx="16" cy="16" r="4" fill="#f59e0b" />
                <circle cx="16" cy="8.5" r="2" fill="#f59e0b" />
                <circle cx="16" cy="23.5" r="2" fill="#f59e0b" />
                <circle cx="8.5" cy="16" r="2" fill="#f59e0b" />
                <circle cx="23.5" cy="16" r="2" fill="#f59e0b" />
              </svg>
              <span className="brand-logo-text">i<span className="gold-text">Movies</span></span>
            </div>
            <div className="text-warning fw-semibold small mb-2">
              iMovies: Skip the queue. Own the seat.
            </div>
            <p className="small text-muted pe-lg-4 mb-2">
              Next-generation cinema booking platform with real-time seat locks, interactive theatre maps, and instant ticket generation.
            </p>
            <div className="small text-secondary fst-italic mb-3">
              <i className="bi bi-bell text-warning me-1"></i> Coming soon: in-seat food ordering.
            </div>
            <div className="d-flex gap-3 text-light fs-5">
              <a href="#" className="text-secondary hover-light"><i className="bi bi-twitter-x"></i></a>
              <a href="#" className="text-secondary hover-light"><i className="bi bi-instagram"></i></a>
              <a href="#" className="text-secondary hover-light"><i className="bi bi-youtube"></i></a>
              <a href="#" className="text-secondary hover-light"><i className="bi bi-github"></i></a>
            </div>
          </Col>

          <Col lg={2} md={3} xs={6}>
            <h6 className="text-light fw-bold mb-3">Explore</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2">
              <li><Link to="/movies" className="text-secondary text-decoration-none">Now Showing</Link></li>
              <li><Link to="/movies?status=upcoming" className="text-secondary text-decoration-none">Upcoming Movies</Link></li>
              <li><Link to="/movies" className="text-secondary text-decoration-none">Cinemas & Theatres</Link></li>
              <li><Link to="/my-bookings" className="text-secondary text-decoration-none">My Tickets</Link></li>
            </ul>
          </Col>

          <Col lg={2} md={3} xs={6}>
            <h6 className="text-light fw-bold mb-3">Support</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2">
              <li><a href="#" className="text-secondary text-decoration-none">Cancellation & Refund Policy</a></li>
              <li><a href="#" className="text-secondary text-decoration-none">Terms of Service</a></li>
              <li><a href="#" className="text-secondary text-decoration-none">Privacy Policy</a></li>
              <li><a href="#" className="text-secondary text-decoration-none">Contact Support</a></li>
            </ul>
          </Col>

          <Col lg={4} md={12}>
            <h6 className="text-light fw-bold mb-3">MERN Tech Stack</h6>
            <p className="small text-muted mb-2">
              MongoDB • Express.js • React 18 (Vite) • Node.js • Socket.io • Redux Toolkit • Bootstrap 5
            </p>
            <div className="p-3 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25 small">
              <div className="d-flex align-items-center text-success mb-1">
                <i className="bi bi-shield-check me-2"></i>
                <span className="fw-semibold">Live Real-Time Seat Synchronization</span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                Concurrently managed seats with atomic updates and automatic 5-minute TTL locks.
              </div>
            </div>
          </Col>
        </Row>

        <div className="border-top border-secondary border-opacity-25 mt-4 pt-3 text-center small text-muted">
          © {new Date().getFullYear()} iMovies Cinema Systems Inc. Built for College Project & Demonstration.
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
