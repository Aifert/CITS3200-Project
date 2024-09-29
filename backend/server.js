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
  processIncomingData,
  generateStrengthDataDump,
  generateUtilDataDump
} = require('./model_utils.js');

const app = express();
const PORT = process.env.PORT || 9000;
const FRONTEND_URL = "http://frontend"
const FRONTEND_PORT = 3000;
const SDR_URL = "http://sdr"
const SDR_PORT = 4000;

let is_populating = false;


dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function singlePopulate() {
    const nowTime = Math.floor(new Date().getTime()/1000);
    let testObj1 = {
      "soc-id": 1,
      "address": "127.10.20.30:8980",
      "data": {
        467687500: {
          "usage": Math.random() > 0.7 ? [[nowTime-5, nowTime]] : [],
          "strength": {
          }
        },
        457712500: {
          "usage": Math.random() > 0.7 ? [[nowTime-5, nowTime]] : [],
          "strength": {
          }
        }
      }
    }
    testObj1.data[467687500].strength[nowTime] = Math.random() * 50.0 - 112.5;
    testObj1.data[457712500].strength[nowTime] = Math.random() * 50.0 - 112.5;
    await processIncomingData(testObj1, "testdbmu");
}

async function populateTestData() {
  if (!is_populating){
    is_populating = true;
    while(true) {
      await singlePopulate();
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}


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
app.get('/api/monitor-channels', async (req, res) => {
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
app.get('/api/monitor-channels/start', async (req, res) => {
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
app.get('/api/monitor-channels/:frequency', async (req, res) => {
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
app.get('/api/monitor-channels/stop', async (req, res) => {
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

app.get('/api/active-channels', async (req, res) => {
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

app.get('/api/analytics/data', async (req, res) => {
  if (!is_populating) {
    await singlePopulate();
  }
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

app.get('/api/strength-dump', async (req, res) => {
  const sendObj = req.query;
  let requestObj = {}
  for (const elem in sendObj) {
    requestObj[elem] = sendObj[elem].includes("[")?JSON.parse(sendObj[elem]):parseInt(sendObj[elem]);
  }
  const myFile = await generateStrengthDataDump(requestObj, "testdbmu");
  res.attachment("strength-data.csv").send(myFile);
});

app.get('/api/util-dump', async (req, res) => {
  const sendObj = req.query;
  let requestObj = {}
  for (const elem in sendObj) {
    requestObj[elem] = sendObj[elem].includes("[")?JSON.parse(sendObj[elem]):parseInt(sendObj[elem]);
  }
  const myFile = await generateUtilDataDump(requestObj, "testdbmu");
  res.attachment("util-data.csv").send(myFile);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'backend_index.html'));
});

app.post('/api/data', async (req, res) => {
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

app.get('/testdata', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'backend_index.html'));
  await populateTestData();
});


app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
});

