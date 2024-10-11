'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Create Context
export const NotificationContext = createContext();

// Provider Component
export const NotificationProvider = ({ children }) => {
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}` || 'http://localhost:9000/api_v2/';
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  const makeApiRequest = useCallback(async (url, options = {}) => {
    let session = await getSession();

    if (!session || !session.accessToken) {
      router.push('/login');
      return null;
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, { credentials: 'include', ...options, headers });
      const responseData = await response.json();

      if (!response.ok) {
        console.log(`Error Response:`, responseData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      return null;
    }
  }, [router]);

  // Load notifications from local storage on mount
  useEffect(() => {
    const storedNotifications = window.localStorage.getItem('notifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
  }, []);

  // Save notifications to local storage whenever they change
  useEffect(() => {
    window.localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Add a new notification
  const addNotification = (message) => {
    const newNotification = {
      id: -1-Math.random()*12345678,
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
    const interval = setInterval(async () => {
      let queryStrings = [];
      for (const key in window.localStorage) {
        if (!isNaN(key)) {
          queryStrings.push(`${key}=[${window.localStorage[key].split(",").slice(0, 3).join(",")}]`);
        }
      }
      const notificationUrl = `${backendUrl}notification?${queryStrings.join("&")}`;

      const notificationResult = await makeApiRequest(notificationUrl);

      for (let key in notificationResult) {
        if (window.localStorage.getItem(key)) {
          let cName = notificationResult[key]["name"];
          let storedValues = window.localStorage[key].split(",");
          console.log(storedValues)
          if (null===notificationResult[key]["strength"]) {
            if (storedValues[5] === "true") {
              storedValues[5] = "false";
              addNotification(`${cName} is now offline`);
            }
          } else {
            if (storedValues[5] === "false") {
              storedValues[5] = "true";
              addNotification(`${cName} is back online`);
            }
            if (storedValues[3] !== notificationResult[key]["strength"].toString()) {
              addNotification(`${cName} is ${notificationResult[key]["strength"] ? "above" : "below"} ${storedValues[0]}dB`)
              storedValues[3] = notificationResult[key]["strength"].toString();
            }
          }

          if (storedValues[4] !== notificationResult[key]["util"].toString()) {
              addNotification(`${cName} utilization is ${notificationResult[key]["util"] ? "above" : "below"} ${storedValues[1]}%`)
              storedValues[4] = notificationResult[key]["util"].toString();
          }
          window.localStorage.setItem(key, storedValues.join(","));
        }
      }
    }, 5000); // 5,000 milliseconds = 5 seconds

    return () => clearInterval(interval);
  },  [backendUrl, makeApiRequest]);

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
