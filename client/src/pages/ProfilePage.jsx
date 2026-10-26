import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCurrentUser } from '../redux/slices/authSlice';
import api from '../services/api';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await api.put('/users/profile', { name, phone });
      toast.success('Profile details updated successfully');
      dispatch(fetchCurrentUser());
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Container className="px-lg-5 py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="imv-card p-4 p-md-5">
            <div className="d-flex align-items-center gap-3 mb-4 border-bottom border-secondary border-opacity-25 pb-3">
              <div
                className="rounded-circle bg-danger bg-opacity-20 text-danger d-flex align-items-center justify-content-center fs-2"
                style={{ width: '64px', height: '64px' }}
              >
                <i className="bi bi-person-fill"></i>
              </div>
              <div>
                <h4 className="text-light fw-bold mb-0">{user?.name}</h4>
                <div className="text-muted small">{user?.email}</div>
                <div className="text-warning small text-uppercase fw-bold">{user?.role} ACCOUNT</div>
              </div>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="text-secondary small">Email (Immutable)</Form.Label>
                <Form.Control
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="bg-black text-secondary border-secondary"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-secondary small">Full Name</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-dark text-light border-secondary"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="text-secondary small">Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-dark text-light border-secondary"
                  placeholder="+91 9876543210"
                />
              </Form.Group>

              <Button
                type="submit"
                variant="cinema-primary"
                className="btn-cinema-primary w-100 py-2"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;
