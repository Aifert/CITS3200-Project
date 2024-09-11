import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.SDR_PORT || 5000;
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
    try{
        console.log(`${SDR_URL}:5002/stop`);
        const response = await axios.get(`${SDR_URL}:5002/stop`, {
            responseType: 'text',
            headers: {
                'Accept': 'text/plain'
            }
        });


        console.log(response)
    }
    catch(error){
        console.log(error);
    }
})

app.get('/monitor/:id', async (req, res) => {
    const frequencyId = req.params.id;

    console.log(frequencyId);

    res.send("hi bozo");
})

app.listen(PORT, () => {
    console.log(`SDR server successfully started on port ${PORT}`)
})
