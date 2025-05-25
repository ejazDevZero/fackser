const WebSocket = require('ws');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const server = http.createServer();
const wss = new WebSocket.Server({ server });
const ENDPOINT_URL = 'https://fackles.ir/api/GetChat.php';

const clients = new Map(); // client => { guid, auth, interval }

wss.on('connection', function connection(ws) {
  const clientId = uuidv4();
  console.log(Client connected: ${clientId});

  ws.once('message', function incoming(message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
      ws.close();
      return;
    }

    const { guid, auth } = data;

    if (!guid || !auth) {
      ws.send(JSON.stringify({ error: 'Missing guid or auth' }));
      ws.close();
      return;
    }

    clients.set(ws, { guid, auth });

    const interval = setInterval(async () => {
      try {
        const response = await axios.post(ENDPOINT_URL, { guid, auth });
        ws.send(JSON.stringify({ response: response.data }));
      } catch (err) {
        ws.send(JSON.stringify({ error: 'Request failed', details: err.message }));
      }
    }, 1000);

    clients.get(ws).interval = interval;
  });

  ws.on('close', () => {
    console.log(Client disconnected: ${clientId});
    const client = clients.get(ws);
    if (client?.interval) clearInterval(client.interval);
    clients.delete(ws);
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
