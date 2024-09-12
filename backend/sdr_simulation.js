import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';

import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.SDR_PORT || 4000;
const SDR_URL = "http://host.docker.internal"

app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.post("/sdr", (req, res) => {
    const data = req.body;
    const now = new Date();
    const timestamp = now.toISOString();

    res.json({
        timestamp,
        data
    });
})

app.get('/stop', async (req, res) => {
    axios.get(`${SDR_URL}:5002/stop`, { insecureHTTPParser: true }).then((response) => {
        res.send(response.data);
    })
})

app.get('/monitor/:frequency', async (req, res) => {
    const frequency = req.params.frequency;

    axios.get(`${SDR_URL}:5002/${frequency}`, { insecureHTTPParser: true }).then((response) => {
        res.send(response.data);
    })
})

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sdr_index.html'));
})

app.listen(PORT, () => {
    console.log(`SDR server successfully started on port ${PORT}`)
})
