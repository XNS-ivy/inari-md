const {  makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { boom } = require('@hapi/boom');
const fs = require('fs');
const express = require('express');
const app = express();
const sessionPath = './session';

async function inariSock() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const inari = await makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['Inari-MD','FireFox','1.0.0']
  });
  inari.ev.on('connection.update',async  ({connection}) => {
    if(connection === 'open'){
      console.log('is open');
    } else if (connection === 'close'){
      await inariSock();
    }
  });
  inari.ev.on('creds.update', saveCreds);
}
inariSock();