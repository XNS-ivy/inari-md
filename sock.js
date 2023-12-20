const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require('@hapi/boom');
const pairCode = process.argv.includes('--cd');
const { messageHandle } = require('./lib/inariMsg.js');
const fs = require('fs');

const sessionPath = './session';

async function inariSock() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  let creds;
  let browser;
  try {
    creds = JSON.parse(fs.readFileSync('./session/creds.json'));
  } catch (err) {
    creds = null;
  }

  if (!creds) {
    browser = pairCode ? ['Chrome (linux)', '', ''] :
      ['Inari-MD', 'FireFox', '1.0.0'];
  } else {
    if (!creds.pairingCode || creds.pairingCode === "") {
      browser = ['Inari-MD', 'FireFox', '1.0.0'];
    } else {
      browser = ['Chrome (linux)', '', ''];
    }
  }

  const inari = await makeWASocket({
    printQRInTerminal: !pairCode,
    qrTimeout: 30000,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: browser,
  });

  if (pairCode && !inari.user && !inari.authState.creds.registered) {
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
      const code = await inari.requestpairCode(pNumber);
      console.log('Your Pairing Code: ' + code);
    }, 5000);
  }

  inari.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      console.log(`Connection is open : +${inari.user.id}`);
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
  inari.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    try {
      // console.log(m);
      await messageHandle(inari, m);

    } catch (error) {
      console.error('Error On Massage Listener :\n', error);
    }
  });
}

module.exports = {
  inariSock
};