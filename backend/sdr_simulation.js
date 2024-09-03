import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.SDR_PORT || 5000;

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

app.listen(PORT, () => {
    console.log(`SDR server successfully started on port ${PORT}`)
})
