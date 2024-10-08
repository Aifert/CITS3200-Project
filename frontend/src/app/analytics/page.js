'use client';

import { useState, useEffect, useCallback, useMemo  } from 'react';
import { Line, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler } from 'chart.js';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NotificationConfigureBell from '../../components/NotificationConfigureBell';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

const AnalyticsPage = () => {
  const [channelData, setChannelData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [updatedTime, setUpdatedTime] = useState(false);
  const [selectedTimeScale, setSelectedTimeScale] = useState('24 hours');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9000/api/';

  if (!updatedTime && localStorage.getItem("time-scale")) {
      console.log("here1")
      setUpdatedTime(true);
      setSelectedTimeScale(localStorage.getItem("time-scale"));
  }
  const { data: session, status } = useSession();
  const router = useRouter();
   const timeScales = useMemo(() => {
    return {
      '10 minutes': { timeScale: 600, sampleRate: 60, isStep: true },  // 1 hour, sample rate 5 minutes
      '60 minutes': { timeScale: 3600, sampleRate: 300, isStep: false  },  // 1 hour, sample rate 5 minutes
      '3 hours': { timeScale: 10800, sampleRate: 600, isStep: false  },    // 3 hours, sample rate 10 minutes
      '12 hours': { timeScale: 43200, sampleRate: 1200, isStep: false  },  // 12 hours, sample rate 20 minutes
      '24 hours': { timeScale: 86400, sampleRate: 1800, isStep: false  },  // 24 hours, sample rate 30 minutes
      '3 days': { timeScale: 259200, sampleRate: 7200, isStep: false  },   // 3 days, sample rate 2 hours
      '7 days': { timeScale: 604800, sampleRate: 10800, isStep: false  },  // 7 days, sample rate 3 hours
      '30 days': { timeScale: 2592000, sampleRate: 86400, isStep: false  } // 30 days, sample rate 1 day
    };
  }, []);
  
  const formatTimeLabelDirectly = (index, sampleRate) => {
    const secondsAgo = sampleRate * (index + 1);
    
    if (secondsAgo >= 86400) {
      const daysAgo = (secondsAgo / 86400).toFixed(2);
      return `${daysAgo} day(s)`;
    } else if (secondsAgo >= 3600) {
      const hoursAgo = (secondsAgo / 3600).toFixed(2); 
      return `${hoursAgo} hour(s)`;
    } else {
      const minutesAgo = (secondsAgo / 60).toFixed(2); 
      return `${minutesAgo} minute(s)`;
    }
  };

  const makeApiRequest = useCallback(async (url, options = {}) => {
    console.log(`Making API request to: ${url}`); 

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
        console.log(`Error Response:`, responseData); 
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`API Response Data from ${url}:`, responseData); 
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      setErrorMessage(`API request failed: ${error.message}`);
      return null;
    }
  }, [session, router]);

  const fetchChannelData = useCallback(async () => {
    const { timeScale, sampleRate } = timeScales[selectedTimeScale];

    if (status !== 'authenticated') return;

    try {
      const activeChannelsData = await makeApiRequest(`${backendUrl}active-channels`);
      console.log('Active channels response:', activeChannelsData);

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

      const isStep = timeScales[selectedTimeScale].isStep;

      const queryString = new URLSearchParams({
        'start-time': timeScale,
        'sample-rate': sampleRate,
        'avg-data': !isStep, 
        'whitelist': `[${channelIds.join(',')}]`
      }).toString();

      const analyticsUrl = `${backendUrl}analytics/data?${queryString}`;
      console.log('Fetching analytics data from:', analyticsUrl); 

      const analyticsData = await makeApiRequest(analyticsUrl);
      console.log('Analytics data response:', analyticsData);

      const processedData = allChannels.map(channel => {
        const channelId = channel['channel-id'];
        const analyticsForChannel = analyticsData?.[channelId] || {};
        const strengthData = analyticsForChannel?.strength?.values || {};
        const utilisationData = isStep ? (analyticsForChannel?.utilisation?.values || []) : (analyticsForChannel?.utilisation?.zones || []);

        let dataUtilisation;

        if (!isStep) {
          const utilisationArray = Object.values(utilisationData).map(val => val ?? null);
          const utilisationLabels = Object.keys(utilisationData);
          const formattedutilisationLabels = utilisationLabels.map((label, index) => {
            return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
          });
          dataUtilisation = utilisationArray.length
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

        } else {
          let utilStepData = [];
          const nowTime = Math.floor(new Date().getTime()/1000);
          for (let u in utilisationData) {
            utilStepData.push({"x":nowTime-utilisationData[u][0], "y":0});
            utilStepData.push({"x":nowTime-utilisationData[u][0], "y":1});
            if (utilisationData[u][1] === null) {
              utilStepData.push({"x":nowTime, "y":1});
              utilStepData.push({"x":nowTime, "y":0});
            }
            utilStepData.push({"x":nowTime-utilisationData[u][1], "y":1});
            utilStepData.push({"x":nowTime-utilisationData[u][1], "y":0});
          }

          dataUtilisation = utilisationData.length
            ? {
                datasets: [{
                  label: 'Utilisation Over Time',
                  data: utilStepData,
                  borderColor: 'rgb(75, 192, 192)',
                  fill: true,
                  type: "scatter",
                  showLine: true
                }],
              }
            : 'No data';
        }

        const strengthArray = Object.values(strengthData).map(val => val ?? null);
        const strengthLabels = Object.keys(strengthData);
        const formattedStrengthLabels = strengthLabels.map((label, index) => {
          return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
        });


        const dataStrength = strengthArray.length
          ? {
              labels: formattedStrengthLabels.reverse(), 
              datasets: [{
                label: 'Strength Over Time (dBm)',
                data: strengthArray.reverse(),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
              }],
            }
          : 'No data';

        return {
          status: channel.status,
          name: channel['channel-name'],
          frequency: channel.frequency / 1e6,
          utilisation: analyticsForChannel?.utilisation?.average ? analyticsForChannel?.utilisation?.average.toFixed(3) : 'No data',
          strength: analyticsForChannel?.strength?.average ? analyticsForChannel?.strength?.average.toFixed(3) : 'No data',
          dataUtilisation,
          dataStrength,
          isFavorite: channel.isFavorite,
          id: channel['channel-id'],
        };
      });
      console.log('Processed Data:', processedData);
      setChannelData(processedData);

    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage('Fetch error: ' + error.message);
    }
  }, [timeScales, selectedTimeScale, status, backendUrl, makeApiRequest]);

  useEffect(() => {
    fetchChannelData();

    const { sampleRate } = timeScales[selectedTimeScale];
    const intervalId = setInterval(() => {
      fetchChannelData();
    }, sampleRate * 1000); 

    return () => clearInterval(intervalId);
  }, [selectedTimeScale, fetchChannelData, timeScales]);

  const downloadData = (channelId, dataType, type) => {
    const { timeScale } = timeScales[selectedTimeScale];
    const list = channelId ? `[${channelId}]` : '[]'; 
    const url = `${backendUrl}analytics/${dataType}-dump?${type}=${list}&start-time=${timeScale}`;
    window.location.href = url;
  };


  const resetTimeScale = (timeS) => {
    localStorage.setItem("time-scale", timeS)
    console.log(timeS);
    setSelectedTimeScale(timeS);
  }

  const toggleFavorite = (channelId) => {
    const updatedChannels = channelData.map(channel =>
      channel.id === channelId
        ? { ...channel, isFavorite: !channel.isFavorite }
        : channel
    );
    setChannelData(updatedChannels);
  
    const favorites = updatedChannels.filter(channel => channel.isFavorite);
    const nonFavorites = updatedChannels.filter(channel => !channel.isFavorite);
    setChannelData([...favorites, ...nonFavorites]);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Channel Analytics</h1>

      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

      {/* Time scale selection dropdown */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <label className="mr-2">Select Time Scale:</label>
          <select
            value={selectedTimeScale}
            onChange={e => resetTimeScale(e.target.value)} // Update the time scale
            className="p-2 border border-gray-300 rounded"
          >
            {Object.keys(timeScales).map(label => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>

        
        <div>
          Download:
          <button 
            onClick={() => {
              downloadData(null, 'strength', 'blacklist');
            }} 
            className="ml-2 text-blue-600"
            title="All Strength Data"
          >
            <i className="fas fa-download"></i>
          </button>

          <button 
            onClick={() => {
              downloadData(null, 'util', 'blacklist');
            }} 
            className="ml-2 text-blue-600"
            title="All Utilisation Data"
          >
            <i className="fas fa-download"></i>
          </button>
        </div>
      </div>


      {channelData.map((channel, index) => (
        <div key={index} className="mb-10">
          {/* First Row: Channel Information */}
          <div className="grid grid-cols-8 gap-4 p-4 bg-white border-b border-gray-300">
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
            <div className="flex col-span-2 items-center justify-center border-r border-gray-300">
                <Link href={`/single-channel?channelId=${channel.id}`} className="text-blue-600 hover:underline">
                  {channel.name} ({channel.frequency.toFixed(6)} MHz)
                </Link>
              <button onClick={() => toggleFavorite(channel.id)}>
                {channel.isFavorite ? ' ★' : ' ☆'}
              </button>
            </div>
            <div className="flex col-span-2 items-center justify-center border-r border-gray-300">
              <span>Utilisation: {channel.utilisation}</span>
              <button onClick={() => downloadData(channel.id, 'util', 'whitelist')} className="ml-2 text-blue-600">
                <i className="fas fa-download"></i>
              </button>
            </div>
            <div className="flex col-span-2 items-center justify-center">
              <span>Strength: {channel.strength}</span>
              <button onClick={() => downloadData(channel.id, 'strength', 'whitelist')} className="ml-2 text-blue-600">
                <i className="fas fa-download"></i>
              </button>
            </div>

            <div className="flex items-center justify-center shrink">
              <NotificationConfigureBell channelId={channel.id} />
            </div>
          </div>

          {/* Second Row: Graphs */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-white">
            {/* Utilisation Over Time Graph */}
            <div>
              {typeof channel.dataUtilisation === 'string' ? (
                <p>{channel.dataUtilisation}</p>
              ) : channel.dataUtilisation.datasets[0].type === "scatter" ? (
                <Scatter
                  data={channel.dataUtilisation}
                  options={{
                    aspectRatio: 6,
                    scales : {
                      y: {
                        grid: {
                          display: false,
                          },
                        ticks: {
                          display: false,
                        }
                      },
                      x: {
                        min: 0,
                        max: 600,
                        grid: {
                          display: false,
                          },
                        title: {
                          display: true,
                          text: "Time Ago (s)",
                        },
                        reverse: true
                      }
                    }
                  }}
                  />
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
                        min: -50,
                        max: 40,
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
                    spanGaps: true,
                    segment: {
                      borderDash: (ctx) => {
                        const value = ctx.p1.parsed.y === null || ctx.p0.parsed.y === null;
                        return value ? [6, 6] : undefined;
                      },
                      borderColor: (ctx) => {
                        const value = ctx.p1.parsed.y === null || ctx.p0.parsed.y === null;
                        return value ? 'rgba(255, 99, 132, 0.5)' : 'rgb(255, 99, 132)';
                      },
                    },
                    plugins: {
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: function(context) {
                            return `Value: ${Number(context.raw).toFixed(2)}`;
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
