import pg from 'pg' //pg is PostgreSQL
const { Client } = pg;

const ALIVETIME = 15;

let isConnecting = false;
let isConnected = false;

let client = new Client({
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'testdb',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });


async function connectToDatabase() {
  const maxRetries = 10;
  let retries = 0;
  isConnecting = true;

  while (retries < maxRetries) {
    try {
      client = new Client({
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'testdb',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });

      console.log('Attempting to connect to the database...');
      await client.connect();
      console.log('Connected to the database');
      isConnected = true;
      break;
    } catch (err) {
      retries++;
      console.error(`Failed to connect to the database. Retry ${retries}/${maxRetries}.`, err);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  isConnecting = false;
  if (retries === maxRetries) {
    console.error('Could not connect to the database after multiple attempts. Exiting...');
    process.exit(1);
  }
}

async function recheckConnection() {
  if (!isConnected && !isConnecting) {
    await connectToDatabase();
  }
}

async function getAliveChannels() {
  await recheckConnection();
  //Might determine a better method in future but
  //Currently "alive" channels are any channels which have recieved data in the last 15 seconds
  //(From Strength Table because that should constantly be pinged)
  //AND they are not on a device where streaming is currently happening
  //(Unless they are the channel being streamed)
  const query = `SELECT DISTINCT st.c_id FROM "Strength" AS st INNER JOIN "Channels" AS ch ON st.c_id = ch.c_id 
                WHERE st.s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME} AND 
                ((d_id NOT IN (SELECT d_id FROM "Channels" AS c INNER JOIN "Session_Listeners" AS sl ON c.c_id = sl.c_id)) 
                OR (st.c_id IN (SELECT c_id FROM "Session_Listeners")))`;
  
  let res = await client.query(query);
  res.rows = res.rows.map((elem) => elem["c_id"]);
  return res.rows;
}

async function getBusyChannels() {
  await recheckConnection();
  //Might determine a better method in future but
  //Currently "busy" channels are any channels which have recieved data in the last 15 seconds
  //(From Strength Table because that should constantly be pinged)
  //AND they are on a device where streaming is currently happening
  //(and they are not the channel being streamed)
  const query = `SELECT DISTINCT st.c_id FROM "Strength" AS st INNER JOIN "Channels" AS ch ON st.c_id = ch.c_id 
                WHERE st.s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME} AND 
                ((d_id IN (SELECT d_id FROM "Channels" AS c INNER JOIN "Session_Listeners" AS sl ON c.c_id = sl.c_id)) 
                AND NOT (st.c_id IN (SELECT c_id FROM "Session_Listeners")))`;
  
  let res = await client.query(query);
  res.rows = res.rows.map((elem) => elem["c_id"]);
  return res.rows;
}

async function getOfflineChannels() {
  await recheckConnection();
  //Might determine a better method in future but
  //Currently "offline" channels are any channels which have not recieved data in the last 15 seconds
  const query = `SELECT DISTINCT c_id FROM "Channels" 
                WHERE c_id NOT IN (SELECT c_id FROM "Strength" 
                WHERE st.s_sample_time > ${Math.floor(new Date().getTime()/1000) - ALIVETIME})`;
  
  let res = await client.query(query);
  res.rows = res.rows.map((elem) => elem["c_id"]);
  return res.rows;
}


module.exports = {
  getAliveChannels: getAliveChannels,
  getBusyChannels: getBusyChannels,
  getOfflineChannels: getOfflineChannels
}