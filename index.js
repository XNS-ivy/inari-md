const {  makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { boom } = require('@hapi/boom');
const fs = require('fs');
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
    browser: ['Inari-MD','FireFox','1.0.0']
  });
  if(pairingCode && !inari.authState.creds.regustered){
    const question = () => new Promise ((resolve) => {
      const readLine = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      readline.question('Input Your Phone Number: +',(resolve) => {
        resolve(answer);
        readline.close();
      });
    });
    const pNumber = await question();
    setTimeout(async() => {
      const code = await inari.requestPairingCode(Phone);
      console.log('Your Pairing Code : '+ code);
    }, 5000);
  }
  inari.ev.on('connection.update',async  ({connection}) => {
    if(connection === 'open'){
      console.log('is open');
    } else if (connection === 'close'){
      setTimeout(() =>{
        console.log('Connection Cloded, Try To Recconect\n\n');
      }, 3000);
      try {
        await inariSock();
      } catch (error) {
        console.error('Error Reconnecting\n\n',error);
        throw error;
      }
    }
  });
  inari.ev.on('creds.update', saveCreds);
}

app.get('/',async(req, res) => {
  try {
  await inariSock();
  res.send('Check your server logs for connection status.');
  } catch (error) {
    console.error('Error Start Server:\n\n',error);
    throw error;
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});