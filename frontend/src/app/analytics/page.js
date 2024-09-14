'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import Link from 'next/link';

// Register Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const AnalyticsPage = () => {
  const [channelData, setChannelData] = useState([]);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        // Fetch the data from the backend
        const response = await fetch('http://localhost:9000/active-channels');
        const data = await response.json();

        if (data.active || data.offline || data.busy) {
          // Process active, busy, and offline channels
          const processedData = [
            ...data.active.map(channel => ({
              status: 'Active',
              name: `Channel ${channel['channel-id']}`,
              frequency: channel.frequency,
              utilization: Math.floor(Math.random() * 100),  // Placeholder for utilization data
              strength: Math.random() > 0.5 ? 'Strong' : 'Weak',  // Placeholder for strength
              dataUtilization: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [
                  {
                    label: 'Utilization Over Time',
                    data: Array(5).fill().map(() => Math.floor(Math.random() * 100)),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                  },
                ],
              },
              dataStrength: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [
                  {
                    label: 'Strength Over Time',
                    data: Array(5).fill().map(() => Math.floor(Math.random() * 100)),
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                  },
                ],
              },
            })),
            ...data.busy.map(channel => ({
              status: 'Busy',
              name: `Channel ${channel['channel-id']}`,
              frequency: channel.frequency,
              utilization: Math.floor(Math.random() * 100),
              strength: Math.random() > 0.5 ? 'Strong' : 'Weak',
              dataUtilization: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [
                  {
                    label: 'Utilization Over Time',
                    data: Array(5).fill().map(() => Math.floor(Math.random() * 100)),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                  },
                ],
              },
              dataStrength: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [
                  {
                    label: 'Strength Over Time',
                    data: Array(5).fill().map(() => Math.floor(Math.random() * 100)),
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                  },
                ],
              },
            })),
            ...data.offline.map(channel => ({
              status: 'Offline',
              name: `Channel ${channel['channel-id']}`,
              frequency: channel.frequency,
              utilization: Math.floor(Math.random() * 100),
              strength: Math.random() > 0.5 ? 'Strong' : 'Weak',
              dataUtilization: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [
                  {
                    label: 'Utilization Over Time',
                    data: Array(5).fill().map(() => Math.floor(Math.random() * 100)),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                  },
                ],
              },
              dataStrength: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [
                  {
                    label: 'Strength Over Time',
                    data: Array(5).fill().map(() => Math.floor(Math.random() * 100)),
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                  },
                ],
              },
            })),
          ];

          setChannelData(processedData);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setErrorMessage('Fetch error: ' + error.message);
      }
    };

    fetchChannelData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Channel Analytics</h1>

      {channelData.map((channel, index) => (
        <div key={index} className="mb-10">
          {/* First Row: Channel Information */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-white border-b border-gray-300">
            <div className="flex items-center justify-center border-r border-gray-300">
              {channel.status === 'Active' ? (
                <Link href="/monitoring">
                  <button className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600">
                    Live
                  </button>
                </Link>
              ) : (
                <span>{channel.status}</span>
              )}
            </div>
            <div className="flex items-center justify-center border-r border-gray-300">
              {channel.name} ({channel.frequency} MHz)
            </div>
            <div className="flex items-center justify-center border-r border-gray-300">
              {channel.utilization}%
            </div>
            <div className="flex items-center justify-center">
              {channel.strength}
            </div>
          </div>

          {/* Second Row: Graphs */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-white">
            {/* Utilization Over Time Graph */}
            <div>
              <Line data={channel.dataUtilization} options={{ maintainAspectRatio: false }} />
            </div>
            {/* Strength Over Time Graph */}
            <div>
              <Line data={channel.dataStrength} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsPage;

