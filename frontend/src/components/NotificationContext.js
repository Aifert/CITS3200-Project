'use client';

import React, { createContext, useState, useEffect } from 'react';

// Create Context
export const NotificationContext = createContext();

// Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Load notifications from local storage on mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
  }, []);

  // Save notifications to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Add a new notification
  const addNotification = (message) => {
    const newNotification = {
      id: Date.now(),
      message,
      seen: false,
      timestamp: new Date().toLocaleString(),
    };
    setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
  };

  // Mark all notifications as seen
  const markAllAsSeen = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) => ({ ...notif, seen: true }))
    );
  };

  // Dismiss a notification
  const dismissNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.id !== id)
    );
  };

  // Check if there are unseen notifications
  const hasUnseenNotifications = notifications.some((notif) => !notif.seen);

  // Simulate an event every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Example condition: Randomly generate a weak signal event
      const isSignalWeak = Math.random() < 0.5; // 50% chance
      if (isSignalWeak) {
        addNotification('Radio signal has been weak for the past hour.');
      }
    }, 30000); // 30,000 milliseconds = 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAllAsSeen,
        dismissNotification,
        hasUnseenNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
