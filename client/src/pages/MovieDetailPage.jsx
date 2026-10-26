import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Badge, Button, Card, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovieDetails } from '../redux/slices/movieSlice';
import { updateUserFavorites } from '../redux/slices/authSlice';
import api from '../services/api';
import TrailerModal from '../components/movie/TrailerModal';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';

const MovieDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedMovie, loading, selectedCity } = useSelector((state) => state.movies);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [shows, setShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showTrailer, setShowTrailer] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Generate next 7 dates
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    dates.push({ dateStr, dayName, monthDay });
  }

  useEffect(() => {
    dispatch(fetchMovieDetails(id));
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0].dateStr);
    }
  }, [dispatch, id]);

  // Fetch shows when date or city changes
  useEffect(() => {
    const loadShows = async () => {
      if (!id || !selectedDate) return;
      try {
        setShowsLoading(true);
        const res = await api.get('/shows', {
          params: {
            movie: id,
            date: selectedDate,
            city: selectedCity
          }
        });
        setShows(res.data.data || []);
      } catch (err) {
        console.error('Failed to load shows:', err);
      } finally {
        setShowsLoading(false);
      }
    };

    loadShows();
  }, [id, selectedDate, selectedCity]);

  // Fetch movie reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!id) return;
      try {
        setReviewsLoading(true);
        const res = await api.get(`/movies/${id}/reviews`);
        setReviews(res.data.data || []);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [id]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add to your watchlist');
      navigate('/login');
      return;
    }

    const isFav = user?.favorites?.some((f) => (typeof f === 'string' ? f : f?._id) === id);

    try {
      if (isFav) {
        const res = await api.delete(`/users/favorites/${id}`);
        dispatch(updateUserFavorites(res.data.data));
        toast.info('Removed from watchlist');
      } else {
        const res = await api.post(`/users/favorites/${id}`);
        dispatch(updateUserFavorites(res.data.data));
        toast.success('Added to watchlist');
      }
    } catch (err) {
      toast.error('Watchlist action failed');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to post a review');
      navigate('/login');
      return;
    }

    if (!comment.trim()) {
      toast.warning('Please enter a review comment');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post(`/movies/${id}/reviews`, { rating, comment });
      setReviews([res.data.data, ...reviews]);
      setComment('');
      setRating(5);
      toast.success('Your review was published!');
      dispatch(fetchMovieDetails(id)); // refresh rating
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !selectedMovie) {
    return <Loader message="Loading movie details..." fullScreen />;
  }

  const isFavorite = user?.favorites?.some((f) => (typeof f === 'string' ? f : f?._id) === id);

  // Group shows by Theatre
  const theatreMap = {};
  shows.forEach((s) => {
    const tId = s.theatre?._id;
    if (!theatreMap[tId]) {
      theatreMap[tId] = {
        theatre: s.theatre,
        shows: []
      };
    }
    theatreMap[tId].shows.push(s);
  });

  const posterSrc = selectedMovie.posterUrl?.startsWith('/uploads')
    ? `http://localhost:5000${selectedMovie.posterUrl}`
    : selectedMovie.posterUrl;

  return (
    <div className="movie-detail-page pb-5">
      {/* Hero Backdrop */}
      <div
        className="position-relative py-5"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 14, 23, 0.85) 0%, #0a0e17 100%), url(${posterSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <Container className="px-lg-5">
          <Row className="g-4 align-items-center">
            {/* Poster Column */}
            <Col md={4} lg={3} className="text-center text-md-start">
              <div
                className="rounded-3 shadow-lg overflow-hidden border border-secondary border-opacity-50 d-inline-block"
                style={{ maxWidth: '280px', width: '100%' }}
              >
                <img src={posterSrc} alt={selectedMovie.title} className="img-fluid w-100" />
              </div>
            </Col>

            {/* Details Column */}
            <Col md={8} lg={9}>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <Badge bg="danger" className="text-uppercase">
                  {selectedMovie.status === 'now_showing' ? 'Now Showing' : 'Coming Soon'}
                </Badge>
                <span className="text-muted small">
                  <i className="bi bi-geo-alt-fill text-warning me-1"></i> {selectedCity}
                </span>
              </div>

              <h1 className="text-light fw-bold display-5 mb-2">{selectedMovie.title}</h1>

              {/* Rating, Duration, Language */}
              <div className="d-flex flex-wrap align-items-center gap-3 text-secondary mb-3">
                <span className="text-warning fw-bold fs-5">
                  <i className="bi bi-star-fill me-1"></i>
                  {selectedMovie.rating ? selectedMovie.rating.toFixed(1) : 'New'}
                  <small className="text-muted fs-6 ms-1">({selectedMovie.ratingCount || 0} reviews)</small>
                </span>
                <span>•</span>
                <span><i className="bi bi-clock me-1"></i> {selectedMovie.duration} mins</span>
                <span>•</span>
                <span><i className="bi bi-translate me-1"></i> {selectedMovie.language}</span>
                <span>•</span>
                <span>Released {new Date(selectedMovie.releaseDate).toLocaleDateString()}</span>
              </div>

              {/* Genres */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                {selectedMovie.genre?.map((g) => (
                  <Badge key={g} bg="dark" className="border border-secondary px-3 py-2 text-light">
                    {g}
                  </Badge>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3 mb-4">
                <Button
                  variant="cinema-primary"
                  className="btn-cinema-primary d-flex align-items-center justify-content-center gap-2 px-4 w-100 w-sm-auto"
                  style={{ minHeight: '44px' }}
                  onClick={() => setShowTrailer(true)}
                >
                  <i className="bi bi-play-circle-fill fs-5"></i> Watch Trailer
                </Button>

                <Button
                  variant="cinema-outline"
                  className="btn-cinema-outline d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto"
                  style={{ minHeight: '44px' }}
                  onClick={handleFavoriteToggle}
                >
                  <i className={`bi ${isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                  {isFavorite ? 'In Watchlist' : 'Add to Watchlist'}
                </Button>
              </div>

              {/* Synopsis */}
              <h6 className="text-light fw-bold mb-1">About the Movie</h6>
              <p className="text-secondary small mb-3" style={{ maxWidth: '750px' }}>
                {selectedMovie.description}
              </p>

              {/* Cast & Crew */}
              <div className="row g-2 text-secondary small">
                {selectedMovie.director && (
                  <div className="col-sm-6">
                    <strong>Director:</strong> <span className="text-light">{selectedMovie.director}</span>
                  </div>
                )}
                {selectedMovie.cast && selectedMovie.cast.length > 0 && (
                  <div className="col-sm-12">
                    <strong>Starring:</strong>{' '}
                    <span className="text-light">{selectedMovie.cast.join(', ')}</span>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <TrailerModal
        show={showTrailer}
        onHide={() => setShowTrailer(false)}
        trailerUrl={selectedMovie.trailerUrl}
        movieTitle={selectedMovie.title}
      />

      {/* Showtimes & Ticket Booking Section */}
      <Container className="px-lg-5 my-5">
        <div className="border-bottom border-secondary border-opacity-25 pb-3 mb-4">
          <h3 className="text-light fw-bold mb-1">Select Showtime</h3>
          <div className="text-muted small">Choose your preferred cinema and timing</div>
        </div>

        {/* Date Selector Pills */}
        <div className="d-flex gap-2 overflow-auto pb-3 mb-4">
          {dates.map((d) => {
            const isActive = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`btn text-center px-4 py-2 rounded-3 border transition-all ${
                  isActive
                    ? 'btn-danger border-danger text-light shadow'
                    : 'btn-dark border-secondary border-opacity-50 text-secondary'
                }`}
                style={{ minWidth: '100px' }}
              >
                <div className="small fw-semibold">{d.dayName}</div>
                <div className="fw-bold fs-6">{d.monthDay}</div>
              </button>
            );
          })}
        </div>

        {/* Theatres & Show list */}
        {showsLoading ? (
          <Loader message="Loading showtimes for selected date..." />
        ) : Object.keys(theatreMap).length === 0 ? (
          <div className="text-center py-5 bg-dark rounded border border-secondary border-opacity-25">
            <i className="bi bi-calendar-x fs-1 text-secondary mb-2 d-inline-block"></i>
            <h5 className="text-light">No shows available on this date</h5>
            <p className="text-muted small">Please select another date above or check back shortly.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {Object.values(theatreMap).map(({ theatre, shows: tShows }) => (
              <Card key={theatre._id} className="imv-card p-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 border-bottom border-secondary border-opacity-25 pb-2">
                  <div>
                    <h5 className="text-light fw-bold mb-0">
                      <i className="bi bi-geo-alt text-danger me-1"></i> {theatre.name}
                    </h5>
                    <div className="text-muted small">{theatre.location}</div>
                  </div>
                  <div className="text-secondary small">
                    <i className="bi bi-phone me-1"></i> M-Ticket Available
                  </div>
                </div>

                {/* Show Timing Chips */}
                <div className="d-flex flex-wrap gap-3">
                  {tShows.map((show) => (
                    <Link
                      key={show._id}
                      to={`/shows/${show._id}/seats`}
                      className="btn btn-outline-warning rounded-3 px-3 py-2 text-decoration-none text-center"
                      style={{ minWidth: '130px' }}
                    >
                      <div className="fw-bold fs-6">{show.startTime}</div>
                      <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                        {show.screenName}
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>

      {/* User Reviews Section */}
      <Container className="px-lg-5 my-5">
        <div className="border-bottom border-secondary border-opacity-25 pb-3 mb-4">
          <h3 className="text-light fw-bold mb-1">Audience Reviews</h3>
          <div className="text-muted small">Read verified audience feedback or leave your own review</div>
        </div>

        <Row className="g-4">
          {/* Write a Review Box */}
          <Col lg={4}>
            <Card className="imv-card p-4">
              <h5 className="text-light fw-bold mb-3">Rate & Review</h5>
              <Form onSubmit={handleReviewSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-secondary small">Your Rating (1 to 5 Stars)</Form.Label>
                  <div className="d-flex gap-2 align-items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bi ${star <= rating ? 'bi-star-fill text-warning' : 'bi-star text-secondary'} fs-4 cursor-pointer`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setRating(star)}
                      ></i>
                    ))}
                    <span className="text-light fw-bold ms-2">{rating} / 5</span>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="text-secondary small">Your Review</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Share what you thought about the plot, direction, acting, and visuals..."
                    className="bg-dark text-light border-secondary"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="cinema-primary"
                  className="btn-cinema-primary w-100"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </Button>
              </Form>
            </Card>
          </Col>

          {/* Reviews List */}
          <Col lg={8}>
            {reviewsLoading ? (
              <Loader message="Loading reviews..." />
            ) : reviews.length === 0 ? (
              <div className="text-center py-4 bg-dark rounded border border-secondary border-opacity-25 text-muted small">
                No reviews yet. Be the first to share your thoughts on {selectedMovie.title}!
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((rev) => (
                  <Card key={rev._id} className="imv-card p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-person-circle fs-5 text-secondary"></i>
                        <strong className="text-light">{rev.user?.name || 'Anonymous User'}</strong>
                      </div>
                      <div className="text-warning small">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <i key={i} className="bi bi-star-fill me-1"></i>
                        ))}
                      </div>
                    </div>
                    <p className="text-secondary small mb-1">{rev.comment}</p>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MovieDetailPage;
