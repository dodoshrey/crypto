import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors());

app.get('/api/coins', async (req, res) => {
  try {
    const response = await axios.get(
      'https://min-api.cryptocompare.com/data/top/mktcapfull?limit=50&tsym=USD',
      { headers: { accept: 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});