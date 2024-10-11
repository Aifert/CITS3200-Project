const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const crypto = require('crypto');
const { TbRulerOff } = require('react-icons/tb');

let client = new Client({
    user: process.env.DB_USER || 'user',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'mydb',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

function generateApiKey() {
    const bytes = crypto.randomBytes(32);
    const apiKey = bytes.toString('base64')
        .replace(/\+/g, '')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    return apiKey;
}


async function saveApiKey(userName) {
  try {
    const filteredUserName = userName.split("-")[0];
    const apiKey = generateApiKey();
    const saltRounds = 10;
    const hashedApiKey = await bcrypt.hash(apiKey, saltRounds);

    try{
        await client.connect();
    }
    catch(error){}

    await client.query('INSERT INTO pi_api (username, api_key1) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET api_key1 = $2', [filteredUserName, hashedApiKey]);

    return { success: true, apiKey: apiKey };
  } catch (error) {
    console.error('Error saving API key:', error);
    return { success: false, message: 'Failed to save API key' };
  }
}

async function compareApiKey(apiKey){
    // try{
    //     const [userName, filteredApiKey] = apiKey.split("-");
    //     try{
    //         await client.connect();
    //     }
    //     catch(error){}

    //     const result = await client.query('SELECT api_key1 FROM pi_api WHERE username = $1', [userName]);

    //     if(result.rows.length === 0){
    //         return { success: false, message: 'User not found' };
    //     }

    //     const hashedApiKey = result.rows[0].api_key1;

    //     const isMatch = await bcrypt.compare(filteredApiKey, hashedApiKey);
    //     return isMatch;

    // }
    // catch(error){
    //     console.error('Error comparing API key:', error);
    //     return { success: false, message: 'Failed to compare API key' };
    // }
    return true;
}

module.exports = {
    saveApiKey,
    compareApiKey
}
