const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.SDR_PORT || 4000;
const SDR_URL = "http://host.docker.internal"

app.use(express.json());
app.use(cors());

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

app.get('/monitor/:params', async (req, res) => {
    const params = req.params.params;

    // Fetch the stream from the SDR server
    try {
        const sdrResponse = await axios.get(`${SDR_URL}:5002/${params}`,{
            responseType: 'stream',
            insecureHTTPParser: true
        });

        res.setHeader('Content-Type', 'audio/mpeg');

        sdrResponse.data.pipe(res);
    } catch (error) {
        console.error('Error fetching SDR stream:', error);
        res.status(500).send('Error fetching the stream.');
    }
});

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sdr_index.html'));
})

app.listen(PORT, () => {
    console.log(`SDR server successfully started on port ${PORT}`)
})
