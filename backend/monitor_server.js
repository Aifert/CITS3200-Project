const axios = require('axios');

async function startMonitorRadio(SDR_URL, params, headers) {
  try {
    // First, tune to the specified file
    const queryParams = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const paramsStr = queryParams ? `?${queryParams}` : '';
    console.log(`${SDR_URL}tune${paramsStr}`)
    const tuneResponse = await axios.get(`${SDR_URL}tune${paramsStr}`, {
      headers: headers,
      insecureHTTPParser: true
    });

    if (tuneResponse.status == 200){
        streamResponse = await axios.get(`${SDR_URL}stream`, {
        headers: headers,
        responseType: 'stream',
        insecureHTTPParser: true,
      });

      return streamResponse.data;

    }
    else{
      throw new Error("Error tuning to file");
    }
  }
  catch (error) {
    throw new Error(error.message);
  }
}
async function startMonitorMP3(SDR_URL, params, headers) {
  try {
    // First, tune to the specified file
    const queryParams = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    const paramsStr = queryParams ? `?${queryParams}` : '';

    const tuneResponse = await axios.get(`${SDR_URL}tune${paramsStr}`, {
      headers: headers,
      insecureHTTPParser: true
    });

    if (tuneResponse.status == 200){
      const streamResponse = await axios.get(`${SDR_URL}stream`, {
        headers: headers,
        responseType: 'stream',
        insecureHTTPParser: true,
      });

      return streamResponse.data;

    }
    else{
      throw new Error("Error tuning to file");
    }
  }
  catch (error) {
    throw new Error(error.message);
  }
}


async function stopMonitor(SDR_URL, headers){
    try {
      await axios.get(`${SDR_URL}stop`, {
        headers: headers,
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
  decideMonitorMode,
  startMonitorRadio,
}
