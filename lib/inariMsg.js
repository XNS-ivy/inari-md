const prefix = require('../database/database.json');
const axios = require('axios');
const wikipedia = require('wikipedia-js');

async function messageHandle(inari, m) {
  // console.log(m);
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
  if (mText.startsWith(prefix.commandPrefix)) {
    const [query, ...args] = mText.substring(1).split(' ');
    const argumen = args.join(' ').trim();
    let msg;
    if (query && !argumen) {
      switch (query) {
        case 'menu':
          msg = `Hi ${name} berikut adalah perintah perintah menjalankan bot <3
        \n❒ Wikipedia
        • !idwiki [wiki indoneia]\n
        • !enwiki`;
          await reply(m, inari, msg);
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