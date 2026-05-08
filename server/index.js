import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Pool } = pkg;

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'mac',
  host: 'localhost',
  database: 'orders_db',
  password: '',
  port: 5432,
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API works');
});

app.get('/api/order/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE order_code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.json({
        status: 'Нет информации',
        ready_packages: 0,
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});