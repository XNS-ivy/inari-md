const prefix = require('../database/database.json');

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
    const argumen = args.join(' ');
    let msg;

    switch (query) {
      case 'menu':
        msg = "DEMO MENU";
        await reply(m,inari,msg);
        break;
    
      default:
        break;
    }
  } else {
    return;
  }

  // console.log(query);

  // ---- switch case reply -----
  
  // ----------------------------
}

async function reply(m,inari,text) {
  const id = m.key.remoteJid;
  try {
    await inari.sendMessage(id,{text: text},{quoted: m});
  } catch (error) {
    console.error(error);
    process.exit();
  }
}
module.exports = {
  messageHandle
};