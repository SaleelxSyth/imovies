import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async ({ showId, seats }, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings', { showId, seats });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Booking creation failed');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/my', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'booking/fetchBookingById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch booking details');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`, { reason });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const createPaymentOrder = createAsyncThunk(
  'booking/createPaymentOrder',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/create-order', { bookingId });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Payment initiation failed');
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'booking/verifyPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/verify', paymentData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Payment verification failed');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    currentBooking: null,
    myBookings: [],
    pagination: { total: 0, page: 1, pages: 1, limit: 10 },
    loading: false,
    paymentLoading: false,
    error: null,
    confirmedBooking: null
  },
  reducers: {
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
      state.error = null;
    },
    clearConfirmedBooking: (state) => {
      state.confirmedBooking = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create pending booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // My bookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.myBookings = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single booking
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify payment
      .addCase(verifyPayment.pending, (state) => {
        state.paymentLoading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.confirmedBooking = action.payload.booking;
        state.currentBooking = null;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.error = action.payload;
      })
      // Cancel booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        if (state.currentBooking && state.currentBooking._id === action.payload.booking._id) {
          state.currentBooking = action.payload.booking;
        }
        state.myBookings = state.myBookings.map((b) =>
          b._id === action.payload.booking._id ? action.payload.booking : b
        );
      });
  }
});

export const { clearCurrentBooking, clearConfirmedBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
