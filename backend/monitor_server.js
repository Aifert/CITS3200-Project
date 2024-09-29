const axios = require('axios');

async function startMonitorRadio(SDR_URL, SDR_PORT, params) {
  try {
    const response = await axios.get(`${SDR_URL}:${SDR_PORT}/tune/${params}`,{
      responseType: 'stream',
      insecureHTTPParser: true,
    });

    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function startMonitorMP3(SDR_URL, SDR_PORT, params) {
  const queryParams = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const paramsStr = queryParams ? `?${queryParams}` : '';
  console.log(`${SDR_URL}:${SDR_PORT}/tune${paramsStr}`);
  try {
    const response = await axios.get(`${SDR_URL}:${SDR_PORT}/tune${paramsStr}`,{
      responseType: 'stream',
      insecureHTTPParser: true,
    });

    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function stopMonitor(SDR_URL, SDR_PORT){
    try {
      console.log(`${SDR_URL}:${SDR_PORT}/api/monitor/stop`);
      await axios.get(`${SDR_URL}:${SDR_PORT}/api/monitor/stop`, {
        insecureHTTPParser: true
      });
    } catch (error) {
        throw new Error(error.message);
    }
}

function decideMonitorMode(session_id, channel_id, frequency){

  // Decide by precendence, session_id, channel_id then frequency
  if (session_id !== '') {
    return session_id;
  } else if (channel_id !== '') {
    return channel_id;
  } else {
    return frequency;
  }
}

module.exports = {
  startMonitorMP3,
  stopMonitor,
  decideMonitorMode
}
