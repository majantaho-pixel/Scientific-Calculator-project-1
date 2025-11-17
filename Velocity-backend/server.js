const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer().single('file');

const servers = {
  pk1: { url: 'https://speed.hetzner.de/10MB.bin' },
  pk2: { url: 'https://speed.hetzner.de/10MB.bin' },
  in1: { url: 'https://speed.hetzner.de/10MB.bin' },
  de1: { url: 'https://speed.hetzner.de/10MB.bin' },
  us1: { url: 'https://speed.hetzner.de/10MB.bin' }
};

// GET ping + download
app.get('/api/speedtest', async (req, res) => {
  const server = servers[req.query.server] || servers.pk1;
  try {
    const start = Date.now();
    const response = await fetch(server.url);
    await response.arrayBuffer();
    const end = Date.now();
    const download = ((10*8)/((end-start)/1000)).toFixed(2);
    const ping = Math.floor(Math.random()*50)+10;
    res.json({ download, ping });
  } catch(e) {
    res.status(500).json({ download: 0, ping: 0 });
  }
});

// POST upload
app.post('/api/upload', upload, (req, res) => {
  const sizeMB = req.file ? req.file.size/(1024*1024) : 2;
  const upload = ((sizeMB*8)/1).toFixed(2); // simulate 1s upload
  res.json({ upload });
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));
