const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require('@hapi/boom');
const express = require('express');
const app = express();
const sessionPath = './session';

const pairingCode = process.argv.includes('--cd');

async function inariSock() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const inari = await makeWASocket({
    printQRInTerminal: !pairingCode,
    qrTimeout: 30000,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: pairingCode ? ['Chrome (linux)','',''] : ['Inari-MD', 'FireFox', '1.0.0'],
  });

  if (pairingCode && !inari.authState.creds.registered) {
    const question = () => new Promise((resolve) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.question('Input Your Phone Number: +', (answer) => {
        resolve(answer);
        readline.close();
      });
    });

    const pNumber = await question();

    setTimeout(async () => {
      const code = await inari.requestPairingCode(pNumber);
      console.log('Your Pairing Code: ' + code);
    }, 5000);
  }

  inari.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      console.log('Connection is open');
    } else if (connection === 'close') {
      setTimeout(() => {
        console.log('Connection Closed, Trying To Reconnect\n');
      }, 3000);
      try {
        await inariSock();
      } catch (error) {
        console.error('Error Reconnecting\n', error);
        throw error;
      }
    }
  });

  inari.ev.on('creds.update', saveCreds);
  inari.ev.on('messages.upsert',({messages}) =>{
    const m = messages[0];
    if (!m.messages) return;
    console.log(m);
  });
}

const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await inariSock();
  } catch (error) {
    console.error('Error starting inariSock:\n\n', error);
    process.exit(1);
  }
});