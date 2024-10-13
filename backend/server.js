const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { decode } = require('next-auth/jwt');
const cookieParser = require('cookie-parser');
const https = require('https');
const { PassThrough } = require('stream');

const {
  startMonitorMP3,
  stopMonitor,
  decideMonitorMode,
  startMonitorRadio,
} = require('./monitor_server.js');

const {
  getAliveChannels,
  getOfflineChannels,
  getBusyChannels,
  getChannelStrength,
  getChannelUtilisation,
  processIncomingData,
  generateStrengthDataDump,
  generateUtilDataDump,
  checkNotificationState,
  getAddressFromChannelId,
  isValidStream,
  resetStream,
  getDeviceStream,
  getStreamChannelFromDevice,
} = require('./model_utils.js');

const {
  saveApiKey,
  compareApiKey,
} = require('./auth_utils.js');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));
const PORT = process.env.PORT || 9000;
const SDR_URL =/* process.env.NEXT_PUBLIC_SDR_URL ||*/ "http://192.168.1.103:4001/";
const PUBLIC_FRONTEND_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000/';

let responseStreams = {};

let is_populating = false;

// CORS middleware
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,  // Allow credentials such as cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(cookieParser());

const allowedOrigins = [PUBLIC_FRONTEND_URL];

const verifyToken = async (req, res, next) => {
  // If no token in Authorization header, fall back to cookie
  const token = req.cookies['__Secure-next-auth.session-token'] || req.cookies['next-auth.session-token'];

  // Set CORS headers for all responses
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  if (token) {
    try {
      const secret = process.env.NEXTAUTH_SECRET;
      const decoded = await decode({ token, secret });
      if (decoded) {
        req.user = decoded;
        next();
      } else {
        throw new Error('Failed to decode token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Your session has expired or is invalid. Please log in again.',
        code: 'INVALID_TOKEN'
      });
    }
  } else {
    const requestedUrl = req.originalUrl;
    return res.redirect(`${PUBLIC_FRONTEND_URL}/login?requestedUrl=${encodeURIComponent(requestedUrl)}&port=${PORT}`);
  }
};

app.use('/api_v2', verifyToken);

async function singlePopulate() {
    const nowTime = Math.floor(new Date().getTime()/1000);
    let testObj1 = {
      "soc-id": 16707,
      "address": "127.10.20.30:8980",
      "data": {
        467687500: {
          "usage": Math.random() > 0.7 ? [[nowTime-5, "true"], [nowTime, "false"]] : [],
          "strength": {
          },
          "channel-name": "Fremantle",
        },
        457712500: {
          "usage": Math.random() > 0.7 ? [[nowTime-5, "true"], [nowTime, "false"]] : [],
          "strength": {
          },
          "channel-name": "Marble Bar",
        }
      }
    }
    testObj1.data[467687500].strength[nowTime] = Math.random() * 50.0 - 112.5;
    testObj1.data[457712500].strength[nowTime] = Math.random() * 50.0 - 112.5;
    await processIncomingData(testObj1, "mydb");
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
app.get('/api_v2/monitor-channels', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'monitor.html'));
})

