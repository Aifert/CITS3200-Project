import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { exec } from 'child_process';

const app = express();
const PORT = process.env.PORT || 6000;

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

const secret = process.env.WEBHOOK_API_KEY;

function verifySignature(req, res, buf) {
    const signature = `sha1=${crypto
        .createHmac('sha1', secret)
        .update(buf)
        .digest('hex')}`;

    if (req.headers['x-hub-signature'] !== signature) {
        return res.status(401).send('Invalid signature.');
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/webhook_handler', (req, res) => {
    verifySignature(req, res, req.rawBody);

    const payload = req.body;
    const url = `https://${process.env.GITHUB_USERNAME}:${process.env.GITHUB_API_KEY}@github.com/${process.env.GITHUB_REPO}.git`;

    if (payload.ref === 'refs/heads/main') {
        const commands = `
            ssh -i ./.secret.pem azureuser@20.213.23.98 <<EOF
            cd .
            git pull origin main
            DOCKER_BUILDKIT=1 docker-compose down
            DOCKER_BUILDKIT=1 docker-compose up --build -d
            EOF
        `;

        exec(commands, { cwd: '/app', shell: '/bin/bash' }, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error during deployment: ${err.message}`);
                return res.status(500).send('Failed to update and deploy repository.');
            }
            console.log(stdout);
            if (stderr) {
                console.error(`Deployment Errors: ${stderr}`);
            }
            return res.status(200).send('Deployment successful.');
        });
    } else {
        return res.status(200).send('Not main branch, no deployment required.');
    }
});

app.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
});
