import React from 'react';
import { Modal } from 'react-bootstrap';

const TrailerModal = ({ show, onHide, trailerUrl, movieTitle }) => {
  // Convert standard youtube URL to embed format if needed
  let embedUrl = trailerUrl;
  if (trailerUrl && trailerUrl.includes('watch?v=')) {
    const videoId = trailerUrl.split('watch?v=')[1]?.split('&')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  } else if (trailerUrl && trailerUrl.includes('youtu.be/')) {
    const videoId = trailerUrl.split('youtu.be/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered contentClassName="bg-dark text-light border-secondary">
      <Modal.Header closeButton closeVariant="white" className="border-secondary">
        <Modal.Title className="fs-5">{movieTitle} - Official Trailer</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="ratio ratio-16x9">
          <iframe
            src={show ? embedUrl : ''}
            title={`${movieTitle} Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TrailerModal;
