'use client';

import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip } from 'chart.js';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const AnalyticsPage = () => {
  const [channelData, setChannelData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedTimeScale, setSelectedTimeScale] = useState('24 hours'); // Default to '24 hours'
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}api/` || 'http://localhost:9000/api/';

  const { data: session, status } = useSession();
  const router = useRouter();

  const timeScales = { 
    '60 minutes': { timeScale: 3600, sampleRate: 300 },  // 1 hour, sample rate 5 minutes
    '3 hours': { timeScale: 10800, sampleRate: 600 },    // 3 hours, sample rate 10 minutes
    '12 hours': { timeScale: 43200, sampleRate: 1200 },  // 12 hours, sample rate 20 minutes
    '24 hours': { timeScale: 86400, sampleRate: 1800 },  // 24 hours, sample rate 30 minutes
    '3 days': { timeScale: 259200, sampleRate: 7200 },   // 3 days, sample rate 2 hours
    '7 days': { timeScale: 604800, sampleRate: 10800 },  // 7 days, sample rate 3 hours
    '30 days': { timeScale: 2592000, sampleRate: 86400 } // 30 days, sample rate 1 day
  };
  
  const formatTimeLabelDirectly = (index, sampleRate) => {
    // Calculate the number of seconds ago based on the sample rate and index
    const secondsAgo = sampleRate * (index + 1);
    
    // Convert seconds into human-readable format with decimal precision
    if (secondsAgo >= 86400) {
      const daysAgo = (secondsAgo / 86400).toFixed(2); // Get days with up to 2 decimal places
      return `${daysAgo} day(s)`;
    } else if (secondsAgo >= 3600) {
      const hoursAgo = (secondsAgo / 3600).toFixed(2); // Get hours with up to 2 decimal places
      return `${hoursAgo} hour(s)`;
    } else {
      const minutesAgo = (secondsAgo / 60).toFixed(2); // Get minutes with up to 2 decimal places
      return `${minutesAgo} minute(s)`;
    }
  };

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

  const fetchChannelData = useCallback(async () => {
    const { timeScale, sampleRate } = timeScales[selectedTimeScale]; // Get timeScale and sampleRate from the selected time scale

    if (status !== 'authenticated') return;

    try {
      const activeChannelsData = await makeApiRequest(`${backendUrl}active-channels`);
      console.log('Active channels response:', activeChannelsData); // Log active channels data

      if (!activeChannelsData || (!activeChannelsData.active && !activeChannelsData.offline && !activeChannelsData.busy)) {
        setErrorMessage('No active, offline, or busy channels found.');
        return;
      }

      const allChannels = [
        ...activeChannelsData.active?.map(channel => ({ ...channel, status: 'Active' })) || [],
        ...activeChannelsData.offline?.map(channel => ({ ...channel, status: 'Offline' })) || [],
        ...activeChannelsData.busy?.map(channel => ({ ...channel, status: 'Busy' })) || [],
      ];

      const channelIds = allChannels.map(channel => channel['channel-id']);

      const queryString = new URLSearchParams({
        'start-time': timeScale,
        'sample-rate': sampleRate,
        'avg-data': true, 
        'whitelist': `[${channelIds.join(',')}]`
      }).toString();

      const analyticsUrl = `${backendUrl}analytics/data?${queryString}`;
      console.log('Fetching analytics data from:', analyticsUrl); // Log the URL for analytics data

      const analyticsData = await makeApiRequest(analyticsUrl);
      console.log('Analytics data response:', analyticsData); // Log analytics data

      const processedData = allChannels.map(channel => {
        const channelId = channel['channel-id'];
        const analyticsForChannel = analyticsData?.[channelId] || {};
        const strengthData = analyticsForChannel?.strength?.values || {};
        const utilisationData = analyticsForChannel?.utilisation?.zones || [];

        const utilisationArray = Object.values(utilisationData).map(val => val ?? null);
        const utilisationLabels = Object.keys(utilisationData);
        const formattedutilisationLabels = utilisationLabels.map((label, index) => {
          return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
        });

        const strengthArray = Object.values(strengthData).map(val => val ?? null);
        const strengthLabels = Object.keys(strengthData);
        const formattedStrengthLabels = strengthLabels.map((label, index) => {
          return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
        });

        const dataUtilisation = utilisationArray.length
          ? {
              labels: formattedutilisationLabels.reverse(),
              datasets: [{
                label: 'Utilisation Over Time',
                data: utilisationArray.reverse(),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
              }],
            }
          : 'No data';

        const dataStrength = strengthArray.length
          ? {
              labels: formattedStrengthLabels.reverse(), // Reverse the labels for the x-axis
              datasets: [{
                label: 'Strength Over Time (dBm)',
                data: strengthArray.reverse(), // Reverse the data array so that it matches the reversed labels
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
              }],
            }
          : 'No data';

        return {
          status: channel.status,
          name: channel['channel-name'],
          frequency: channel.frequency / 1e6,  // Convert frequency to MHz
          utilisation: analyticsForChannel?.utilisation?.average ? analyticsForChannel?.utilisation?.average.toFixed(3) : 'No data',
          strength: analyticsForChannel?.strength?.average ? analyticsForChannel?.strength?.average.toFixed(3) : 'No data',
          dataUtilisation,
          dataStrength,
          isFavorite: channel.isFavorite,
          id: channel['channel-id'],
        };
      });
      console.log('Processed Data:', processedData); // Log processed data before setting state
      setChannelData(processedData);

    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage('Fetch error: ' + error.message);
    }
  }, [selectedTimeScale, status, backendUrl, makeApiRequest]);

  useEffect(() => {
    fetchChannelData(); // Initial fetch

    const { sampleRate } = timeScales[selectedTimeScale];

    // Set up an interval to refetch data based on the sampleRate
    const intervalId = setInterval(() => {
      fetchChannelData();
    }, sampleRate * 1000); // Convert sampleRate (seconds) to milliseconds

    return () => clearInterval(intervalId); // Clean up the interval when the component unmounts or dependencies change
  }, [selectedTimeScale, fetchChannelData]);


  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Channel Analytics</h1>

      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

      {/* Time scale selection dropdown */}
      <div className="mb-6">
        <label className="mr-2">Select Time Scale:</label>
        <select
          value={selectedTimeScale}
          onChange={e => setSelectedTimeScale(e.target.value)} // Update the time scale
          className="p-2 border border-gray-300 rounded"
        >
          {Object.keys(timeScales).map(label => (
            <option key={label} value={label}>
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
              {console.log('Channel Utilisation:', channel.utilisation)}
              <span>{channel.utilisation}</span>
              <p>Utilisation</p>
            </div>
            <div className="flex items-center justify-center">
              <span>{channel.strength}</span>
              <p>Strength (dBm)</p>
            </div>
          </div>

          {/* Second Row: Graphs */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-white">
            {/* Utilisation Over Time Graph */}
            <div>
              {typeof channel.dataUtilisation === 'string' ? (
                <p>{channel.dataUtilisation}</p>
              ) : (
                <Line 
                  data={channel.dataUtilisation} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 0,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Utilisation (%)',
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Time Ago',
                        },
                      },
                    }, 
                  }} 
                />
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
                          text: 'Strength (dBm)',
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Time Ago',
                        },
                      },
                    },
                    spanGaps: true, // Span gaps for null values
                    segment: {
                      borderDash: (ctx) => {
                        const value = ctx.p1.parsed.y === null || ctx.p0.parsed.y === null;  // Check if the segment involves a null value
                        return value ? [6, 6] : undefined;  // Dotted line for null segments
                      },
                      borderColor: (ctx) => {
                        const value = ctx.p1.parsed.y === null || ctx.p0.parsed.y === null;
                        return value ? 'rgba(255, 99, 132, 0.5)' : 'rgb(255, 99, 132)';  // Light color for dotted line, normal for solid line
                      },
                    },
                    plugins: {
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: function(context) {
                            // Display the y value of the hovered point
                            return `Value: ${context.raw}`;
                          },
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
