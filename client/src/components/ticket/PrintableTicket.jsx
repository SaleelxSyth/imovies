import React from 'react';
import { Badge, Button } from 'react-bootstrap';

const PrintableTicket = ({ booking }) => {
  if (!booking) return null;

  const show = booking.show || {};
  const movie = show.movie || {};
  const theatre = show.theatre || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ticket-container my-4">
      <div className="ticket-wrapper">
        <div className="ticket-notch-left"></div>
        <div className="ticket-notch-right"></div>

        {/* Top Header */}
        <div className="ticket-header text-center">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="brand-logo-text fs-4 d-inline-flex align-items-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="me-2"
              >
                <circle cx="16" cy="16" r="13" stroke="#f59e0b" strokeWidth="2.5" fill="#181820" />
                <circle cx="16" cy="16" r="4" fill="#f59e0b" />
                <circle cx="16" cy="8.5" r="2" fill="#f59e0b" />
                <circle cx="16" cy="23.5" r="2" fill="#f59e0b" />
                <circle cx="8.5" cy="16" r="2" fill="#f59e0b" />
                <circle cx="23.5" cy="16" r="2" fill="#f59e0b" />
              </svg>
              <span>i<span className="gold-text">Movies</span> Pass</span>
            </span>
            <Badge bg="warning" className="text-dark fw-bold px-3 py-1">
              CONFIRMED
            </Badge>
          </div>
          <h3 className="text-light fw-bold mb-1" style={{ letterSpacing: '0.03em' }}>{movie.title || 'Cinema Ticket'}</h3>
          <div className="text-muted small">
            {theatre.name} • {theatre.city} ({show.screenName})
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-3 p-sm-4" style={{ background: '#121217' }}>
          <div className="row g-3 align-items-center mb-4 flex-column-reverse flex-sm-row">
            <div className="col-12 col-sm-8">
              <div className="row g-3">
                <div className="col-6">
                  <div className="text-secondary small">SHOW DATE</div>
                  <div className="text-light fw-bold">{show.date}</div>
                </div>
                <div className="col-6">
                  <div className="text-secondary small">TIME</div>
                  <div className="text-warning fw-bold fs-5">{show.startTime}</div>
                </div>
                <div className="col-12">
                  <div className="text-secondary small">RESERVED SEATS ({booking.seats?.length})</div>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {booking.seats?.map((seat) => (
                      <span key={seat} className="badge bg-warning text-dark fw-bold px-2 py-1 fs-6">
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-secondary small">BOOKING CODE</div>
                  <div className="text-light fw-bold font-monospace fs-6">{booking.bookingCode}</div>
                </div>
                <div className="col-6">
                  <div className="text-secondary small">TOTAL PAID</div>
                  <div className="text-warning fw-bold fs-5">₹{booking.totalAmount}</div>
                </div>
              </div>
            </div>

            {/* QR Code Column */}
            <div className="col-12 col-sm-4 text-center my-2 my-sm-0">
              {booking.qrCodeData ? (
                <div className="p-2 bg-white rounded shadow-sm d-inline-block" style={{ maxWidth: '140px' }}>
                  <img
                    src={booking.qrCodeData}
                    alt="Ticket QR Code"
                    style={{ width: '100%', height: 'auto', maxWidth: '120px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="p-3 bg-secondary rounded text-center small text-light">QR Code</div>
              )}
              <div className="text-muted mt-2" style={{ fontSize: '13px' }}>
                Scan at Gate
              </div>
            </div>
          </div>

          {/* Barcode representation */}
          <div className="text-center pt-3 border-top border-secondary border-opacity-25">
            <div className="font-monospace text-secondary small mb-1 tracking-widest">
              ||| ||||| |||| |||||| |||| | |||||||| |||||
            </div>
            <div className="text-muted small">Please arrive 15 minutes before showtime. Enjoy the movie!</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center mt-4 d-print-none">
        <Button variant="outline-light" className="me-2" onClick={handlePrint}>
          <i className="bi bi-printer me-2"></i> Print Ticket
        </Button>
      </div>
    </div>
  );
};

export default PrintableTicket;
