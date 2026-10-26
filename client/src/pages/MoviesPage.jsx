import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, InputGroup, Pagination, Badge } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovies } from '../redux/slices/movieSlice';
import MovieCard from '../components/movie/MovieCard';
import Loader from '../components/common/Loader';

const MoviesPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { movies, pagination, loading, selectedCity } = useSelector((state) => state.movies);

  const initialSearch = searchParams.get('search') || '';
  const initialGenre = searchParams.get('genre') || '';
  const initialLanguage = searchParams.get('language') || '';
  const initialStatus = searchParams.get('status') || '';
  const initialSort = searchParams.get('sortBy') || 'releaseDate';

  const [search, setSearch] = useState(initialSearch);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);

  const genres = ['Action', 'Sci-Fi', 'Thriller', 'Drama', 'Adventure', 'Romance', 'Animation', 'Crime'];
  const languages = ['English', 'Japanese', 'French'];

  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 12,
      sortBy
    };

    if (search.trim()) params.search = search.trim();
    if (selectedGenre) params.genre = selectedGenre;
    if (selectedLanguage) params.language = selectedLanguage;
    if (selectedStatus) params.status = selectedStatus;

    dispatch(fetchMovies(params));
  }, [dispatch, search, selectedGenre, selectedLanguage, selectedStatus, sortBy, currentPage]);

  const handleGenreClick = (genre) => {
    setSelectedGenre(selectedGenre === genre ? '' : genre);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedGenre('');
    setSelectedLanguage('');
    setSelectedStatus('');
    setSortBy('releaseDate');
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <Container className="px-3 px-lg-5 py-4">
      {/* Title & Filters Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="text-light fw-bold mb-1">Explore Movies</h2>
          <div className="text-muted small">
            Showing movies in <strong className="text-warning">{selectedCity}</strong>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Sorting Dropdown */}
          <Form.Select
            size="sm"
            className="bg-dark text-light border-secondary"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="releaseDate">Latest Releases</option>
            <option value="rating">Top Rated</option>
            <option value="title">Alphabetical (A-Z)</option>
          </Form.Select>

          {(search || selectedGenre || selectedLanguage || selectedStatus) && (
            <button
              onClick={handleClearFilters}
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
            >
              <i className="bi bi-x-circle"></i> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-dark p-3 rounded border border-secondary border-opacity-25 mb-4">
        <Row className="g-3 align-items-center">
          {/* Search Box */}
          <Col lg={4} md={6}>
            <InputGroup size="sm">
              <InputGroup.Text className="bg-black text-secondary border-secondary">
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by title, cast, or director..."
                className="bg-black text-light border-secondary shadow-none"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </InputGroup>
          </Col>

          {/* Language Selector */}
          <Col lg={3} md={6}>
            <Form.Select
              size="sm"
              className="bg-black text-light border-secondary"
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Status Selector */}
          <Col lg={3} md={6}>
            <Form.Select
              size="sm"
              className="bg-black text-light border-secondary"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Show Statuses</option>
              <option value="now_showing">Now Showing</option>
              <option value="upcoming">Coming Soon</option>
            </Form.Select>
          </Col>

          <Col lg={2} md={6} className="text-end text-muted small">
            {pagination.total} movies found
          </Col>
        </Row>

        {/* Genre Chips */}
        <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top border-secondary border-opacity-25">
          <span className="text-secondary small me-2 align-self-center">Genre:</span>
          {genres.map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <Badge
                key={g}
                bg={isSelected ? 'danger' : 'dark'}
                className={`border ${isSelected ? 'border-danger' : 'border-secondary border-opacity-50'} px-3 py-2 cursor-pointer`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleGenreClick(g)}
              >
                {g}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <Loader message="Loading movie catalog..." />
      ) : movies.length === 0 ? (
        <div className="text-center py-5 bg-dark rounded border border-secondary border-opacity-25 my-4">
          <i className="bi bi-film fs-1 text-secondary mb-3 d-inline-block"></i>
          <h4 className="text-light">No movies match your filters</h4>
          <p className="text-muted small mb-3">Try adjusting your search criteria or resetting filters.</p>
          <button onClick={handleClearFilters} className="btn btn-sm btn-cinema-primary">
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <Row className="g-2 g-sm-3 g-md-4 mb-5">
            {movies.map((movie) => (
              <Col key={movie._id} xs={6} md={4} lg={3}>
                <MovieCard movie={movie} />
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center my-4">
              <Pagination className="pagination-dark">
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                />
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={currentPage === pagination.pages}
                  onClick={() => setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default MoviesPage;
