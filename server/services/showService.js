const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const Seat = require('../models/Seat');

const createShow = async (showData) => {
  const theatre = await Theatre.findById(showData.theatre);
  if (!theatre) {
    const error = new Error('Associated theatre does not exist');
    error.statusCode = 404;
    throw error;
  }

  const show = await Show.create(showData);

  // Auto-generate seats for this show based on the theatre screen configuration
  const screen = theatre.screens.find((s) => s.name === showData.screenName) || {
    rows: 6,
    seatsPerRow: 10,
    seatTypes: []
  };

  const totalRows = screen.rows || 6;
  const seatsPerRow = screen.seatsPerRow || 10;
  const pricing = show.pricing || { regular: 180, premium: 250, recliner: 400 };

  const seatsToInsert = [];
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let r = 0; r < totalRows; r++) {
    const rowChar = rowLetters[r] || `R${r + 1}`;
    let seatType = 'regular';

    // Check configured row prefixes or default distribution
    if (screen.seatTypes && screen.seatTypes.length > 0) {
      const match = screen.seatTypes.find((st) => st.rowPrefix === rowChar);
      if (match) {
        seatType = match.type;
      } else if (r >= totalRows - 1) {
        seatType = 'recliner';
      } else if (r >= Math.floor(totalRows / 2)) {
        seatType = 'premium';
      }
    } else {
      // Default: top half regular, mid-to-high premium, last row recliner
      if (r === totalRows - 1) {
        seatType = 'recliner';
      } else if (r >= 2) {
        seatType = 'premium';
      } else {
        seatType = 'regular';
      }
    }

    const price = pricing[seatType] || pricing.regular || 180;

    for (let num = 1; num <= seatsPerRow; num++) {
      seatsToInsert.push({
        show: show._id,
        seatNumber: `${rowChar}${num}`,
        row: rowChar,
        number: num,
        type: seatType,
        price,
        status: 'available',
        lockedBy: null,
        lockExpiresAt: null,
        booking: null
      });
    }
  }

  await Seat.insertMany(seatsToInsert);

  return show;
};

const getShows = async (queryParams) => {
  const { movie, theatre, date, city, status = 'active' } = queryParams;
  const filter = { status };

  if (movie) {
    filter.movie = movie;
  }

  if (theatre) {
    filter.theatre = theatre;
  }

  if (date) {
    filter.date = date;
  }

  if (city && !theatre) {
    const theatresInCity = await Theatre.find({
      city: new RegExp(`^${city.trim()}$`, 'i')
    }).select('_id');
    const theatreIds = theatresInCity.map((t) => t._id);
    filter.theatre = { $in: theatreIds };
  }

  return await Show.find(filter)
    .populate('movie', 'title posterUrl duration rating genre language')
    .populate('theatre', 'name city location')
    .sort({ date: 1, startTime: 1 })
    .lean();
};

const getShowById = async (id) => {
  const show = await Show.findById(id)
    .populate('movie')
    .populate('theatre');

  if (!show) {
    const error = new Error('Show not found');
    error.statusCode = 404;
    throw error;
  }

  return show;
};

const updateShow = async (id, updateData) => {
  const show = await Show.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
  if (!show) {
    const error = new Error('Show not found');
    error.statusCode = 404;
    throw error;
  }
  return show;
};

const deleteShow = async (id) => {
  const show = await Show.findByIdAndDelete(id);
  if (!show) {
    const error = new Error('Show not found');
    error.statusCode = 404;
    throw error;
  }
  // Delete all associated seats
  await Seat.deleteMany({ show: id });
  return show;
};

module.exports = {
  createShow,
  getShows,
  getShowById,
  updateShow,
  deleteShow
};
