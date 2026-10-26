import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../redux/slices/authSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated) {
      navigate(redirectUrl);
    }
  }, [dispatch, isAuthenticated, navigate, redirectUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    dispatch(loginUser({ email: demoEmail, password: demoPassword }));
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={8} lg={5}>
          <Card className="imv-card p-3 p-md-5">
            <div className="text-center mb-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="bi bi-film fs-2 text-danger me-2"></i>
                <span className="brand-logo-text fs-3">iMovies</span>
              </div>
              <h4 className="text-light fw-bold">Sign In to Your Account</h4>
              <p className="text-muted small">Access your bookings, favorites, and live tickets</p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="text-secondary small">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="bg-dark text-light border-secondary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <div className="d-flex justify-content-between">
                  <Form.Label className="text-secondary small">Password</Form.Label>
                </div>
                <Form.Control
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="bg-dark text-light border-secondary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>

              <Button
                type="submit"
                variant="cinema-primary"
                className="btn-cinema-primary w-100 py-2 mb-3"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </Form>

            {/* Quick Demo Credentials */}
            <div className="p-3 rounded bg-black bg-opacity-50 border border-secondary border-opacity-25 my-3">
              <div className="text-secondary small fw-semibold mb-2">
                <i className="bi bi-key-fill text-warning me-1"></i> Quick Demo Logins:
              </div>
              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-danger"
                  className="w-50 small"
                  onClick={() => handleQuickLogin('admin@imovies.com', 'Admin@123')}
                >
                  Admin Demo
                </Button>
                <Button
                  size="sm"
                  variant="outline-warning"
                  className="w-50 small"
                  onClick={() => handleQuickLogin('john@example.com', 'User@123')}
                >
                  User Demo
                </Button>
              </div>
            </div>

            <div className="text-center text-secondary small mt-3">
              Don't have an account?{' '}
              <Link to="/register" className="text-danger fw-semibold text-decoration-none">
                Create one now
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
