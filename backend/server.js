import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import axios from 'axios'

import { fileURLToPath } from 'url';
import { getAliveChannels, getOfflineChannels, getBusyChannels} from "./model_utils.js";
import { startMonitor, stopMonitor } from './monitor_server.js';

const PORT = process.env.PORT || 9000;

const FRONTEND_URL = "http://frontend"
const FRONTEND_PORT = 3000;
const SDR_URL = "http://sdr"
const SDR_PORT = 5000;

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 */
app.get('/monitor-channels', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'monitor.html'))
})

/**
 * API for starting monitor channels
 *
 * /monitor-channels/{frequency}
 */
app.get('/monitor-channels/:frequency', async (req, res) => {
  const frequency = req.params.frequency;

  try{
    const response = await getChannel(SDR_URL, SDR_PORT, frequency);

    res.send(response);
  }
  catch(error){
    res.status(500).send({
      code: 500,
      message: "Error occurred while getting channel",
      error: error.message,
    })
  }
})

/**
 * API for stop monitor channels
 *
 * /monitor-channels/stop
 */
app.get('/monitor-channels/stop', async (req, res) => {
  try{
    const response = await stopChannel(SDR_URL, SDR_PORT);

    res.send(response);
  }
  catch(error){
    res.status(500).send({
      code: 500,
      message: "Error occurred while getting channel",
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
  }});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
});
