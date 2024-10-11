'use client';

import React, { useContext, useState, useRef, useEffect } from 'react';
import { NotificationContext } from './NotificationContext';
import { FiBell, FiBellOff, FiX } from 'react-icons/fi';

const NotificationConfigureBell = ({channelId}) => {

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      let channelItem = window.localStorage.getItem(channelId);
      if (channelItem) {
        setTimeout(() => {
          channelItem = channelItem.split(",")
          document.getElementById(channelId.toString()+"-strength").value = channelItem[0]
          document.getElementById(channelId.toString()+"-util").value = channelItem[1]
          document.getElementById(channelId.toString()+"-util-time").value = channelItem[2]
        }, 2);
      }
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

  const updateChannelNotificationThesholds = () => {
    const strengthCutOff = document.getElementById(channelId.toString()+"-strength").value;
    const utilCutOff = document.getElementById(channelId.toString()+"-util").value;
    const utilTime = document.getElementById(channelId.toString()+"-util-time").value;
    if (window.localStorage.getItem(channelId)) {
      window.localStorage.setItem(channelId, [strengthCutOff, utilCutOff, utilTime].concat(window.localStorage.getItem(channelId).split(",").slice(3, 6)))
    } else {
      window.localStorage.setItem(channelId, [strengthCutOff, utilCutOff, utilTime, true, true, true]);
    }
  }

  const clearNotificationsForChannel = () => {
    window.localStorage.removeItem(channelId);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative focus:outline-none"
      >
          <FiBell className="w-6 h-6 text-blue-600" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-50">
          <div className="p-4">
            <div className="md:flex md:items-center mb-6">
    <div className="md:w-2/3">
      <label className="block text-gray-500 font-bold md:text-center mb-1 md:mb-0 pr-4">
        Strength
      </label>
    </div>
    <div className="md:w-1/3">
      <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="number" defaultValue="-90.0" step="0.1" id={channelId.toString() + "-strength"} />
    </div>
  </div>
  <div className="md:flex md:items-center mb-6">
    <div className="md:w-2/3">
      <label className="block text-gray-500 font-bold md:text-center mb-1 md:mb-0 pr-4">
        Utilization Percentage
      </label>
    </div>
    <div className="md:w-1/3">
      <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="number" max="100" min="0" step="1" defaultValue="5" id={channelId.toString() + "-util"} />
    </div>
  </div>
  <div className="md:flex md:items-center mb-6">
    <div className="md:w-2/3">
      <label className="block text-gray-500 font-bold md:text-center mb-1 md:mb-0 pr-4">
        Utilization Hours
      </label>
    </div>
    <div className="md:w-1/3">
      <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="number" defaultValue="1" min="1" step="1" id={channelId.toString() + "-util-time"} />
    </div>
  </div>
  <div className="md:flex md:items-center justify-between">
    <div className="">
      <button className="shadow bg-emerald-500 hover:bg-emerald-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" type="button" onClick={updateChannelNotificationThesholds} >
        Start
      </button>
    </div>
    <div className="">
      <button className="shadow bg-blue-500 hover:bg-blue-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" type="button" onClick={clearNotificationsForChannel}>
        Stop
      </button>
    </div>
  </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationConfigureBell;
