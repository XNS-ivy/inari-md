const {  makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { boom } = require('@hapi/boom');
const fs = require('fs');
const express = require('express');
const app = express();
const sessionPath = './session';
const readLine = require('readline');

async function inariSock() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const inari = await makeWASocket({
    printQRInTerminal: true,
    qrTimeout: 30000,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['Inari-MD','FireFox','1.0.0']
  });
  inari.ev.on('connection.update',async  ({connection}) => {
    if(connection === 'open'){
      console.log('is open');
    } else if (connection === 'close'){
      try {
        await inariSock();
      } catch (error) {
        Boom.badimplementation();
        console.error('',error);
      }
    }
  });
  inari.ev.on('creds.update', saveCreds);
}
app.use(async,(req, res, next) => {
  res.redirect('/');
});
app.get('/',async (req, res) => {
  res.send('Hello World');
  await inariSock();
});

// Start the server
const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});