const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.connect().then(() => console.log("Connected to DB")).catch(err => console.error("Database Error:", err));

// User Authentication
app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', [name, email, hashedPassword, role]);
  res.json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (user.rows.length === 0) return res.status(400).json({ error: 'User not found' });
  const validPassword = await bcrypt.compare(password, user.rows[0].password);
  if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
  const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET);
  res.json({ token });
});

// Lecture CRUD APIs
app.post('/api/lectures', async (req, res) => {
  const { title, date, lecturer_id } = req.body;
  await pool.query('INSERT INTO lectures (title, date, lecturer_id) VALUES ($1, $2, $3)', [title, date, lecturer_id]);
  res.json({ message: 'Lecture added successfully' });
});

app.get('/api/lectures', async (req, res) => {
  const lectures = await pool.query('SELECT * FROM lectures');
  res.json(lectures.rows);
});

// WhatsApp Cloud API Notification
app.post('/api/send-notification', async (req, res) => {
  const { phone, message } = req.body;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: message // ✅ Correctly formatted body inside text object
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    res.json({ success: true, response: response.data });
  } catch (error) {
    console.error("Error sending notification:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to send notification", details: error.response?.data || error.message });
  }
});

// Automated Notifications (Cron Job at 9 AM daily)
cron.schedule('0 9 * * *', async () => {
  console.log('Sending automated lecture reminders...');
});

// Start Server
app.listen(5000, () => console.log('Backend running on port 5000'));