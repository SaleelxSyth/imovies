import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchSeatsForShow = createAsyncThunk(
  'seats/fetchSeats',
  async (showId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/shows/${showId}/seats`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch seats');
    }
  }
);

export const lockSelectedSeats = createAsyncThunk(
  'seats/lockSeats',
  async ({ showId, seats }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/shows/${showId}/seats/lock`, { seats });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not lock seats');
    }
  }
);

export const unlockSelectedSeats = createAsyncThunk(
  'seats/unlockSeats',
  async ({ showId, seats }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/shows/${showId}/seats/unlock`, { seats });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not unlock seats');
    }
  }
);

const seatSlice = createSlice({
  name: 'seats',
  initialState: {
    seats: [],
    selectedSeats: [], // ['A1', 'A2']
    selectedSeatObjects: [],
    lockExpiresAt: null,
    loading: false,
    lockLoading: false,
    error: null
  },
  reducers: {
    toggleSeatSelection: (state, action) => {
      const seat = action.payload; // { seatNumber, price, type, status }
      const seatNo = seat.seatNumber;

      if (state.selectedSeats.includes(seatNo)) {
        state.selectedSeats = state.selectedSeats.filter((s) => s !== seatNo);
        state.selectedSeatObjects = state.selectedSeatObjects.filter((s) => s.seatNumber !== seatNo);
      } else {
        if (state.selectedSeats.length >= 8) {
          state.error = 'Maximum 8 seats allowed per booking';
          return;
        }
        state.selectedSeats.push(seatNo);
        state.selectedSeatObjects.push(seat);
        state.error = null;
      }
    },
    clearSelectedSeats: (state) => {
      state.selectedSeats = [];
      state.selectedSeatObjects = [];
      state.lockExpiresAt = null;
      state.error = null;
    },
    clearSeatError: (state) => {
      state.error = null;
    },
    // Socket real-time updates
    handleSocketSeatsLocked: (state, action) => {
      const { seats, lockedBy, lockExpiresAt } = action.payload;
      state.seats = state.seats.map((s) => {
        if (seats.includes(s.seatNumber)) {
          return {
            ...s,
            status: 'locked',
            lockedBy,
            lockExpiresAt
          };
        }
        return s;
      });
    },
    handleSocketSeatsReleased: (state, action) => {
      const { seats } = action.payload;
      state.seats = state.seats.map((s) => {
        if (seats.includes(s.seatNumber)) {
          return {
            ...s,
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
            booking: null
          };
        }
        return s;
      });
    },
    handleSocketSeatsBooked: (state, action) => {
      const { seats } = action.payload;
      state.seats = state.seats.map((s) => {
        if (seats.includes(s.seatNumber)) {
          return {
            ...s,
            status: 'booked',
            lockedBy: null,
            lockExpiresAt: null
          };
        }
        return s;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch seats
      .addCase(fetchSeatsForShow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSeatsForShow.fulfilled, (state, action) => {
        state.loading = false;
        state.seats = action.payload;
      })
      .addCase(fetchSeatsForShow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Lock seats
      .addCase(lockSelectedSeats.pending, (state) => {
        state.lockLoading = true;
        state.error = null;
      })
      .addCase(lockSelectedSeats.fulfilled, (state, action) => {
        state.lockLoading = false;
        state.lockExpiresAt = action.payload.lockExpiresAt;
      })
      .addCase(lockSelectedSeats.rejected, (state, action) => {
        state.lockLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  toggleSeatSelection,
  clearSelectedSeats,
  clearSeatError,
  handleSocketSeatsLocked,
  handleSocketSeatsReleased,
  handleSocketSeatsBooked
} = seatSlice.actions;

export default seatSlice.reducer;
