//import pg from 'pg' //pg is PostgreSQL//
const { Client } = require('pg');
const fs = require('fs');

const initclient = new Client({
  user: 'user',
  host: 'db',
  database: 'mydb',
  password: 'password',
  port: 5432,
});

const testclient = new Client({
  user: 'user',
  host: 'db',
  database: 'testdb',
  password: 'password',
  port: 5432,
});

test("Connect to Init Server", async () => {
  await initclient.connect();
  const creation = await initclient.query("CREATE DATABASE testdb");
  expect(creation.command).toBe("CREATE");
});

test("Connect to Test Server", async () => {
  await testclient.connect();
  const initQuery = fs.readFileSync("./webserver/database/init.sql");
  const initResponse = await testclient.query(initQuery.toString());
  expect(initResponse.length).toBeGreaterThan(1);
  const populateQuery = fs.readFileSync("./webserver/database/testpopulate.sql");
  const populateResponse = await testclient.query(populateQuery.toString());
  expect(populateResponse.length).toBeGreaterThan(1);
});

test("Simple Select", async () => {
  const output = await testclient.query('SELECT * FROM "Channels"')
  expect(output.rows.length).toBeGreaterThan(1);
})

test("Simple Join", async () => {
  const output = await testclient.query("SELECT * FROM \"Channels\" AS c JOIN \"Devices\" AS d ON d.d_id = c.d_id");
  expect(output.rows.length).toBeGreaterThan(1);
})

test("Simple Insertion", async () => {
  const initial = await testclient.query("SELECT s_id FROM \"Strength\"");
  expect(initial.rows.length).toBeGreaterThan(0);
  const initialLen = initial.rows.length


  await testclient.query('INSERT INTO "Strength" (s_id, c_id, s_sample_time, s_strength) VALUES (3220, 3, 1725547187, -95.73695105828416)');
  const final = await testclient.query("SELECT s_id FROM \"Strength\"");
  const finalLen = final.rows.length
  expect(finalLen-initialLen).toBe(1);

})

test("Disconnect from Server", async () => {
  await testclient.end();
  const drop = await initclient.query("DROP DATABASE testdb");
  expect(drop.command).toBe("DROP");
  await initclient.end();
})