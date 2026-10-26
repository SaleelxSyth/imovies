import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import api from '../services/api';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Datasets for management tabs
  const [moviesList, setMoviesList] = useState([]);
  const [theatresList, setTheatresList] = useState([]);
  const [showsList, setShowsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Modals state
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [showAddTheatreModal, setShowAddTheatreModal] = useState(false);
  const [showAddShowModal, setShowAddShowModal] = useState(false);

  // New Movie Form
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genre: 'Action, Sci-Fi',
    language: 'English',
    duration: 120,
    releaseDate: new Date().toISOString().split('T')[0],
    status: 'now_showing',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  });
  const [posterFile, setPosterFile] = useState(null);

  // New Theatre Form
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    city: 'Mumbai',
    location: '',
    screenName: 'Screen 1',
    rows: 6,
    seatsPerRow: 10
  });

  // New Show Form
  const [showForm, setShowForm] = useState({
    movie: '',
    theatre: '',
    screenName: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:30',
    regularPrice: 200,
    premiumPrice: 280,
    reclinerPrice: 450
  });

  // Load KPI Stats
  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Lazy load data per tab
  useEffect(() => {
    if (activeTab === 'movies') loadMovies();
    if (activeTab === 'theatres') loadTheatres();
    if (activeTab === 'shows') loadShows();
    if (activeTab === 'bookings') loadBookings();
    if (activeTab === 'reviews') loadReviews();
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  const loadMovies = async () => {
    try {
      const res = await api.get('/movies?limit=50');
      setMoviesList(res.data.data || []);
    } catch (e) {}
  };

  const loadTheatres = async () => {
    try {
      const res = await api.get('/theatres');
      setTheatresList(res.data.data || []);
    } catch (e) {}
  };

  const loadShows = async () => {
    try {
      const res = await api.get('/shows');
      setShowsList(res.data.data || []);
    } catch (e) {}
  };

  const loadBookings = async () => {
    try {
      const res = await api.get('/bookings?limit=50');
      setBookingsList(res.data.data || []);
    } catch (e) {}
  };

  const loadReviews = async () => {
    try {
      const res = await api.get('/reviews/admin');
      setReviewsList(res.data.data || []);
    } catch (e) {}
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/users?limit=50');
      setUsersList(res.data.data || []);
    } catch (e) {}
  };

  // 1. Add Movie
  const handleCreateMovie = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(movieForm).forEach((key) => {
        formData.append(key, movieForm[key]);
      });
      if (posterFile) {
        formData.append('poster', posterFile);
      }

      await api.post('/movies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Movie created successfully');
      setShowAddMovieModal(false);
      loadMovies();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create movie');
    }
  };

  // 2. Add Theatre
  const handleCreateTheatre = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: theatreForm.name,
        city: theatreForm.city,
        location: theatreForm.location,
        screens: [
          {
            name: theatreForm.screenName,
            rows: parseInt(theatreForm.rows, 10),
            seatsPerRow: parseInt(theatreForm.seatsPerRow, 10)
          }
        ]
      };
      await api.post('/theatres', payload);
      toast.success('Theatre added successfully');
      setShowAddTheatreModal(false);
      loadTheatres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add theatre');
    }
  };

  // 3. Add Show
  const handleCreateShow = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        movie: showForm.movie,
        theatre: showForm.theatre,
        screenName: showForm.screenName || 'Screen 1',
        date: showForm.date,
        startTime: showForm.startTime,
        pricing: {
          regular: Number(showForm.regularPrice),
          premium: Number(showForm.premiumPrice),
          recliner: Number(showForm.reclinerPrice)
        }
      };
      await api.post('/shows', payload);
      toast.success('Show scheduled with seats automatically generated!');
      setShowAddShowModal(false);
      loadShows();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule show');
    }
  };

  // Delete Handlers
  const handleDeleteMovie = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      await api.delete(`/movies/${id}`);
      toast.info('Movie removed');
      loadMovies();
    }
  };

  const handleDeleteShow = async (id) => {
    if (window.confirm('Delete this show and its seat map?')) {
      await api.delete(`/shows/${id}`);
      toast.info('Show deleted');
      loadShows();
    }
  };

  // Review Moderation
  const handleModerateReview = async (id, isApproved) => {
    try {
      await api.patch(`/reviews/${id}/moderate`, { isApproved });
      toast.success(`Review ${isApproved ? 'approved' : 'hidden'}`);
      loadReviews();
    } catch (err) {
      toast.error('Failed to moderate review');
    }
  };

  // User Block Toggle
  const handleToggleBlock = async (id) => {
    try {
      const res = await api.patch(`/users/${id}/block`);
      toast.info(res.data.message);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  if (loading && !stats) {
    return <Loader message="Loading Admin Dashboard..." fullScreen />;
  }

  const overview = stats?.overview || {};

  return (
    <Container fluid className="px-lg-5 py-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h2 className="text-light fw-bold mb-0">Admin Control Center</h2>
            <Badge bg="danger">SYSTEM MANAGEMENT</Badge>
          </div>
          <div className="text-muted small">Monitor real-time cinema metrics and manage catalog</div>
        </div>

        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="cinema-primary"
            className="btn-cinema-primary"
            onClick={() => setShowAddMovieModal(true)}
          >
            <i className="bi bi-plus-circle me-1"></i> Add Movie
          </Button>
          <Button
            size="sm"
            variant="cinema-outline"
            className="btn-cinema-outline"
            onClick={() => {
              loadMovies();
              loadTheatres();
              setShowAddShowModal(true);
            }}
          >
            <i className="bi bi-calendar-plus me-1"></i> Schedule Show
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 border-secondary border-opacity-50"
      >
        <Tab eventKey="overview" title="Analytics Overview" />
        <Tab eventKey="movies" title="Movies Catalog" />
        <Tab eventKey="theatres" title="Theatres & Screens" />
        <Tab eventKey="shows" title="Scheduled Shows" />
        <Tab eventKey="bookings" title="Bookings & Tickets" />
        <Tab eventKey="reviews" title="Review Moderation" />
        <Tab eventKey="users" title="User Management" />
      </Tabs>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Stat Cards */}
          <Row className="g-3 mb-4">
            <Col lg={3} sm={6}>
              <Card className="imv-card p-3 border-start border-success border-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">Total Revenue</div>
                    <h3 className="text-light fw-bold mb-0">₹{overview.totalRevenue?.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-success bg-opacity-20 text-success rounded-circle fs-4">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                </div>
              </Card>
            </Col>

            <Col lg={3} sm={6}>
              <Card className="imv-card p-3 border-start border-danger border-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">Confirmed Bookings</div>
                    <h3 className="text-light fw-bold mb-0">{overview.confirmedBookingsCount || 0}</h3>
                  </div>
                  <div className="p-3 bg-danger bg-opacity-20 text-danger rounded-circle fs-4">
                    <i className="bi bi-ticket-perforated"></i>
                  </div>
                </div>
              </Card>
            </Col>

            <Col lg={3} sm={6}>
              <Card className="imv-card p-3 border-start border-warning border-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">Registered Users</div>
                    <h3 className="text-light fw-bold mb-0">{overview.totalUsers || 0}</h3>
                  </div>
                  <div className="p-3 bg-warning bg-opacity-20 text-warning rounded-circle fs-4">
                    <i className="bi bi-people"></i>
                  </div>
                </div>
              </Card>
            </Col>

            <Col lg={3} sm={6}>
              <Card className="imv-card p-3 border-start border-info border-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">Seat Occupancy</div>
                    <h3 className="text-light fw-bold mb-0">{overview.occupancyRate || 0}%</h3>
                  </div>
                  <div className="p-3 bg-info bg-opacity-20 text-info rounded-circle fs-4">
                    <i className="bi bi-pie-chart"></i>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Top Movies & Trends */}
          <Row className="g-4">
            <Col lg={7}>
              <Card className="imv-card p-4 h-100">
                <h5 className="text-light fw-bold mb-3">Top Grossing Movies</h5>
                {stats?.topMovies && stats.topMovies.length > 0 ? (
                  <Table responsive hover variant="dark" className="table-cinema mb-0">
                    <thead>
                      <tr>
                        <th>Movie</th>
                        <th>Bookings</th>
                        <th>Seats Sold</th>
                        <th className="text-end">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topMovies.map((tm) => (
                        <tr key={tm.movieId}>
                          <td>
                            <strong className="text-light">{tm.title}</strong>
                          </td>
                          <td>{tm.bookingsCount}</td>
                          <td>{tm.totalSeatsBooked}</td>
                          <td className="text-end text-success fw-bold">₹{tm.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted small">No confirmed revenue data yet.</div>
                )}
              </Card>
            </Col>

            <Col lg={5}>
              <Card className="imv-card p-4 h-100">
                <h5 className="text-light fw-bold mb-3">Platform Health & Sockets</h5>
                <div className="d-flex flex-column gap-3">
                  <div className="p-3 rounded bg-black bg-opacity-50 border border-secondary border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-light">Socket.io Seat Engine</strong>
                      <Badge bg="success">ACTIVE</Badge>
                    </div>
                    <div className="text-muted small">
                      Broadcasting seat updates per show room (`show:&lt;id&gt;`)
                    </div>
                  </div>

                  <div className="p-3 rounded bg-black bg-opacity-50 border border-secondary border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-light">Auto Lock Expiry Job</strong>
                      <Badge bg="info">RUNNING</Badge>
                    </div>
                    <div className="text-muted small">
                      Interval worker releasing unbooked seats after 5 minutes TTL
                    </div>
                  </div>

                  <div className="p-3 rounded bg-black bg-opacity-50 border border-secondary border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-light">Payment Gateway Mode</strong>
                      <Badge bg="warning" className="text-dark">TEST / MOCK DEMO</Badge>
                    </div>
                    <div className="text-muted small">
                      Instant verification mode enabled for smooth end-to-end testing
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* TAB 2: MOVIES */}
      {activeTab === 'movies' && (
        <Card className="imv-card p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-light fw-bold mb-0">Movie Catalog ({moviesList.length})</h5>
            <Button size="sm" variant="cinema-primary" onClick={() => setShowAddMovieModal(true)}>
              <i className="bi bi-plus-circle me-1"></i> Add Movie
            </Button>
          </div>

          <Table responsive hover variant="dark" className="table-cinema">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Title</th>
                <th>Genre</th>
                <th>Language</th>
                <th>Duration</th>
                <th>Rating</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {moviesList.map((m) => (
                <tr key={m._id}>
                  <td>
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                  <td>
                    <strong className="text-light">{m.title}</strong>
                  </td>
                  <td>{m.genre?.slice(0, 2).join(', ')}</td>
                  <td>{m.language}</td>
                  <td>{m.duration}m</td>
                  <td><i className="bi bi-star-fill text-warning me-1"></i>{m.rating || 0}</td>
                  <td>
                    <Badge bg={m.status === 'now_showing' ? 'success' : 'info'}>
                      {m.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDeleteMovie(m._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* TAB 3: THEATRES */}
      {activeTab === 'theatres' && (
        <Card className="imv-card p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-light fw-bold mb-0">Theatres & Screens ({theatresList.length})</h5>
            <Button size="sm" variant="cinema-primary" onClick={() => setShowAddTheatreModal(true)}>
              <i className="bi bi-plus-circle me-1"></i> Add Theatre
            </Button>
          </div>

          <Table responsive hover variant="dark" className="table-cinema">
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Address</th>
                <th>Screens</th>
                <th>Total Capacity</th>
              </tr>
            </thead>
            <tbody>
              {theatresList.map((t) => (
                <tr key={t._id}>
                  <td><strong className="text-light">{t.name}</strong></td>
                  <td><Badge bg="warning" className="text-dark">{t.city}</Badge></td>
                  <td>{t.location}</td>
                  <td>{t.screens?.map((s) => s.name).join(', ')}</td>
                  <td>
                    {t.screens?.reduce((acc, s) => acc + (s.rows * s.seatsPerRow), 0)} seats
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* TAB 4: SHOWS */}
      {activeTab === 'shows' && (
        <Card className="imv-card p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-light fw-bold mb-0">Scheduled Shows ({showsList.length})</h5>
            <Button
              size="sm"
              variant="cinema-primary"
              onClick={() => {
                loadMovies();
                loadTheatres();
                setShowAddShowModal(true);
              }}
            >
              <i className="bi bi-plus-circle me-1"></i> Schedule Show
            </Button>
          </div>

          <Table responsive hover variant="dark" className="table-cinema">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Theatre</th>
                <th>Screen</th>
                <th>Date</th>
                <th>Time</th>
                <th>Pricing (Reg / Prem / Recl)</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {showsList.map((s) => (
                <tr key={s._id}>
                  <td><strong className="text-light">{s.movie?.title}</strong></td>
                  <td>{s.theatre?.name} ({s.theatre?.city})</td>
                  <td>{s.screenName}</td>
                  <td>{s.date}</td>
                  <td><Badge bg="dark" className="border border-warning text-warning">{s.startTime}</Badge></td>
                  <td>₹{s.pricing?.regular} / ₹{s.pricing?.premium} / ₹{s.pricing?.recliner}</td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDeleteShow(s._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* TAB 5: BOOKINGS */}
      {activeTab === 'bookings' && (
        <Card className="imv-card p-4">
          <h5 className="text-light fw-bold mb-3">Customer Bookings & Transactions ({bookingsList.length})</h5>
          <Table responsive hover variant="dark" className="table-cinema">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Movie</th>
                <th>Date & Time</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookingsList.map((b) => (
                <tr key={b._id}>
                  <td><code className="text-info">{b.bookingCode}</code></td>
                  <td>{b.user?.name} ({b.user?.email})</td>
                  <td>{b.show?.movie?.title}</td>
                  <td>{b.show?.date} at {b.show?.startTime}</td>
                  <td>{b.seats?.join(', ')}</td>
                  <td className="text-success fw-bold">₹{b.totalAmount}</td>
                  <td>
                    <Badge
                      bg={
                        b.status === 'confirmed'
                          ? 'success'
                          : b.status === 'refunded'
                          ? 'info'
                          : 'secondary'
                      }
                    >
                      {b.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* TAB 6: REVIEWS */}
      {activeTab === 'reviews' && (
        <Card className="imv-card p-4">
          <h5 className="text-light fw-bold mb-3">Review Moderation</h5>
          <Table responsive hover variant="dark" className="table-cinema">
            <thead>
              <tr>
                <th>User</th>
                <th>Movie</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviewsList.map((r) => (
                <tr key={r._id}>
                  <td>{r.user?.name}</td>
                  <td><strong className="text-light">{r.movie?.title}</strong></td>
                  <td><i className="bi bi-star-fill text-warning me-1"></i>{r.rating} / 5</td>
                  <td>{r.comment}</td>
                  <td>
                    <Badge bg={r.isApproved ? 'success' : 'danger'}>
                      {r.isApproved ? 'Approved' : 'Hidden'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant={r.isApproved ? 'outline-warning' : 'outline-success'}
                      className="me-2"
                      onClick={() => handleModerateReview(r._id, !r.isApproved)}
                    >
                      {r.isApproved ? 'Hide' : 'Approve'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* TAB 7: USERS */}
      {activeTab === 'users' && (
        <Card className="imv-card p-4">
          <h5 className="text-light fw-bold mb-3">Registered Users</h5>
          <Table responsive hover variant="dark" className="table-cinema">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u._id}>
                  <td><strong className="text-light">{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <Badge bg={u.role === 'admin' ? 'danger' : 'secondary'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={u.isBlocked ? 'danger' : 'success'}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="text-end">
                    {u.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant={u.isBlocked ? 'outline-success' : 'outline-danger'}
                        onClick={() => handleToggleBlock(u._id)}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block User'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* MODAL: ADD MOVIE */}
      <Modal
        show={showAddMovieModal}
        onHide={() => setShowAddMovieModal(false)}
        size="lg"
        centered
        contentClassName="bg-dark text-light border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fs-5">Add New Movie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateMovie}>
            <Row className="g-3">
              <Col md={8}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Movie Title</Form.Label>
                  <Form.Control
                    required
                    className="bg-black text-light border-secondary"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Duration (Minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    className="bg-black text-light border-secondary"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Genres (comma separated)</Form.Label>
                  <Form.Control
                    required
                    className="bg-black text-light border-secondary"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Language</Form.Label>
                  <Form.Control
                    required
                    className="bg-black text-light border-secondary"
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    required
                    className="bg-black text-light border-secondary"
                    value={movieForm.description}
                    onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Release Date</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    className="bg-black text-light border-secondary"
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Status</Form.Label>
                  <Form.Select
                    className="bg-black text-light border-secondary"
                    value={movieForm.status}
                    onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="upcoming">Coming Soon</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Poster Image (Upload)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    className="bg-black text-light border-secondary"
                    onChange={(e) => setPosterFile(e.target.files[0])}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="text-end">
              <Button type="submit" variant="cinema-primary">
                Save Movie
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* MODAL: ADD THEATRE */}
      <Modal
        show={showAddTheatreModal}
        onHide={() => setShowAddTheatreModal(false)}
        centered
        contentClassName="bg-dark text-light border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fs-5">Add Theatre</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateTheatre}>
            <Form.Group className="mb-3">
              <Form.Label className="small text-secondary">Theatre Name</Form.Label>
              <Form.Control
                required
                placeholder="e.g. Cinepolis Megaplex"
                className="bg-black text-light border-secondary"
                value={theatreForm.name}
                onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small text-secondary">City</Form.Label>
              <Form.Select
                className="bg-black text-light border-secondary"
                value={theatreForm.city}
                onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
              >
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Delhi">Delhi</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small text-secondary">Location / Address</Form.Label>
              <Form.Control
                required
                placeholder="Mall / Area address"
                className="bg-black text-light border-secondary"
                value={theatreForm.location}
                onChange={(e) => setTheatreForm({ ...theatreForm, location: e.target.value })}
              />
            </Form.Group>

            <Row className="g-2">
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Rows (Letters A-F)</Form.Label>
                  <Form.Control
                    type="number"
                    min="3"
                    max="10"
                    className="bg-black text-light border-secondary"
                    value={theatreForm.rows}
                    onChange={(e) => setTheatreForm({ ...theatreForm, rows: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Seats Per Row</Form.Label>
                  <Form.Control
                    type="number"
                    min="5"
                    max="16"
                    className="bg-black text-light border-secondary"
                    value={theatreForm.seatsPerRow}
                    onChange={(e) => setTheatreForm({ ...theatreForm, seatsPerRow: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="text-end">
              <Button type="submit" variant="cinema-primary">
                Create Theatre
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* MODAL: ADD SHOW */}
      <Modal
        show={showAddShowModal}
        onHide={() => setShowAddShowModal(false)}
        size="lg"
        centered
        contentClassName="bg-dark text-light border-secondary"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fs-5">Schedule Show (Auto-Generates Seats)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateShow}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Select Movie</Form.Label>
                  <Form.Select
                    required
                    className="bg-black text-light border-secondary"
                    value={showForm.movie}
                    onChange={(e) => setShowForm({ ...showForm, movie: e.target.value })}
                  >
                    <option value="">-- Choose Movie --</option>
                    {moviesList.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Select Theatre</Form.Label>
                  <Form.Select
                    required
                    className="bg-black text-light border-secondary"
                    value={showForm.theatre}
                    onChange={(e) => {
                      const t = theatresList.find((th) => th._id === e.target.value);
                      setShowForm({
                        ...showForm,
                        theatre: e.target.value,
                        screenName: t?.screens[0]?.name || 'Screen 1'
                      });
                    }}
                  >
                    <option value="">-- Choose Theatre --</option>
                    {theatresList.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Date</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    className="bg-black text-light border-secondary"
                    value={showForm.date}
                    onChange={(e) => setShowForm({ ...showForm, date: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-secondary">Start Time (HH:mm)</Form.Label>
                  <Form.Control
                    type="time"
                    required
                    className="bg-black text-light border-secondary"
                    value={showForm.startTime}
                    onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Regular Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    className="bg-black text-light border-secondary"
                    value={showForm.regularPrice}
                    onChange={(e) => setShowForm({ ...showForm, regularPrice: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Premium Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    className="bg-black text-light border-secondary"
                    value={showForm.premiumPrice}
                    onChange={(e) => setShowForm({ ...showForm, premiumPrice: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-secondary">Recliner Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    className="bg-black text-light border-secondary"
                    value={showForm.reclinerPrice}
                    onChange={(e) => setShowForm({ ...showForm, reclinerPrice: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="p-3 bg-black rounded border border-secondary border-opacity-25 mb-3 text-secondary small">
              <i className="bi bi-info-circle text-info me-1"></i> Submitting will automatically generate all individual seat records for this screen layout with the tiered pricing structure.
            </div>

            <div className="text-end">
              <Button type="submit" variant="cinema-primary">
                Schedule & Generate Seats
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminDashboardPage;
