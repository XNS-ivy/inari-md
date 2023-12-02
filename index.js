const express = require('express');
const app = express();
const PORT = 3000;
const { inariSock } = require('./sock.js');

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await inariSock();
  } catch (error) {
    console.error('Error starting inariSock:\n\n', error);
    process.exit(1);
  }
});