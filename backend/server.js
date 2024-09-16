const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const {
  startMonitor,
  stopMonitor,
  decideMonitorMode } = require('./monitor_server.js');

const {
  getAliveChannels,
  getOfflineChannels,
  getBusyChannels,
  getChannelStrength,
  getChannelUtilisation,
  processIncomingData
} = require('./model_utils.js');

const app = express();
const PORT = process.env.PORT || 9000;
const FRONTEND_URL = "http://frontend"
const FRONTEND_PORT = 3000;
const SDR_URL = "http://sdr"
const SDR_PORT = 4000;


dotenv.config({ path: path.resolve(__dirname, '../.env') });

app.use(cors());

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

/**
 * Base API for monitor channels
 *
 * /monitor-channels endpoint
 *
 * <NOT NEED FOR END PRODUCT USED FOR TESTING ONLY>
 */
app.get('/monitor-channels', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'monitor.html'))
})

/**
 * API for starting monitor channels
 *
 * /monitor-channels/start
 *
 * Parameters :
 * - session-id : Unique integer identifying the session
 * - channel-id : Radio channel name to listen in
 * - frequency : The frequency to monitor
 */
app.get('/monitor-channels/start', async (req, res) => {
  const session_id = req.query['session-id'] || '';
  const channel_id = req.query['channel-id'] || '';
  const frequency = req.query['frequency'] || '';

  const modeResult = decideMonitorMode(session_id, channel_id, frequency);

  try {
    await stopMonitor(SDR_URL, SDR_PORT);
    const responseStream = await startMonitor(SDR_URL, SDR_PORT, modeResult);

    res.setHeader('Content-Type', 'audio/mpeg');

    responseStream.pipe(res);
  } catch (error) {
    console.error('Error occurred while getting channel:', error);
    res.status(500).send({
      code: 500,
      message: 'Error occurred while getting channel',
      error: error.message,
    });
  }
});

/**
 * API for monitoring frequencies
 *
 * /monitor-channels/{frequency}
 */
app.get('/monitor-channels/:frequency', async (req, res) => {
  const frequency = req.params.frequency;

  try {
    await stopMonitor(SDR_URL, SDR_PORT);
    const responseStream = await startMonitor(SDR_URL, SDR_PORT, frequency);

    res.setHeader('Content-Type', 'audio/mpeg');

    responseStream.pipe(res);
  } catch (error) {
    console.error('Error occurred while getting channel:', error);
    res.status(500).send({
      code: 500,
      message: 'Error occurred while getting channel',
      error: error.message,
    });
  }
});



/**
 * API for stop monitor channels
 *
 * /monitor-channels/stop
 */
app.get('/monitor-channels/stop', async (req, res) => {
  try{
    const response = await stopMonitor(SDR_URL, SDR_PORT);

    res.send(response);
  }
  catch(error){
    res.status(500).send({
      code: 500,
      message: "Error occurred stopping channel",
      error: error.message,
    })
  }
})

app.get('/active-channels', async (req, res) => {
  try{
    let returnVal = {}
    returnVal["active"] = await getAliveChannels();
    returnVal["busy"] = await getBusyChannels();
    returnVal["offline"] = await getOfflineChannels();
    res.send(returnVal)
  }
  catch(error){
    res.status(500).send({
      code: 500,
      message: "Error occurred while getting channels",
      error: error.message,
    })
  }
});

app.get('/analytics/data', async (req, res) => {
  const sendObj = req.query;
  let requestObj = {}
  for (const elem in sendObj) {
    requestObj[elem] = sendObj[elem].includes("[")?JSON.parse(sendObj[elem]):parseInt(sendObj[elem]);
  }
  try{
    const strengthData = await getChannelStrength(requestObj)
    const utilisationData = await getChannelUtilisation(requestObj)
    let returnVal = {}
    for (const key in strengthData) {
      returnVal[key] = {}
      returnVal[key]["strength"] = strengthData[key]
    }
    for (const key in utilisationData) {
      if (!(key in returnVal)) {
        returnVal[key] = {}
      }
      returnVal[key]["utilisation"] = utilisationData[key]
    }
    res.send(returnVal)
  }
  catch(error){
    res.status(500).send({
      code: 500,
      message: "Error occurred while getting channels",
      error: error.message,
    })
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'backend_index.html'));
});

app.post('/data', async (req, res) => {
  try{
    const response = await processIncomingData(req.body, "mydb");

    if (response){
      res.status(200).send({
        message: "Data successfully processed",
        data: response,
      });
    }
  }
  catch(error){
    res.status(500).send({
      message: "Error occurred while processing data",
      error: error.message,
    })
  }
});

app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
});

