import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import axios from 'axios'

import { fileURLToPath } from 'url';
import { getAliveChannels, getOfflineChannels, getBusyChannels} from "./model_utils.js";

const SDR_URL = "http://host.docker.internal"
// const SDR_URL = "http://0.0.0.0"

const app = express();
const PORT = process.env.PORT || 9000;
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

app.get('/test', async (req, res) => {
  axios.get(`${SDR_URL}:5002/stop`, { insecureHTTPParser: true }).then((response) => {
    res.send(response.data);
  })
});

app.get('/monitor-channels', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'monitor.html'))
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
