import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MovieCard from '../components/movie/MovieCard';
import Loader from '../components/common/Loader';

const WatchlistPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users/favorites');
        setFavorites(res.data.data || []);
      } catch (err) {
        console.error('Failed to load favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  return (
    <Container className="px-lg-5 py-5">
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-25 pb-3">
        <div>
          <h2 className="text-light fw-bold mb-1">My Watchlist</h2>
          <div className="text-muted small">Movies you have bookmarked for future watching</div>
        </div>
        <Link to="/movies" className="btn btn-sm btn-cinema-primary">
          Explore Movies
        </Link>
      </div>

      {loading ? (
        <Loader message="Loading your watchlist..." />
      ) : favorites.length === 0 ? (
        <div className="text-center py-5 bg-dark rounded border border-secondary border-opacity-25">
          <i className="bi bi-heart fs-1 text-secondary mb-3 d-inline-block"></i>
          <h4 className="text-light">Your watchlist is empty</h4>
          <p className="text-muted small mb-3">
            Click the heart icon on any movie poster to add it to your personal watchlist.
          </p>
          <Link to="/movies" className="btn btn-cinema-primary">
            Browse Trending Movies
          </Link>
        </div>
      ) : (
        <Row className="g-2 g-sm-3 g-md-4">
          {favorites.map((movie) => (
            <Col key={movie._id} xs={6} md={4} lg={3}>
              <MovieCard movie={movie} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default WatchlistPage;
