import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Navbar, Nav, Container, NavDropdown, Badge, Form, InputGroup, Button } from 'react-bootstrap';
import { logoutUser } from '../../redux/slices/authSlice';
import { fetchNotifications } from '../../redux/slices/notificationSlice';
import { setSelectedCity } from '../../redux/slices/movieSlice';

const AppNavbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);
  const { selectedCity } = useSelector((state) => state.movies);

  const [searchTerm, setSearchTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuthenticated]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const cities = ['Indore', 'Mumbai', 'Bengaluru', 'Delhi'];

  return (
    <Navbar
      expand="lg"
      variant="dark"
      sticky="top"
      className={`imv-navbar py-2 ${scrolled ? 'imv-navbar-scrolled' : 'imv-navbar-transparent'}`}
    >
      <Container fluid className="px-3 px-lg-5">
        {/* Brand */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center me-4 text-decoration-none brand-logo-container">
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="me-2 d-inline-block brand-icon"
          >
            <circle cx="16" cy="16" r="13" stroke="#f5b84b" strokeWidth="2.5" fill="#181820" />
            <circle cx="16" cy="16" r="4" fill="#f5b84b" />
            <circle cx="16" cy="8.5" r="2" fill="#f5b84b" />
            <circle cx="16" cy="23.5" r="2" fill="#f5b84b" />
            <circle cx="8.5" cy="16" r="2" fill="#f5b84b" />
            <circle cx="23.5" cy="16" r="2" fill="#f5b84b" />
          </svg>
          <span className="brand-logo-text">i<span className="gold-text">Movies</span></span>
        </Navbar.Brand>

        {/* Desktop City Selector */}
        <NavDropdown
          title={
            <span>
              <i className="bi bi-geo-alt-fill text-warning me-1"></i>
              <strong className="text-light">{selectedCity}</strong>
            </span>
          }
          id="city-dropdown"
          className="me-3 d-none d-lg-block"
        >
          {cities.map((city) => (
            <NavDropdown.Item
              key={city}
              active={selectedCity === city}
              onClick={() => dispatch(setSelectedCity(city))}
            >
              {city}
            </NavDropdown.Item>
          ))}
        </NavDropdown>

        <Navbar.Toggle aria-controls="main-navbar-nav" className="border-secondary ms-auto ms-lg-0" />

        <Navbar.Collapse id="main-navbar-nav">
          {/* Mobile City Selector (visible in hamburger collapse) */}
          <div className="d-lg-none my-2 p-2 rounded bg-black bg-opacity-50 border border-secondary border-opacity-30 w-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-semibold">
                <i className="bi bi-geo-alt-fill text-warning me-1"></i> City
              </span>
              <span className="badge bg-warning text-dark fw-bold">{selectedCity}</span>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`btn btn-sm flex-fill ${selectedCity === city ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-light'}`}
                  style={{ minHeight: '36px', fontSize: '14px' }}
                  onClick={() => dispatch(setSelectedCity(city))}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <Form onSubmit={handleSearchSubmit} className="d-flex my-2 my-lg-0 w-100" style={{ maxWidth: '400px' }}>
            <InputGroup size="sm" className="w-100">
              <InputGroup.Text className="bg-dark border-secondary text-secondary">
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="search"
                placeholder="Search movies, genres, actors..."
                className="bg-dark text-light border-secondary shadow-none py-2"
                style={{ fontSize: '14px', minHeight: '38px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button type="submit" variant="cinema-primary" className="btn-cinema-primary px-3" style={{ minHeight: '38px', fontSize: '14px' }}>
                Search
              </Button>
            </InputGroup>
          </Form>

          {/* Right Navigation */}
          <Nav className="ms-lg-auto align-items-start align-items-lg-center mt-2 mt-lg-0">
            <Nav.Link as={Link} to="/movies" active={location.pathname === '/movies'} className="px-3">
              <i className="bi bi-compass me-1"></i> Browse Movies
            </Nav.Link>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <Nav.Link as={Link} to="/notifications" className="position-relative px-3 me-2">
                  <i className="bi bi-bell fs-5 text-light"></i>
                  {unreadCount > 0 && (
                    <Badge
                      pill
                      bg="danger"
                      className="position-absolute top-1 start-75 translate-middle"
                      style={{ fontSize: '0.65rem' }}
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Nav.Link>

                {/* User Dropdown */}
                <NavDropdown
                  title={
                    <span className="d-inline-flex align-items-center">
                      <i className="bi bi-person-circle fs-5 text-warning me-2"></i>
                      <span className="text-light fw-semibold">{user?.name?.split(' ')[0] || 'Account'}</span>
                      {user?.role === 'admin' && (
                        <Badge bg="danger" className="ms-2" style={{ fontSize: '0.6rem' }}>
                          ADMIN
                        </Badge>
                      )}
                    </span>
                  }
                  id="user-account-dropdown"
                  align="end"
                >
                  <NavDropdown.Header className="text-muted small">
                    Signed in as <strong>{user?.email}</strong>
                  </NavDropdown.Header>

                  {user?.role === 'admin' && (
                    <>
                      <NavDropdown.Item as={Link} to="/admin" className="text-danger fw-bold">
                        <i className="bi bi-speedometer2 me-2"></i> Admin Dashboard
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                    </>
                  )}

                  <NavDropdown.Item as={Link} to="/my-bookings">
                    <i className="bi bi-ticket-perforated me-2"></i> My Bookings
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/watchlist">
                    <i className="bi bi-heart me-2"></i> Watchlist
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/profile">
                    <i className="bi bi-person-gear me-2"></i> Profile Settings
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
             <div className="d-flex align-items-center gap-2 ms-lg-3 mt-3 mt-lg-0">
                <Link to="/login" className="btn btn-cinema-outline flex-fill flex-lg-grow-0 text-center" style={{ minHeight: '38px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-cinema-primary flex-fill flex-lg-grow-0 text-center" style={{ minHeight: '38px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  Register
                </Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
