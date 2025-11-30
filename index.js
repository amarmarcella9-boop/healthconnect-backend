const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const DAILY_API_BASE = 'https://api.daily.co/v1';

// Garante que SEMPRE teremos uma URL de sala Daily para um appointmentId
// - Se a sala ainda não existe -> cria
// - Se a sala já existe (409) -> faz GET e devolve a URL existente
async function ensureRoomUrl(appointmentId) {
  if (!process.env.DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY não configurada nas variáveis de ambiente');
  }

  const roomName = `consulta-${appointmentId}`;

  try {
    // Tenta CRIAR a sala
    const response = await axios.post(
      `${DAILY_API_BASE}/rooms`,
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

    return response.data.url;

  } catch (error) {
    // SE A SALA JÁ EXISTIR (409) → RECUPERA A SALA
    if (error.response && error.response.status === 409) {
      try {
        const getResp = await axios.get(
          `${DAILY_API_BASE}/rooms/${roomName}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
            },
          }
        );

        return getResp.data.url;

      } catch (getError) {
        console.error("Erro ao recuperar sala existente:", getError.response?.data || getError);
        throw getError;
      }
    }

    console.error(
      'Erro ao criar sala Daily:',
      error.response?.data || error.message || error
    );
    throw error;
  }
}

// =====================
// Endpoint HTTP chamado pelo front
// =====================
app.post('/api/create-room', async (req, res) => {
  try {
    const { appointmentId } = req.body || {};

    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId é obrigatório' });
    }

    const roomUrl = await ensureRoomUrl(appointmentId);

    return res.json({ roomUrl });

  } catch (error) {
    console.error(
      'Erro no endpoint /api/create-room:',
      error.response?.data || error.message || error
    );
    return res
      .status(500)
      .json({ error: 'Erro ao criar/recuperar sala Daily' });
  }
});

// =====================
// Start server
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});


