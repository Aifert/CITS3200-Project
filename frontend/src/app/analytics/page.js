'use client';

import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const AnalyticsPage = () => {
  const [channelData, setChannelData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [timeScale, setTimeScale] = useState(86400);
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}api/` || 'http://localhost:9000/api/';

  const { data: session, status } = useSession();
  const router = useRouter();

  const makeApiRequest = useCallback(async (url, options = {}) => {
    console.log(`Making API request to: ${url}`); // Log the URL being called

    if (!session || !session.accessToken) {
      setErrorMessage('No active session. Please log in.');
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
        console.log(`Error Response:`, responseData); // Log error response if API request fails
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`API Response Data from ${url}:`, responseData); // Log the returned data
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      setErrorMessage(`API request failed: ${error.message}`);
      return null;
    }
  }, [session, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const timeScales = {
    '24 hours': 86400,
    '7 days': 86400 * 7,
    '30 days': 86400 * 30,
  };

  useEffect(() => {
    const fetchChannelData = async () => {
      if (status !== 'authenticated') return;

      try {
        const activeChannelsData = await makeApiRequest(`${backendUrl}active-channels`);
        console.log('Active channels response:', activeChannelsData); // Log active channels data

        // Check if activeChannelsData is valid
        if (!activeChannelsData || (!activeChannelsData.active && !activeChannelsData.offline && !activeChannelsData.busy)) {
          setErrorMessage('No active, offline, or busy channels found.');
          return;
        }

        if (activeChannelsData.active || activeChannelsData.offline || activeChannelsData.busy) {
          const allChannels = [
            ...activeChannelsData.active?.map(channel => ({ ...channel, status: 'Active' })) || [],
            ...activeChannelsData.offline?.map(channel => ({ ...channel, status: 'Offline' })) || [],
            ...activeChannelsData.busy?.map(channel => ({ ...channel, status: 'Busy' })) || [],
          ];

          const channelIds = allChannels.map(channel => channel['channel-id']);

          const queryString = new URLSearchParams({
            'start-time': timeScale, // Dynamic based on the selected time scale
            'whitelist': `[${channelIds.join(',')}]`
          }).toString();

          const analyticsUrl = `${backendUrl}analytics/data?${queryString}`;
          console.log('Fetching analytics data from:', analyticsUrl); // Log the URL for analytics data

          const analyticsData = await makeApiRequest(analyticsUrl);
          console.log('Analytics data response:', analyticsData); // Log analytics data

          if (analyticsData) {
            const processedData = allChannels.map(channel => {
              const channelId = channel['channel-id'];
              const analyticsForChannel = analyticsData?.[channelId] || {};  
              const strengthData = analyticsForChannel?.strength?.values || {};  
              const utilisationData = analyticsForChannel?.utilisation?.values || [];  

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
                    return `${deltaSeconds}`;
                  })
                : [];

              const utilizationLabels = utilisationData.map(util => {
                const startTime = new Date(util[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(util[1] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `${startTime} - ${endTime}`; 
              });

              // Create data for graphs
              const dataUtilization = hasUtilizationData
                ? {
                    labels: utilizationLabels,
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
                    labels: strengthLabels, 
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
                utilization: hasUtilizationData ? (analyticsForChannel?.utilisation?.average?.toFixed(3) || 'No data') : 'No data',
                strength: hasStrengthData ? (analyticsForChannel?.strength?.average?.toFixed(3) || 'No data') : 'No data',
                dataUtilization,
                dataStrength,
                isFavorite: channel.isFavorite,
                id: channel['channel-id'],
              };
            });
            console.log('Processed Data:', processedData); // Log processed data before setting state
            setChannelData(processedData);
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
  }, [timeScale, status, router, backendUrl, makeApiRequest]); // Re-fetch data when time scale changes

  // Function to toggle favorite status of a channel
  const toggleFavorite = (channelId) => {
    const updatedChannels = channelData.map(channel =>
      channel.id === channelId
        ? { ...channel, isFavorite: !channel.isFavorite }
        : channel
    );
    setChannelData(updatedChannels);

    // Move favorites to the top
    const favorites = updatedChannels.filter(channel => channel.isFavorite);
    const nonFavorites = updatedChannels.filter(channel => !channel.isFavorite);
    setChannelData([...favorites, ...nonFavorites]);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Channel Analytics</h1>

      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

      {/* Time scale selection dropdown */}
      <div className="mb-6">
        <label className="mr-2">Select Time Scale:</label>
        <select
          value={timeScale}
          onChange={e => setTimeScale(Number(e.target.value))} // Update the time scale
          className="p-2 border border-gray-300 rounded"
        >
          {Object.entries(timeScales).map(([label, value]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

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
              <button onClick={() => toggleFavorite(channel.id)}>
                {channel.isFavorite ? ' ★' : ' ☆'}
              </button>
            </div>
            <div className="flex items-center justify-center border-r border-gray-300">
              <div>
                <span>{channel.utilization}</span>
                <p>Utilization</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div>
                <span>{channel.strength}</span>
                <p>Signal Strength (dBm)</p>
              </div>
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