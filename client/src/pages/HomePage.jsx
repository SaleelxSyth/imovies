import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMovies } from '../redux/slices/movieSlice';
import MovieCard from '../components/movie/MovieCard';
import TrailerModal from '../components/movie/TrailerModal';
import Loader from '../components/common/Loader';

const HomePage = () => {
  const dispatch = useDispatch();
  const { movies, loading, selectedCity } = useSelector((state) => state.movies);
  const city = selectedCity || localStorage.getItem('selectedCity') || 'Indore';

  const [showTrailer, setShowTrailer] = useState(false);
  const [activeHero, setActiveHero] = useState(null);

  useEffect(() => {
    dispatch(fetchMovies({ limit: 12 }));
  }, [dispatch]);

  useEffect(() => {
    if (movies && movies.length > 0 && !activeHero) {
      setActiveHero(movies[0]);
    }
  }, [movies, activeHero]);

  const nowShowing = movies.filter((m) => m.status === 'now_showing');
  const upcoming = movies.filter((m) => m.status === 'upcoming');

  const scrollToNowShowing = () => {
    const el = document.getElementById('now-showing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-page pb-5">
      {/* 1. Cinematic Hero Section with Blurred Poster Backdrop & Spotlight */}
      <div className="hero-section position-relative py-5 mb-0 overflow-hidden">
        {/* Featured movie blurred darkened backdrop */}
        {activeHero?.posterUrl && (
          <div
            className="hero-backdrop"
            style={{
              backgroundImage: `url(${activeHero.posterUrl})`
            }}
            aria-hidden="true"
          />
        )}

        {/* Soft spotlight cone from top */}
        <div className="hero-spotlight" aria-hidden="true" />

        <Container className="px-3 px-lg-5 py-4 position-relative hero-content-fade-up" style={{ zIndex: 2 }}>
          <Row className="align-items-center">
            <Col lg={8} md={10}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge badge-cinema-gold text-uppercase px-2 py-1">
                  Indore Cinema
                </span>
                <span className="text-warning small fw-bold">
                  <i className="bi bi-geo-alt-fill me-1"></i> In {selectedCity} Theatres
                </span>
              </div>

              <h1
                className="hero-headline display-3 fw-black mb-3"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', lineHeight: 1.05 }}
              >
                Book Movies Faster Than Ever
              </h1>

              <p
                className="lead hero-subtext mb-4"
                style={{ maxWidth: '640px', fontSize: '1.08rem', lineHeight: 1.6 }}
              >
                Pick your seat, scan, and walk in. Tickets for {city}'s best screens in under a minute.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3">
                <Button
                  variant="cinema-primary"
                  className="btn-cinema-primary btn-lg px-4 w-100 w-sm-auto"
                  onClick={scrollToNowShowing}
                >
                  <i className="bi bi-ticket-perforated me-2"></i> Book Now
                </Button>

                <Link to="/movies" className="btn btn-cinema-outline btn-lg px-4 w-100 w-sm-auto text-center">
                  <i className="bi bi-compass me-2"></i> Browse Movies
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* 2. Trust Strip under the hero (4 short items with simple inline SVG icons, no emojis) */}
      <div className="trust-strip-container py-3 mb-5">
        <Container className="px-3 px-lg-5">
          <div className="trust-strip-glass p-3 p-md-4 rounded-4">
            <Row className="g-3 align-items-center text-center text-md-start">
              {/* Item 1 */}
              <Col xs={6} md={3}>
                <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 py-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 18v3" />
                    <path d="M20 18v3" />
                    <path d="M6 11V7a4 4 0 0 1 8 0v4" />
                    <rect x="3" y="11" width="18" height="7" rx="2" />
                  </svg>
                  <span className="text-light small fw-semibold">Live seat availability</span>
                </div>
              </Col>

              {/* Item 2 */}
              <Col xs={6} md={3}>
                <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 py-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="3" height="3" />
                    <path d="M17 17h4v4h-4z" />
                  </svg>
                  <span className="text-light small fw-semibold">Secure QR payment</span>
                </div>
              </Col>

              {/* Item 3 */}
              <Col xs={6} md={3}>
                <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 py-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2 2Z" />
                    <path d="M13 5v2" />
                    <path d="M13 17v2" />
                    <path d="M13 11v2" />
                  </svg>
                  <span className="text-light small fw-semibold">Instant e-ticket</span>
                </div>
              </Col>

              {/* Item 4 */}
              <Col xs={6} md={3}>
                <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 py-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span className="text-light small fw-semibold">Easy cancellation</span>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </div>

      {/* 3. How It Works Section */}
      <Container className="px-3 px-lg-5 mb-5 pb-3">
        <div className="text-center mb-4">
          <span className="badge badge-cinema-gold text-uppercase px-2 py-1 mb-2">Simple Process</span>
          <h2 className="text-light fw-bold mb-1" style={{ letterSpacing: '0.04em' }}>
            How It Works
          </h2>
          <div className="text-muted small">From screen selection to movie night in 3 simple steps</div>
        </div>

        <Row className="g-4">
          <Col md={4}>
            <Card className="imv-card imv-glass-card h-100 p-4 text-center">
              <div className="mx-auto mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ background: 'rgba(245, 184, 75, 0.12)', width: '60px', height: '60px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
              </div>
              <h5 className="text-light fw-bold mb-2">1. Pick a movie</h5>
              <p className="text-secondary small mb-0">
                Browse latest releases and showtimes across Indore's top multiplexes.
              </p>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="imv-card imv-glass-card h-100 p-4 text-center">
              <div className="mx-auto mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ background: 'rgba(245, 184, 75, 0.12)', width: '60px', height: '60px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 18v3" />
                  <path d="M20 18v3" />
                  <path d="M6 11V7a4 4 0 0 1 8 0v4" />
                  <rect x="3" y="11" width="18" height="7" rx="2" />
                </svg>
              </div>
              <h5 className="text-light fw-bold mb-2">2. Choose your seats</h5>
              <p className="text-secondary small mb-0">
                Pick your preferred row with instant real-time seat lock protection.
              </p>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="imv-card imv-glass-card h-100 p-4 text-center">
              <div className="mx-auto mb-3 p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ background: 'rgba(245, 184, 75, 0.12)', width: '60px', height: '60px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="3" height="3" />
                  <path d="M17 17h4v4h-4z" />
                </svg>
              </div>
              <h5 className="text-light fw-bold mb-2">3. Scan and enjoy</h5>
              <p className="text-secondary small mb-0">
                Scan the secure QR on your mobile and walk in with your digital cinema pass.
              </p>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* 4. Now Showing Section */}
      <Container id="now-showing" className="px-3 px-lg-5 mb-5 pt-2">
        <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-25 pb-3">
          <div>
            <h2 className="text-light fw-bold mb-1" style={{ letterSpacing: '0.04em' }}>
              <span className="text-warning me-2">●</span> Now Showing in {city}
            </h2>
            <div className="text-muted small">Fresh releases, live seats.</div>
          </div>
          <Link to="/movies" className="text-warning text-decoration-none fw-semibold small">
            View All <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>

        {loading ? (
          <Loader message="Loading movies..." />
        ) : (
          <Row className="g-2 g-sm-3 g-md-4">
            {nowShowing.slice(0, 8).map((movie) => (
              <Col key={movie._id} xs={6} md={4} lg={3}>
                <MovieCard movie={movie} />
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Coming Soon Section */}
      <Container className="px-3 px-lg-5 mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-25 pb-3">
          <div>
            <h2 className="text-light fw-bold mb-1" style={{ letterSpacing: '0.04em' }}>
              <span className="text-secondary me-2">●</span> Coming Soon
            </h2>
            <div className="text-muted small">Fresh releases, live seats.</div>
          </div>
          <Link to="/movies?status=upcoming" className="text-warning text-decoration-none fw-semibold small">
            View All <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>

        {upcoming.length > 0 ? (
          <Row className="g-2 g-sm-3 g-md-4">
            {upcoming.map((movie) => (
              <Col key={movie._id} xs={6} md={4} lg={3}>
                <MovieCard movie={movie} />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="p-4 rounded-4 text-center imv-glass-card text-muted">
            <i className="bi bi-calendar-event fs-2 text-warning mb-2 d-inline-block"></i>
            <h6 className="text-light">More blockbusters arriving soon!</h6>
            <p className="small mb-0">Stay tuned for advance ticket bookings in {selectedCity}.</p>
          </div>
        )}
      </Container>

      {/* 5. Food Teaser Section */}
      <Container className="px-3 px-lg-5 mb-5">
        <Card className="imv-card imv-glass-card p-4 p-md-5 border-warning border-opacity-25 food-teaser-glass">
          <Row className="align-items-center gy-4">
            <Col lg={7}>
              <span className="badge badge-cinema-gold text-uppercase px-2 py-1 mb-2">Coming Soon</span>
              <h2 className="text-light fw-bold mb-2" style={{ letterSpacing: '0.04em' }}>
                Order Food Straight to Your Seat
              </h2>
              <p className="text-secondary mb-4" style={{ maxWidth: '580px', lineHeight: 1.6 }}>
                Popcorn, nachos, drinks and combos delivered to your seat without leaving the movie. Coming soon to iMovies.
              </p>

              <Row className="g-3 mb-4">
                <Col sm={4}>
                  <div className="p-3 rounded-3 h-100 imv-glass-subcard">
                    <div className="mb-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                        <line x1="6" y1="1" x2="6" y2="4" />
                        <line x1="10" y1="1" x2="10" y2="4" />
                        <line x1="14" y1="1" x2="14" y2="4" />
                      </svg>
                    </div>
                    <div className="text-light small fw-bold mb-1">Pick snacks while booking</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Select popcorn and drinks with your ticket</div>
                  </div>
                </Col>

                <Col sm={4}>
                  <div className="p-3 rounded-3 h-100 imv-glass-subcard">
                    <div className="mb-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div className="text-light small fw-bold mb-1">Pay once with your ticket</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>One unified QR checkout for everything</div>
                  </div>
                </Col>

                <Col sm={4}>
                  <div className="p-3 rounded-3 h-100 imv-glass-subcard">
                    <div className="mb-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 4v3" />
                        <path d="M4 18h16" />
                        <path d="M4 14a8 8 0 0 1 16 0" />
                        <path d="M2 18h20" />
                      </svg>
                    </div>
                    <div className="text-light small fw-bold mb-1">Served at your seat</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Hot snacks delivered directly to your row</div>
                  </div>
                </Col>
              </Row>

              <Button variant="cinema-outline" disabled className="px-4 py-2 opacity-75">
                <i className="bi bi-bell me-2"></i> Launching soon
              </Button>
            </Col>

            <Col lg={5} className="text-center d-none d-lg-block">
              <div className="p-4 rounded-4 position-relative overflow-hidden imv-glass-card" style={{ border: '1px solid rgba(245, 184, 75, 0.25)' }}>
                <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="#f5b84b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
                  <path d="M12 4v3" />
                  <path d="M4 18h16" />
                  <path d="M4 14a8 8 0 0 1 16 0" />
                  <path d="M2 18h20" />
                </svg>
                <h5 className="text-light fw-bold mb-1">In-Seat Cinema Dining</h5>
                <p className="text-secondary small mb-0">Never miss a scene waiting in snack lines.</p>
              </div>
            </Col>
          </Row>
        </Card>
      </Container>

      {/* 6. Final Call-To-Action Banner above footer */}
      <Container className="px-3 px-lg-5 mb-5">
        <div className="imv-card imv-glass-card p-4 p-md-5 rounded-4 text-center position-relative overflow-hidden cta-glass-banner">
          <h2 className="text-light fw-bold mb-2" style={{ letterSpacing: '0.04em' }}>
            Your seat is waiting. Book your next movie night now.
          </h2>
          <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '520px' }}>
            Reserve in seconds with live seating maps and effortless QR confirmation.
          </p>
          <Button
            variant="cinema-primary"
            className="btn-cinema-primary btn-lg px-4 w-100 w-sm-auto"
            onClick={scrollToNowShowing}
          >
            <i className="bi bi-ticket-perforated me-2"></i> Book Tickets
          </Button>
        </div>
      </Container>

      {/* Trailer Modal */}
      {activeHero && (
        <TrailerModal
          show={showTrailer}
          onHide={() => setShowTrailer(false)}
          trailerUrl={activeHero.trailerUrl}
          movieTitle={activeHero.title}
        />
      )}
    </div>
  );
};

export default HomePage;
