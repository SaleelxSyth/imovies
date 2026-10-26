import React from 'react';
import { Badge } from 'react-bootstrap';

const SeatGrid = ({ seats, selectedSeats, onSeatClick, currentUserId }) => {
  // Group seats by row
  const rowsMap = {};
  seats.forEach((seat) => {
    if (!rowsMap[seat.row]) {
      rowsMap[seat.row] = [];
    }
    rowsMap[seat.row].push(seat);
  });

  const sortedRows = Object.keys(rowsMap).sort();

  const getSeatStatus = (seat) => {
    if (selectedSeats.includes(seat.seatNumber)) {
      return 'selected';
    }
    if (seat.status === 'booked') {
      return 'booked';
    }
    if (seat.status === 'locked') {
      const isMyLock = seat.isMyLock || (currentUserId && seat.lockedBy === currentUserId);
      return isMyLock ? 'selected' : 'locked';
    }
    return 'available';
  };

  return (
    <div className="seat-grid-container py-3">
      {/* Curved Cinema Screen */}
      <div className="cinema-screen-container">
        <div className="cinema-screen-curve"></div>
        <div className="cinema-screen-text">
          <i className="bi bi-chevron-down text-warning me-1"></i> ALL EYES TO THE SCREEN <i className="bi bi-chevron-down text-warning ms-1"></i>
        </div>
      </div>

      {/* Grid of Seats grouped by Row (scrolls inside container without horizontal page scroll) */}
      <div className="seat-grid-scroll-wrap">
        <div className="d-flex flex-column align-items-center gap-2 pb-2" style={{ minWidth: 'max-content', margin: '0 auto' }}>
          {sortedRows.map((rowName) => {
            const rowSeats = rowsMap[rowName].sort((a, b) => a.number - b.number);
            const rowType = rowSeats[0]?.type || 'regular';

            return (
              <div key={rowName} className="d-flex align-items-center justify-content-center flex-nowrap">
                {/* Left Row Indicator Pill */}
                <span className="row-label-pill me-2 me-sm-3" title={`Row ${rowName} (${rowType})`}>
                  {rowName}
                </span>

                {/* Seats in Row */}
                <div className="d-flex flex-nowrap justify-content-center">
                  {rowSeats.map((seat, index) => {
                    const status = getSeatStatus(seat);
                    const isAisle = index === Math.floor(rowSeats.length / 2);

                    return (
                      <React.Fragment key={seat.seatNumber}>
                        {/* Aisle Spacer */}
                        {isAisle && <div style={{ width: '20px' }}></div>}

                        <div
                          className={`seat-item ${status}`}
                          onClick={() => {
                            if (status === 'available' || status === 'selected') {
                              onSeatClick(seat);
                            }
                          }}
                          title={`Seat ${seat.seatNumber} (${seat.type.toUpperCase()}) - ₹${seat.price}`}
                        >
                          {status === 'locked' ? (
                            <i className="bi bi-lock-fill" style={{ fontSize: '0.75rem' }}></i>
                          ) : status === 'booked' ? (
                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>✕</span>
                          ) : (
                            seat.number
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Right Row Indicator Pill */}
                <span className="row-label-pill ms-2 ms-sm-3" title={`Row ${rowName} (${rowType})`}>
                  {rowName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seat Legend */}
      <div className="d-flex flex-wrap justify-content-center gap-4 mt-4 pt-4 border-top border-secondary border-opacity-25 small text-secondary">
        <div className="d-flex align-items-center gap-2">
          <div className="seat-item available" style={{ width: '22px', height: '20px', cursor: 'default' }}></div>
          <span className="text-light">Available</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="seat-item selected" style={{ width: '22px', height: '20px', cursor: 'default' }}></div>
          <span className="text-warning fw-bold">Selected</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="seat-item locked" style={{ width: '22px', height: '20px', cursor: 'default' }}>
            <i className="bi bi-lock-fill" style={{ fontSize: '0.55rem' }}></i>
          </div>
          <span style={{ color: '#fde68a' }}>Locked (In Checkout)</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="seat-item booked" style={{ width: '22px', height: '20px', cursor: 'default' }}>
            <span style={{ fontSize: '0.55rem' }}>✕</span>
          </div>
          <span className="text-muted">Booked / Sold Out</span>
        </div>
      </div>
    </div>
  );
};

export default SeatGrid;
