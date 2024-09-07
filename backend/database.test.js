//import pg from 'pg' //pg is PostgreSQL//
const { Client } = require('pg');

const testclient = new Client({
  user: 'user',
  host: 'db',
  database: 'testdb',
  password: 'password',
  port: 5432,
});

test("Connect to Server", async () => {
  await testclient.connect();
})

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

  const transact = await testclient.query("START TRANSACTION");
  expect(transact.command).toBe("START");

  await testclient.query('INSERT INTO "Strength" (s_id, c_id, s_sample_time, s_strength) VALUES (3220, 3, 1725547187, -95.73695105828416)');
  const final = await testclient.query("SELECT s_id FROM \"Strength\"");
  const finalLen = final.rows.length
  expect(finalLen-initialLen).toBe(1);

  const roll = await testclient.query("ROLLBACK");
  expect(roll.command).toBe("ROLLBACK");

  const reset = await testclient.query("SELECT s_id FROM \"Strength\"");
  expect(reset.rows.length).toBe(initialLen);

})

test("Disconnect from Server", async () => {
  await testclient.end();
})