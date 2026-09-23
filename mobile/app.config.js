const fs = require('fs');
const path = require('path');

// Load single root .env file
const rootEnv = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(rootEnv)) {
  fs.readFileSync(rootEnv, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key) process.env[key] = value;
  });
}

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
    },
  },
};
