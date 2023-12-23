const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const db = require('../database/database.json');
const axios = require('axios');
const wikipedia = require('wikipedia-js');
const Pino = require("pino");
const fs = require('fs');
const Ffmpeg = require('fluent-ffmpeg');
const { Sticker } = require('wa-sticker-formatter');

const prefix = db.commandPrefix;
async function messageHandle(inari, m) {

  const msgType = Object.keys(m.message)[0];
  const mText = msgType === "conversation" ? m.message.conversation :
    msgType === "extendedTextMessage" ? m.message.extendedTextMessage.text :
      msgType === "imageMessage" ? m.message.imageMessage.caption : "";
  // ------ logging mesage ------
  const pM = m.key.participant === !undefined ? m.key.participant :
    m.key.remoteJid;
  const name = m.pushName;
  const onGroup = m.key.participant !== undefined;

  const currentTime = new Date(m.messageTimestamp * 1000);
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const second = currentTime.getSeconds();
  const formattedTime = `${hour}:${minute < 10 ? '0' : ''}${minute}:${second < 10 ? '0' : ''}${second}`;

  // coloring
  const reset = "\x1b[0m";
  const bright = "\x1b[1m";
  const red = "\x1b[31m";
  const green = "\x1b[32m";
  const yellow = "\x1b[33m";
  const blue = "\x1b[34m";

  console.log(`${red}${bright}「 Pesan Baru 」${reset}
  ${green}Nomor :\t\t${reset}${pM}
  ${green}Nama :\t\t${reset}${name}
  ${yellow}Pesan :\t\t${reset}${mText}
  ${yellow}Jenis Pesan :\t\t${reset}${msgType}
  ${blue}Grup :\t\t${reset}${onGroup}
  ${blue}Waktu :\t\t${reset}${formattedTime}\n`);

  // ---- message collection ----
  if (mText.startsWith(prefix)) {
    const [query, ...args] = mText.substring(1).split(' ');
    const argumen = args.join(' ').trim();
    let msg;
    if (query && !argumen) {
      switch (query) {
        case 'menu':
          msg = `Hi ${name} berikut adalah perintah perintah menjalankan bot <3
        \n❒ Wikipedia
        • ${prefix}idwiki [wiki indoneia]\n
        • ${prefix}enwiki [wiki global]
        \n❒ Sticker
        • ${prefix}stc / ${prefix}sticker / ${prefix}stiker`;

          await reply(m, inari, msg);
          break;
        case 'stc':
        case 'sticker':
        case 'stiker':
          if (msgType !=="imageMessage") {
            await reply(m, inari, 'silahkan input gambar beserta caption command');
          } else {
            try {
              console.log(`Sedang menjalankan ${query}`);

              const buffer = await downloadMediaMessage(m, 'buffer', {}, { logger: Pino });
              fs.writeFileSync('./sticker/sticker.png', buffer);

              await new Promise((resolve, reject) => {
                Ffmpeg('./sticker/sticker.png')
                  .format('webp')
                  .keepDAR()
                  .on('error', (err) => reject(err))
                  .on('end', () => {
                    console.log('Konversi selesai.');
                    resolve();
                  })
                  .save('./sticker/sticker.webp');
              });

              const stickerPath = './sticker/sticker.webp';
              await stickerr(inari, m, stickerPath);
              console.log('Proses selesai.');
            } catch (error) {
              console.error('Terjadi kesalahan:', error);
            }
          }
          break;

        default:
          break;
      }
    } else {
      switch (query) {
        case 'idwiki':
        case 'enwiki':
          const country = query === 'idwiki' ? 'id' : 'en';
          await wiki(m, inari, country, argumen);
          break;
        default:
          break;
      }
    }
  } else {
    return;
  }
}

// ----------------------------

// --------- functions --------
async function wiki(m, inari, country, argumen) {
  try {
    const search = await axios.get(`https://${country}.wikipedia.org/w/api.php`, {
      params: {
        format: 'json',
        action: 'query',
        list: 'search',
        srsearch: argumen,
        srprop: '',
        srlimit: 1,
        utf8: 1
      }
    });

    const searchResults = search.data.query.search;

    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      const title = firstResult.title;

      const article = await axios.get(`https://${country}.wikipedia.org/w/api.php`, {
        params: {
          format: 'json',
          action: 'query',
          prop: 'extracts',
          exintro: true,
          explaintext: true,
          redirects: 1,
          titles: title
        }
      });

      const pages = article.data.query.pages;
      const pageIds = Object.keys(pages);

      if (pageIds.length > 0) {
        const extract = pages[pageIds[0]].extract;
        if (extract) {
          const responseText = `Artikel: ${title}\n\n${extract}`;
          await reply(m, inari, responseText);
        } else {
          const gakKetemu = `Maaf, artikel "${title}" tidak ditemukan.`;
          await reply(m, inari, gakKetemu);
        }
      }
    } else {
      const gakKetemu = "Maaf, artikel tidak ditemukan.";
      await reply(m, inari, gakKetemu);
    }
  } catch (error) {
    console.error('Error pada fungsi wiki:', error);
  }
}
async function stickerr(inari, m, media) {
  const id = m.key.remoteJid;
  try {
    const sticker = await new Sticker(media, {
      pack: 'Inari-Md Bot',
      author: 'Inari-Md',
      type: 'full',
      categories: ['🤩', '🎉'],
      quality: 70,
      background: 'transparent',
    }).build();

    await inari.sendMessage(id, { sticker }, { quoted: m });
  } catch (err) {
    console.error(err);
  }
}
async function reply(m, inari, text) {
  const id = m.key.remoteJid;
  try {
    await inari.sendMessage(id, { text: text }, { quoted: m, });
  } catch (error) {
    console.error(error);
    return { error: 'An error occurred in the reply function.' };
  }
}
module.exports = {
  messageHandle
};