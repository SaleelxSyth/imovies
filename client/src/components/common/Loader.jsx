import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loader = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="text-center py-5">
      <Spinner animation="border" variant="danger" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <div className="mt-3 text-secondary fw-semibold">{message}</div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
