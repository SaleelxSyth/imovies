import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import AppNavbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AppRoutes from './routes/AppRoutes';
import { fetchCurrentUser } from './redux/slices/authSlice';
import { getSocket } from './services/socket';

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    }
    // Initialize socket connection
    getSocket();
  }, [dispatch, token]);

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100 position-relative app-shell">
        {/* Ambient Moving Glows, Grain & Vignette */}
        <div className="ambient-background" aria-hidden="true">
          <div className="ambient-glow ambient-glow-amber"></div>
          <div className="ambient-glow ambient-glow-crimson"></div>
          <div className="ambient-glow ambient-glow-violet"></div>
          <div className="ambient-grain"></div>
          <div className="ambient-vignette"></div>
        </div>

        <AppNavbar />
        <main className="flex-grow-1 position-relative" style={{ zIndex: 1 }}>
          <AppRoutes />
        </main>
        <Footer />
        <ToastContainer
          position="bottom-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </Router>
  );
}

export default App;
