const express = require('express');
const axios = require('axios');
const cors = require('cors');

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// =====================
// Create video room
// =====================
app.post('/api/create-room', async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId é obrigatório' });
    }

    const roomName = `consulta-${appointmentId}`;

    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        name: roomName,
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.json({
      roomUrl: response.data.url,
    });

  } catch (error) {
    console.error('Erro ao criar sala Daily:', error?.response?.data || error);
    return res.status(500).json({ error: 'Erro ao criar sala Daily' });
  }
});

// =====================
// Start server
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
