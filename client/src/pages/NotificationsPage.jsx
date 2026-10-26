import React, { useEffect } from 'react';
import { Container, Card, Badge, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../redux/slices/notificationSlice';
import Loader from '../components/common/Loader';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { notifications, loading, unreadCount } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const handleNotificationClick = (id, isRead) => {
    if (!isRead) {
      dispatch(markNotificationRead(id));
    }
  };

  return (
    <Container className="px-lg-5 py-5" style={{ maxWidth: '800px' }}>
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-25 pb-3">
        <div>
          <h2 className="text-light fw-bold mb-1">Notifications</h2>
          <div className="text-muted small">Stay updated on your ticket confirmations and show updates</div>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline-warning" onClick={handleMarkAllRead}>
            <i className="bi bi-check2-all me-1"></i> Mark All as Read
          </Button>
        )}
      </div>

      {loading ? (
        <Loader message="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <div className="text-center py-5 bg-dark rounded border border-secondary border-opacity-25">
          <i className="bi bi-bell-slash fs-1 text-secondary mb-3 d-inline-block"></i>
          <h4 className="text-light">No notifications yet</h4>
          <p className="text-muted small">You will see booking alerts and updates here.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {notifications.map((n) => (
            <Card
              key={n._id}
              className={`imv-card p-3 cursor-pointer ${!n.isRead ? 'border-warning' : ''}`}
              onClick={() => handleNotificationClick(n._id, n.isRead)}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-start gap-3">
                <div
                  className={`p-2 rounded-circle fs-5 ${
                    n.type === 'booking'
                      ? 'bg-success bg-opacity-20 text-success'
                      : n.type === 'payment'
                      ? 'bg-warning bg-opacity-20 text-warning'
                      : 'bg-info bg-opacity-20 text-info'
                  }`}
                >
                  <i
                    className={`bi ${
                      n.type === 'booking'
                        ? 'bi-ticket-fill'
                        : n.type === 'payment'
                        ? 'bi-credit-card-fill'
                        : 'bi-info-circle-fill'
                    }`}
                  ></i>
                </div>

                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="text-light fw-bold mb-0">{n.title}</h6>
                    <div className="d-flex align-items-center gap-2">
                      {!n.isRead && (
                        <Badge bg="warning" className="text-dark" style={{ fontSize: '0.65rem' }}>
                          NEW
                        </Badge>
                      )}
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-secondary small mb-0">{n.message}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default NotificationsPage;