app.post('/api_v2/generate_api_key', async (req, res) => {
  const userName = req.headers.authorization;

  if (userName) {
    const saveResponse = await saveApiKey(userName.toLowerCase());

    if (saveResponse.success) {
      res.status(200).send({ message: 'API key generated successfully', apiKey: saveResponse.apiKey });
    }
    else {
      res.status(500).send({ message: 'Failed to generate API key' });
    }

  }
  else {
    res.status(400).send({ message: 'User name is required' });
  }
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

app.get('/api_v2/monitor-channels/start', async (req, res) => {

  const cId = req.query['id'] || '';
  if (!(await isValidStream("mydb", cId))) {
     res.status(204).send({
        message: 'Channel is busy',
      });
     return;
  }
  const remFromList = async (req, cId) => {
    console.log("REMOVED")
    const idx = responseStreams[cId].indexOf(res);
    if (idx !== -1) {
      responseStreams[cId].splice(idx, 1)
    } else {
      console.log("oops -1")
    }
    console.log(responseStreams[cId].length);
    if (responseStreams[cId].length=== 0) {
      console.log("RESET")
      await resetStream("mydb", cId);
    }
  }
  res.on("close", async function() {
    console.log("close");
    await remFromList(res, cId);
  });

  res.on("error", async function() {
    console.log("error")
    await remFromList(res, cId);
  });

  try {
      if (!(cId in responseStreams)) {
        responseStreams[cId] = []
      }
      responseStreams[cId].push(res);
      console.log("added")
      res.setHeader('Content-Type', 'audio/mpeg');

  } catch (error) {
    console.error('Error occurred while getting channel:', error);
    if (!res.headersSent) {
      res.status(500).send({
        message: 'Error occurred while getting channel',
        error: error.message,
      });
    }
  }
});


app.get('/api_v2/active-channels', async (req, res) => {
  try{
    console.log('getting active channels')
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

app.get('/api_v2/analytics/data', async (req, res) => {
  const sendObj = req.query;
  let requestObj = {}
  for (const elem in sendObj) {
    requestObj[elem] = sendObj[elem].includes("[")?JSON.parse(sendObj[elem]):(isNaN(sendObj[elem])?sendObj[elem]:parseInt(sendObj[elem]));
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
    console.log("SENT analytics")
  }
  catch(error){
    res.status(500).send({
      code: 500,
      message: "Error occurred while getting channels",
      error: error.message,
    })
  }
});

app.get('/api_v2/notification', async (req, res) => {
  const sendObj = req.query;
  let requestObj = {}
  for (const elem in sendObj) {
    requestObj[elem] = sendObj[elem].includes("[")?JSON.parse(sendObj[elem]):(isNaN(sendObj[elem])?sendObj[elem]:parseInt(sendObj[elem]));
  }
  res.send(await checkNotificationState(requestObj, "mydb"));
});

//http://localhost:9000/api_v2/notification?1=[-100, 5, 600]
app.get('/api_v2/analytics/strength-dump', async (req, res) => {
  const sendObj = req.query;
  let requestObj = {}
  for (const elem in sendObj) {
    requestObj[elem] = sendObj[elem].includes("[")?JSON.parse(sendObj[elem]):parseInt(sendObj[elem]);
  }
  const myFile = await generateStrengthDataDump(requestObj, "mydb");
  const nowTime = Math.floor(new Date().getTime()/1000);
  res.attachment(`strength-data-${nowTime}.csv`).send(myFile);
});

app.get('/api_v2/analytics/util-dump', async (req, res) => {
  const sendObj = req.query;
  let requestObj = {}
  for (const elem in sendObj) {
    requestObj[elem] = sendObj[elem].includes("[")?JSON.parse(sendObj[elem]):parseInt(sendObj[elem]);
  }
  const myFile = await generateUtilDataDump(requestObj, "mydb");
  const nowTIme = Math.floor(new Date().getTime()/1000);
  res.attachment(`util-data-${nowTime}.csv`).send(myFile);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'backend_index.html'));
});

app.get('/sdr/tune', async (req, res) => {
  const apiKey = req.headers.authorization.split(' ')[1];
  const deviceId = parseInt(req.headers["device-id"]);
  const compareResponse = true;//await compareApiKey(apiKey);

  if (compareResponse == true) {
    try{
        const myFreq = await getDeviceStream("mydb", deviceId);
        if (myFreq == 0) {
          res.status(200).send({
          message: "Nothing To Stream",
          });
        } else {
        res.status(200).send({
          message: "New Stream",
          data: {freq: myFreq},
        });
      }
    } catch(error){
      res.status(500).send({
        message: "Error occurred while processing data",
        error: error.message,
      });
    }
  } else {
    res.status(403).send({
      message: "Invalid API Key"
    });
  }
});

app.post('/sdr/pipe_stream', async (req, res) => {
  const apiKey = req.headers.authorization.split(' ')[1];
  const deviceId = parseInt(req.headers["device-id"]);
  const compareResponse = true;//await compareApiKey(apiKey);
  let c_id = await getStreamChannelFromDevice("mydb", deviceId);
  if (compareResponse == true) {
    try{
      const newFrame = req.body;
      if (c_id in responseStreams) {
        for (let audioS = 0; audioS < responseStreams[c_id].length; ++audioS) {
          responseStreams[c_id][audioS].write(newFrame);
        }
      }

        res.status(200).send({
          message: "Data successfully processed",
          data: response,
        });
    }
    catch(error){
      res.status(500).send({
        message: "Error occurred while processing data",
        error: error.message,
      })
    }
  }
  else{
    res.status(403).send({
      message: "Invalid API key",
    })
  }
});

app.post('/sdr/upload_data', async (req, res) => {
  const apiKey = req.headers.authorization.split(' ')[1];

  const compareResponse = await compareApiKey(apiKey);

  if (compareResponse == true) {
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
  }
  else{
    res.status(403).send({
      message: "Invalid API key",
    })
  }
});

app.get('/api_v2/testdata', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'backend_index.html'));
  await populateTestData();
});


app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server successfully started on port ${PORT}`);
});

