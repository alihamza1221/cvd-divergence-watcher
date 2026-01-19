const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for alerts (persists as long as server is running)
const alertStore = new Map();

// Settings
let expiryMinutes = 15;
let telegramAlertsEnabled = true;

// Send Telegram message
async function sendTelegramAlert(alert) {
  if (!telegramAlertsEnabled) {
    console.log('📵 Telegram alerts disabled, skipping...');
    return;
  }

  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'your_bot_token_here' || 
      !TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'your_chat_id_here') {
    console.log('⚠️ Telegram not configured, skipping alert...');
    return;
  }

  const emoji = alert.cvd_direction === 'bullish' ? '🟢' : '🔴';
  const direction = alert.cvd_direction.toUpperCase();
  const targetPrice = alert.cvd_direction === 'bullish' ? alert.session_low : alert.session_high;

  const message = `
${emoji} *CVD DIVERGENCE ALERT* ${emoji}

*Symbol:* ${alert.symbol}
*Timeframe:* ${alert.timeframe}
*Direction:* ${direction}
*Session:* ${alert.active_session || 'N/A'}

💰 *Target Price:* $${targetPrice.toLocaleString()}
📊 *L1:* $${alert.pivot1.toLocaleString()}
📊 *L2:* $${alert.pivot2.toLocaleString()}

📈 Session High: $${alert.session_high.toLocaleString()}
📉 Session Low: $${alert.session_low.toLocaleString()}

${alert.message ? `📝 ${alert.message}` : ''}
`.trim();

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      console.log('📨 Telegram alert sent successfully!');
    } else {
      console.error('❌ Telegram error:', data.description);
    }
  } catch (error) {
    console.error('❌ Failed to send Telegram alert:', error.message);
  }
}

// Helper function to clean expired alerts
function cleanExpiredAlerts() {
  const now = Date.now();
  const expiryMs = expiryMinutes * 60 * 1000;
  
  for (const [key, alert] of alertStore.entries()) {
    if (now - alert.receivedAt > expiryMs) {
      alertStore.delete(key);
      console.log(`Expired alert removed: ${key}`);
    }
  }
}

// Clean expired alerts every minute
setInterval(cleanExpiredAlerts, 60 * 1000);

// POST /api/cvd-alerts - Receive new alert from strategy
app.post('/api/cvd-alerts', (req, res) => {
  try {
    const body = req.body;
    
    console.log('Received CVD alert:', JSON.stringify(body, null, 2));
    
    const {
      message,
      symbol,
      timeframe,
      time,
      session_high,
      session_low,
      active_session,
      cvd_direction,
      pivot1,
      pivot2,
    } = body;

    if (!symbol || !timeframe) {
      return res.status(400).json({ error: 'symbol and timeframe are required' });
    }

    // Normalize symbol (extract base like BTC from BTCUSDT, BTC/USDT PERPETUAL, etc.)
    const normalizedSymbol = symbol
      .replace(/\/?(USDT|USD|BUSD|PERPETUAL| PERPETUAL)/gi, '')
      .replace(/\//g, '')
      .toUpperCase();
    
    const key = `${normalizedSymbol}-${timeframe}`;
    
    const alert = {
      symbol: normalizedSymbol,
      timeframe,
      time: time || new Date().toISOString(),
      session_high: parseFloat(session_high) || 0,
      session_low: parseFloat(session_low) || 0,
      active_session: active_session || '',
      cvd_direction: cvd_direction?.toLowerCase() === 'bullish' ? 'bullish' : 'bearish',
      pivot1: parseFloat(pivot1) || 0,
      pivot2: parseFloat(pivot2) || 0,
      message: message || '',
      receivedAt: Date.now(),
    };

    alertStore.set(key, alert);
    
    console.log(`✅ Alert stored: ${key}`);
    console.log(`   Symbol: ${alert.symbol}, Timeframe: ${alert.timeframe}, Direction: ${alert.cvd_direction}`);
    console.log(`   Total alerts in store: ${alertStore.size}`);

    // Send Telegram notification
    sendTelegramAlert(alert);

    res.json({ success: true, key, alert });
  } catch (error) {
    console.error('Error processing POST request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/cvd-alerts - Return all current alerts
app.get('/api/cvd-alerts', (req, res) => {
  try {
    // Clean expired alerts first
    cleanExpiredAlerts();
    
    // Convert Map to object
    const alerts = {};
    for (const [key, alert] of alertStore.entries()) {
      alerts[key] = alert;
    }

    console.log(`📤 Returning ${Object.keys(alerts).length} alerts`);

    res.json({ alerts });
  } catch (error) {
    console.error('Error processing GET request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DELETE /api/cvd-alerts - Clear all alerts
app.delete('/api/cvd-alerts', (req, res) => {
  try {
    const count = alertStore.size;
    alertStore.clear();
    
    console.log(`🗑️ Cleared ${count} alerts`);

    res.json({ success: true, message: `All ${count} alerts cleared` });
  } catch (error) {
    console.error('Error processing DELETE request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/settings - Get current settings
app.get('/api/settings', (req, res) => {
  res.json({ expiryMinutes, telegramAlertsEnabled });
});

// PUT /api/settings - Update settings
app.put('/api/settings', (req, res) => {
  try {
    const { expiryMinutes: newExpiry, telegramAlertsEnabled: newTelegramEnabled } = req.body;
    
    if (newExpiry !== undefined && typeof newExpiry === 'number' && newExpiry > 0) {
      expiryMinutes = newExpiry;
      console.log(`⚙️ Expiry time updated to ${expiryMinutes} minutes`);
    }
    
    if (newTelegramEnabled !== undefined && typeof newTelegramEnabled === 'boolean') {
      telegramAlertsEnabled = newTelegramEnabled;
      console.log(`⚙️ Telegram alerts ${telegramAlertsEnabled ? 'enabled' : 'disabled'}`);
    }
    
    res.json({ success: true, expiryMinutes, telegramAlertsEnabled });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', alertCount: alertStore.size, expiryMinutes, uptime: process.uptime() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 CVD Alerts Backend running on http://localhost:${PORT}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   POST   http://localhost:${PORT}/api/cvd-alerts  - Receive alerts`);
  console.log(`   GET    http://localhost:${PORT}/api/cvd-alerts  - Get all alerts`);
  console.log(`   DELETE http://localhost:${PORT}/api/cvd-alerts  - Clear all alerts`);
  console.log(`   GET    http://localhost:${PORT}/api/settings    - Get settings`);
  console.log(`   PUT    http://localhost:${PORT}/api/settings    - Update settings`);
  console.log(`   GET    http://localhost:${PORT}/api/health      - Health check\n`);
});
