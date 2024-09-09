import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg'; // PostgreSQL client
import { getAliveChannels, getOfflineChannels, getBusyChannels} from "./model.js";

const app = express();
const PORT = process.env.PORT || 9000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

app.use(cors());

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/active-channels', async (req, res) => {
  let returnVal = {}
  returnVal["code"] = 200
  returnVal["active"] = await getAliveChannels();
  returnVal["busy"] = await getBusyChannels();
  returnVal["offline"] = await getOfflineChannels();
  res.send(returnVal)
});

app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
});
