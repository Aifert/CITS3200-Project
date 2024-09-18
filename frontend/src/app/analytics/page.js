'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import Link from 'next/link';

// Register Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const AnalyticsPage = () => {
  const [channelData, setChannelData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        const response = await fetch('http://localhost:9000/active-channels');
        const data = await response.json();

        console.log('Active channels response:', data);

        if (data.active || data.offline || data.busy) {
          // Extract the channel IDs from all available channels and assign status
          const allChannels = [
            ...data.active.map(channel => ({ ...channel, status: 'Active' })),
            ...data.offline.map(channel => ({ ...channel, status: 'Offline' })),
            ...data.busy.map(channel => ({ ...channel, status: 'Busy' }))
          ];
          const channelIds = allChannels.map(channel => channel['channel-id']);

          // Fetch the analytics data for those channels using the whitelist and start-time
          const startTime = 86400; // Request data for the past 24 hours
          const queryString = new URLSearchParams({
            'start-time': startTime,
            'whitelist': `[${channelIds.join(',')}]`
          }).toString();

          const analyticsResponse = await fetch(`http://localhost:9000/analytics/data?${queryString}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          const analyticsUrl = `http://localhost:9000/analytics/data?${queryString}`;
          console.log('Fetching analytics data from:', analyticsUrl);

          const analyticsData = await analyticsResponse.json();
          console.log('Analytics data response:', analyticsData);

          if (analyticsResponse.status < 400) {
            // Process the data from analytics
            const processedData = allChannels.map(channel => {
              const channelId = channel['channel-id'];
              const analyticsForChannel = analyticsData?.[channelId] || {};  // Ensure the data is accessed safely
              const strengthData = analyticsForChannel?.strength?.values || {};  // Access strength values
              const utilisationData = analyticsForChannel?.utilisation?.values || [];  // Access utilization values

              // Check if data exists for the channel
              const hasStrengthData = Object.keys(strengthData).length > 0;
              const hasUtilizationData = utilisationData.length > 0;

              // Get the last timestamp for relative time calculation
              const lastTimestamp = hasStrengthData
                ? Math.max(...Object.keys(strengthData).map(Number))
                : null;

              // Convert timestamps for strength graph into relative time
              const strengthLabels = hasStrengthData
                ? Object.keys(strengthData).map(timestamp => {
                    const deltaSeconds = lastTimestamp - timestamp;  // Time difference in seconds
                    return `${deltaSeconds % 60}s ago`;
                  })
                : [];

              // Convert utilization timestamps to relative time (optional)
              const utilizationLabels = utilisationData.map(util => {
                const startTime = new Date(util[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(util[1] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `${startTime} - ${endTime}`;  // Format start to end time range
              });

              // Create data for graphs
              const dataUtilization = hasUtilizationData
                ? {
                    labels: utilizationLabels,  // Timestamps for utilization
                    datasets: [{
                      label: 'Utilization Over Time',
                      data: utilisationData.map(util => util[1] - util[0]), // Placeholder random data for utilization (duration)
                      borderColor: 'rgb(75, 192, 192)',
                      tension: 0.1,
                    }],
                  }
                : 'No data';

              const dataStrength = hasStrengthData
                ? {
                    labels: strengthLabels,  // Relative time labels for strength
                    datasets: [{
                      label: 'Strength Over Time (dBm)',
                      data: Object.values(strengthData),
                      borderColor: 'rgb(255, 99, 132)',
                      tension: 0.1,
                    }],
                  }
                : 'No data';

              return {
                status: channel.status,
                name: channel['channel-name'],
                frequency: channel.frequency / 1e6,  // Convert frequency to MHz
                utilization: hasUtilizationData ? analyticsForChannel?.utilisation?.average : 'No data',
                strength: hasStrengthData ? analyticsForChannel?.strength?.average : 'No data',
                dataUtilization,
                dataStrength,
              };
            });
            console.log('Processed Data:', processedData);
            setChannelData(processedData);
          } else {
            setErrorMessage('Error fetching analytics data: ' + analyticsData.errors);
          }
        } else {
          setErrorMessage('No active channels found');
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

      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

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
              {channel.name} ({channel.frequency.toFixed(6)} MHz)
            </div>
            <div className="flex items-center justify-center border-r border-gray-300">
              {channel.utilization}
            </div>
            <div className="flex items-center justify-center">
              {channel.strength}
            </div>
          </div>

          {/* Second Row: Graphs */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-white">
            {/* Utilization Over Time Graph */}
            <div>
              {typeof channel.dataUtilization === 'string' ? (
                <p>{channel.dataUtilization}</p>
              ) : (
                <Line data={channel.dataUtilization} options={{ maintainAspectRatio: false }} />
              )}
            </div>
            {/* Strength Over Time Graph */}
            <div>
              {typeof channel.dataStrength === 'string' ? (
                <p>{channel.dataStrength}</p>
              ) : (
                <Line
                  data={channel.dataStrength}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: -110,
                        max: -70,
                        title: {
                          display: true,
                          text: 'Signal Strength (dBm)',
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Time (relative, seconds ago)',
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsPage;