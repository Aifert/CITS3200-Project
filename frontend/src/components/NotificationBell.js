'use client';

import React, { useContext, useState, useRef, useEffect } from 'react';
import { NotificationContext } from './NotificationContext';
import { FiBell, FiBellOff, FiX } from 'react-icons/fi';

const NotificationBell = () => {
  const {
    notifications,
    markAllAsSeen,
    dismissNotification,
    hasUnseenNotifications,
  } = useContext(NotificationContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      markAllAsSeen();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative focus:outline-none"
      >
        {hasUnseenNotifications ? (
          <FiBell className="w-6 h-6 text-red-500" />
        ) : (
          <FiBellOff className="w-6 h-6 text-gray-500" />
        )}
        {hasUnseenNotifications && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500">No notifications</p>
            ) : (
              <ul className="max-h-60 overflow-y-auto">
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className="flex justify-between items-start p-2 hover:bg-gray-100 rounded"
                  >
                    <div>
                      <p className="text-sm text-gray-700">{notif.message}</p>
                      <p className="text-xs text-gray-500">
                        {notif.timestamp}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissNotification(notif.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
