const express = require('express');
const { exec } = require('child_process');
const axios = require('axios'); // Add axios for sending webhooks
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = 8001;

// Middleware to parse JSON bodies
app.use(express.json());

async function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const offsetMinutes = now.getTimezoneOffset();

  // Calculate the offset in hours and convert it to a string
  const offsetHours = Math.abs(offsetMinutes / 60);
  const offsetSign = offsetMinutes < 0 ? '+' : '-';
  const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${Math.abs(offsetMinutes % 60).toString().padStart(2, '0')}`;

  // Build the formatted time string including the offset
  const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000${offsetString}`;

  return formattedTime;
}

// Function to check running Docker containers
function checkContainers() {
  return new Promise((resolve, reject) => {
    exec('sudo docker ps --format "{{.Names}}"', (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      const runningContainers = stdout.trim().split('\n').filter(Boolean);
      // Replace with the expected container names
      const expectedContainers = ['cits3200-project_sdr_1', 'cits3200-project_web_1', 'cits3200-project_frontend_1', 'cits3200-project_db_1'];
      const missingContainers = expectedContainers.filter(c => !runningContainers.includes(c));

      if (missingContainers.length > 0) {
        return reject(new Error(`Missing containers: ${missingContainers.join(', ')}`));
      }
      resolve();
    });
  });
}

// Webhook endpoint
app.post('/webhook_handler', async (req, res) => {
  console.log('Received deployment request:', req.body);

  const currentTime = await getCurrentTime();

  const branch = req.body.ref ? req.body.ref.split('/').pop() : 'unknown'; // Capture branch, default to 'unknown' if not available

  try {
    await axios.post(process.env.DISCORD_WEBHOOK, {
      "content": null,
      "embeds": [
        {
          "title": "Deployment Request",
          "description": `A deployment request has been made for ${branch}`,
          "color": 2894892,
          "fields": [
            {
              "name": "Branch",
              "value": branch
            }
          ],
          "footer": {
            "text": "Made by Aifert"
          },
          "timestamp": currentTime
        }
      ],
      "attachments": []
    });
    console.log('Webhook sent successfully.');
  } catch (webhookErr) {
    console.error('Failed to send webhook:', webhookErr.message);
  }

  const gitAuthURL = `https://${process.env.GITHUB_USERNAME}:${process.env.GITHUB_SECRET}@github.com/${process.env.GITHUB_REPO}.git`;

  const deployScript = `
    cd ${process.env.PROJECT_DIR}  // Use environment variable for project directory
    git pull ${gitAuthURL} ${branch}

    if git diff --name-only HEAD~1 HEAD | grep -q "^backend/"; then
      echo "Changes detected in backend, rebuilding backend service."
      DOCKER_BUILDKIT=1 sudo docker-compose build web
      DOCKER_BUILDKIT=1 sudo docker-compose up -d web

      DOCKER_BUILDKIT=1 sudo docker-compose build sdr
      DOCKER_BUILDKIT=1 sudo docker-compose up -d sdr
    fi

    if git diff --name-only HEAD~1 HEAD | grep -q "^webserver/"; then
      echo "Changes detected in webserver, rebuilding webserver service."
      DOCKER_BUILDKIT=1 sudo docker-compose build db
      DOCKER_BUILDKIT=1 sudo docker-compose up -d db
    fi

    if git diff --name-only HEAD~1 HEAD | grep -q "^frontend/"; then
      echo "Changes detected in frontend, rebuilding frontend service."
      DOCKER_BUILDKIT=1 sudo docker-compose build frontend
      DOCKER_BUILDKIT=1 sudo docker-compose up -d frontend
    fi

    if [ -n "$(sudo docker ps -q)" ]; then
      echo "Docker containers are running."
    else
      echo "No running Docker containers. Starting all services."
      DOCKER_BUILDKIT=1 sudo docker-compose up -d
    fi
  `;

  exec(deployScript, async (err, stdout, stderr) => {
    if (err) {
      console.error(`Deployment error: ${err.message}`);
      try {
        await axios.post(process.env.DISCORD_WEBHOOK, {
          "content": null,
          "embeds": [
            {
              "title": "Deployment Failed",
              "description": `Deployment Failure on ${branch}`,
              "color": 16719390,
              "fields": [
                {
                  "name": "Error:",
                  "value": err.message,
                },
                {
                  "name": "Branch",
                  "value": branch
                }
              ],
              "footer": {
                "text": "Made by Aifert"
              },
              "timestamp": currentTime
            }
          ],
          "attachments": []
        });
      } catch (webhookErr) {
        console.error('Failed to send webhook:', webhookErr.message);
      }
      return res.status(500).send('Deployment failed.');
    }

    try {
      await checkContainers();
      await axios.post(process.env.DISCORD_WEBHOOK, {
        "content": null,
        "embeds": [
          {
            "title": "Deployment Successful",
            "description": `Deployment succeeded for ${branch}`,
            "color": 5826109,
            "fields": [
              {
                "name": "Branch",
                "value": branch,
              }
            ],
            "footer": {
              "text": "Made by Aifert"
            },
            "timestamp": currentTime
          }
        ],
        "attachments": []
      });
      console.log('Webhook sent successfully.');
    } catch (checkErr) {
      console.error('Failed to check containers:', checkErr.message);
      await axios.post(process.env.DISCORD_WEBHOOK, {
        "content": null,
        "embeds": [
          {
            "title": "Deployment Partially Successful",
            "description": `Deployment succeeded but some containers failed for ${branch}`,
            "color": 16719390,
            "fields": [
              {
                "name": "Error:",
                "value": checkErr.message,
              },
              {
                "name": "Branch",
                "value": branch
              }
            ],
            "footer": {
              "text": "Made by Aifert"
            },
            "timestamp": currentTime
          }
        ],
        "attachments": []
      });
    }

    res.status(200).send('Deployment process completed.');
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Deployment server listening on port ${PORT}`);
});
