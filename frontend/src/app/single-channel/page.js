'use client';

import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip } from 'chart.js';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const SingleChannelPage = () => {
  const [channelData, setChannelData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedTimeScale, setSelectedTimeScale] = useState('24 hours');
  const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}api/` || 'http://localhost:9000/api/';

  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');

  const timeScales = {
    '60 minutes': { timeScale: 3600, sampleRate: 300 },
    '3 hours': { timeScale: 10800, sampleRate: 600 },
    '12 hours': { timeScale: 43200, sampleRate: 1200 },
    '24 hours': { timeScale: 86400, sampleRate: 1800 },
    '3 days': { timeScale: 259200, sampleRate: 7200 },
    '7 days': { timeScale: 604800, sampleRate: 10800 },
    '30 days': { timeScale: 2592000, sampleRate: 86400 },
  };

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

  const makeApiRequest = useCallback(
    async (url, options = {}) => {
      if (!session || !session.accessToken) {
        setErrorMessage('No active session. Please log in.');
        router.push('/login');
        return null;
      }

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      };

      try {
        const response = await fetch(url, { credentials: 'include', ...options, headers });
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return responseData;
      } catch (error) {
        setErrorMessage(`API request failed: ${error.message}`);
        return null;
      }
    },
    [session, router]
  );

  const fetchChannelData = useCallback(async () => {
    const { timeScale, sampleRate } = timeScales[selectedTimeScale];

    if (status !== 'authenticated' || !channelId) return;

    try {
      const activeChannelsData = await makeApiRequest(`${backendUrl}active-channels`);

      if (!activeChannelsData || (!activeChannelsData.active && !activeChannelsData.offline && !activeChannelsData.busy)) {
        setErrorMessage('No active, offline, or busy channels found.');
        return;
      }

      const channel =
        activeChannelsData.active?.find((channel) => String(channel['channel-id']) === String(channelId))
          ? { ...activeChannelsData.active.find((channel) => String(channel['channel-id']) === String(channelId)), status: 'Active' }
          : activeChannelsData.offline?.find((channel) => String(channel['channel-id']) === String(channelId))
          ? { ...activeChannelsData.offline.find((channel) => String(channel['channel-id']) === String(channelId)), status: 'Offline' }
          : activeChannelsData.busy?.find((channel) => String(channel['channel-id']) === String(channelId))
          ? { ...activeChannelsData.busy.find((channel) => String(channel['channel-id']) === String(channelId)), status: 'Busy' }
          : null;

      if (!channel) {
        setErrorMessage('Channel not found.');
        return;
      }

      const queryString = new URLSearchParams({
        'start-time': timeScale,
        'sample-rate': sampleRate,
        'avg-data': true,
        whitelist: `[${channelId}]`,
      }).toString();

      const analyticsUrl = `${backendUrl}analytics/data?${queryString}`;

      const analyticsData = await makeApiRequest(analyticsUrl);

      const strengthData = analyticsData?.[channelId]?.strength?.values || {};
      const utilisationData = analyticsData?.[channelId]?.utilisation?.zones || [];

      const utilisationArray = Object.values(utilisationData).map((val) => val ?? null);
      const utilisationLabels = Object.keys(utilisationData);
      const formattedUtilisationLabels = utilisationLabels.map((label, index) => {
        return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
      });

      const strengthArray = Object.values(strengthData).map((val) => val ?? null);
      const strengthLabels = Object.keys(strengthData);
      const formattedStrengthLabels = strengthLabels.map((label, index) => {
        return formatTimeLabelDirectly(index, timeScales[selectedTimeScale].sampleRate);
      });

      const dataUtilisation = utilisationArray.length
        ? {
            labels: formattedUtilisationLabels.reverse(),
            datasets: [
              {
                label: 'Utilisation Over Time',
                data: utilisationArray.reverse(),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
              },
            ],
          }
        : 'No data';

      const dataStrength = strengthArray.length
        ? {
            labels: formattedStrengthLabels.reverse(),
            datasets: [
              {
                label: 'Strength Over Time (dBm)',
                data: strengthArray.reverse(),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
              },
            ],
          }
        : 'No data';

      const newChannelData = {
        status: channel.status,
        name: channel['channel-name'],
        frequency: channel.frequency / 1e6,
        utilisation: analyticsData?.[channelId]?.utilisation?.average ? analyticsData?.[channelId]?.utilisation?.average.toFixed(3) : 'No data',
        strength: analyticsData?.[channelId]?.strength?.average ? analyticsData?.[channelId]?.strength?.average.toFixed(3) : 'No data',
        dataUtilisation,
        dataStrength,
      };

      setChannelData(newChannelData);
    } catch (error) {
      setErrorMessage('Fetch error: ' + error.message);
    }
  }, [selectedTimeScale, status, backendUrl, channelId, makeApiRequest]);

  useEffect(() => {
    fetchChannelData();
  }, [selectedTimeScale, fetchChannelData]);

  const downloadData = (dataType) => {
    const { timeScale } = timeScales[selectedTimeScale];
    const url = `${backendUrl}analytics/${dataType}-dump?whitelist=[${channelId}]&start-time=${timeScale}`;
    window.location.href = url;
  };

  if (!channelData) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Channel: {channelData.name} ({channelData.frequency.toFixed(6)} MHz)
      </h1>

      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

      <div className="mb-10 flex justify-between items-center">
        <div className="flex space-x-4">
          <label className="mr-2">Select Time Scale:</label>
          <select value={selectedTimeScale} onChange={(e) => setSelectedTimeScale(e.target.value)} className="p-2 border border-gray-300 rounded">
            {Object.keys(timeScales).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          Download:
          <button onClick={() => downloadData('strength')} className="ml-2 text-blue-600" title="All Strength Data">
            <i className="fas fa-download"></i>
          </button>
          <button onClick={() => downloadData('util')} className="ml-2 text-blue-600" title="All Utilisation Data">
            <i className="fas fa-download"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-4 bg-white border-b border-gray-300">
        <div className="flex items-center justify-center border-r border-gray-300">
          {channelData.status === 'Active' ? (
            <span className="bg-green-500 text-white px-4 py-1 rounded">Live</span>
          ) : (
            <span>{channelData.status}</span>
          )}
        </div>
        <div className="flex items-center justify-center border-r border-gray-300">
          {channelData.name} ({channelData.frequency.toFixed(6)} MHz)
        </div>
        <div className="flex items-center justify-center border-r border-gray-300">
          <span>Utilisation: {channelData.utilisation}</span>
        </div>
        <div className="flex items-center justify-center">
          <span>Strength: {channelData.strength}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-white">
        <div>
          {typeof channelData.dataUtilisation === 'string' ? (
            <p>{channelData.dataUtilisation}</p>
          ) : (
            <Line
              data={channelData.dataUtilisation}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Utilisation (%)' },
                  },
                  x: { title: { display: true, text: 'Time Ago' } },
                },
              }}
            />
          )}
        </div>
        <div>
          {typeof channelData.dataStrength === 'string' ? (
            <p>{channelData.dataStrength}</p>
          ) : (
            <Line
              data={channelData.dataStrength}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: { min: -110, max: -70, title: { display: true, text: 'Strength (dBm)' } },
                  x: { title: { display: true, text: 'Time Ago' } },
                },
                spanGaps: true,
                segment: {
                  borderDash: (ctx) => (ctx.p1.parsed.y === null || ctx.p0.parsed.y === null ? [6, 6] : undefined),
                  borderColor: (ctx) => (ctx.p1.parsed.y === null || ctx.p0.parsed.y === null ? 'rgba(255, 99, 132, 0.5)' : 'rgb(255, 99, 132)'),
                },
                plugins: {
                  tooltip: {
                    enabled: true,
                    callbacks: {
                      label: function (context) {
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
  );
};

export default SingleChannelPage;
