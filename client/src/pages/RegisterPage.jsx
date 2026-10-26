import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../redux/slices/authSlice';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated) {
      navigate('/');
    }
  }, [dispatch, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    dispatch(
      registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      })
    );
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
              <h4 className="text-light fw-bold">Create an Account</h4>
              <p className="text-muted small">Join iMovies to reserve seats and unlock movie perks</p>
            </div>

            {(error || formError) && <Alert variant="danger">{error || formError}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="text-secondary small">Full Name</Form.Label>
                <Form.Control
                  type="text"
                  required
                  name="name"
                  placeholder="e.g. Alex Johnson"
                  className="bg-dark text-light border-secondary"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-secondary small">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  required
                  name="email"
                  placeholder="alex@example.com"
                  className="bg-dark text-light border-secondary"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-secondary small">Phone Number (Optional)</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  placeholder="+91 9876543210"
                  className="bg-dark text-light border-secondary"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-secondary small">Password</Form.Label>
                <Form.Control
                  type="password"
                  required
                  name="password"
                  placeholder="At least 6 characters"
                  className="bg-dark text-light border-secondary"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="text-secondary small">Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  required
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  className="bg-dark text-light border-secondary"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </Form.Group>

              <Button
                type="submit"
                variant="cinema-primary"
                className="btn-cinema-primary w-100 py-2 mb-3"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </Form>

            <div className="text-center text-secondary small mt-3">
              Already have an account?{' '}
              <Link to="/login" className="text-danger fw-semibold text-decoration-none">
                Sign In
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
