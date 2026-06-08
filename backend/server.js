const app = require('./src/app');
const { testConnection } = require('./src/config/firebase');
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(` Server: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  try {
    await testConnection();
  } catch (err) {
    console.warn('️ Firebase test skipped');
  }
});