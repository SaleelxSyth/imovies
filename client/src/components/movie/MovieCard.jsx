import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserFavorites } from '../../redux/slices/authSlice';
import api from '../../services/api';
import { toast } from 'react-toastify';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const isFavorite = user?.favorites?.some(
    (f) => (typeof f === 'string' ? f : f?._id) === movie._id
  );

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please sign in to add movies to your watchlist');
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        const res = await api.delete(`/users/favorites/${movie._id}`);
        dispatch(updateUserFavorites(res.data.data));
        toast.info(`Removed "${movie.title}" from watchlist`);
      } else {
        const res = await api.post(`/users/favorites/${movie._id}`);
        dispatch(updateUserFavorites(res.data.data));
        toast.success(`Added "${movie.title}" to watchlist`);
      }
    } catch (err) {
      toast.error('Failed to update watchlist');
    }
  };

  const posterSrc = movie.posterUrl?.startsWith('/uploads')
    ? `http://localhost:5000${movie.posterUrl}`
    : movie.posterUrl;

  return (
    <Card className="imv-card imv-glass-card h-100 text-decoration-none">
      <div className="movie-poster-wrap">
        <img
          src={posterSrc || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'}
          alt={movie.title}
          loading="lazy"
        />

        {/* Rating Badge */}
        {movie.rating > 0 && (
          <div className="movie-badge-rating">
            <i className="bi bi-star-fill me-1"></i>
            {movie.rating.toFixed(1)}
          </div>
        )}

        {/* Language Tag */}
        {movie.language && (
          <div className="movie-badge-lang">
            <i className="bi bi-translate me-1"></i>
            {movie.language}
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          className="btn btn-sm position-absolute top-0 start-0 m-2 rounded-circle d-flex align-items-center justify-content-center"
          style={{
            background: 'rgba(14, 14, 18, 0.78)',
            width: '32px',
            height: '32px',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: isFavorite ? '#ef4444' : '#fff',
            zIndex: 4
          }}
          title={isFavorite ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}`}></i>
        </button>
      </div>

      <Card.Body className="d-flex flex-column p-2 p-sm-3 movie-card-body">
        <h6 className="card-title text-light fw-bold text-truncate mb-1 movie-card-title" title={movie.title}>
          {movie.title}
        </h6>

        <div className="d-flex align-items-center gap-1 gap-sm-2 mb-2 text-muted small movie-card-meta flex-wrap">
          <span><i className="bi bi-clock me-1"></i>{movie.duration}m</span>
          <span>•</span>
          <span className="text-warning fw-medium">{movie.language}</span>
          {movie.status === 'upcoming' && (
            <Badge bg="warning" className="text-dark ms-auto fw-bold" style={{ fontSize: '11px' }}>
              UPCOMING
            </Badge>
          )}
        </div>

        <div className="d-flex flex-wrap gap-1 mb-2 mb-sm-3 movie-card-genres">
          {movie.genre?.slice(0, 2).map((g) => (
            <span key={g} className="badge bg-black bg-opacity-50 text-secondary border border-secondary border-opacity-25 fw-normal" style={{ fontSize: '11px' }}>
              {g}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-1">
          <Link
            to={`/movies/${movie._id}`}
            className="btn btn-sm btn-cinema-primary w-100 text-center text-decoration-none py-1 py-sm-2"
            style={{ minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
          >
            {movie.status === 'upcoming' ? 'View Details' : 'Book Now'}
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MovieCard;
