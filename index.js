const TelegramBot = require('node-telegram-bot-api');

const token = '7470866098:AAGwiOK90YvgSKej8RFhzdowtwozZ7Y-WJA'; // Bot tokeni
const adminChatId = 805693777; // Admin Telegram ID
const groupChatId = -1002618646109
const INFOgroupChatId = -1002592152871

; // Guruh chat ID (minus bilan boshlanadi)
// const adminChatId = -4685247186; // Admin Telegram ID


function getPriceFromText(text) {
  const match = text.match(/- *(\d+)/); // matndan narxni ajratadi
  return match ? parseInt(match[1]) : 0;
}

const bot = new TelegramBot(token, { polling: true });

const userStates = {}; // Foydalanuvchilar holatini saqlash

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: null };

  const from = msg.from;
  const now = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent'
  });

  const profileMessage = `👤 *Yangi foydalanuvchi start bosdi!*\n\n` +
    `📛 Ismi: ${from.first_name || '—'}\n` +
    `🆔 ID: \`${from.id}\`\n` +
    `🏷 Username: ${from.username ? '@' + from.username : '—'}\n` +
    `🕒 Vaqti: ${now}`;

  // Guruhga yuborish (maxsus groupChatId bo‘lishi kerak)
  bot.sendMessage(INFOgroupChatId, profileMessage, { parse_mode: 'Markdown' });

  // Mijozga xabar
  bot.sendMessage(chatId, "Xush kelibsiz! Quyidagi tugma orqali buyurtma bering 👇:", {
    reply_markup: {
      keyboard: [['📦 Buyurtma berish']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.onText(/\/location/, (msg) => {
  const chatId = msg.chat.id;

  const infoMessage = `📍 *Bizning manzilimiz:*\n` +
    `https://yandex.uz/maps/-/CHv2bO9C\n\n` +
`https://maps.app.goo.gl/4UZXRyR46KTzawtt6\n\n` +
    `📞 Aloqa uchun: +998 95 552 97 08\n` +
    `📬 Telegram: @zomingummabot\n\n` +
    `🕒 Ish vaqti: 06:00 — 21:00 (Har kuni)\n\n` +
    `Marhamat, buyurtma berish uchun pastdagi tugmadan foydalaning!`;

  bot.sendMessage(chatId, infoMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [['📦 Buyurtma berish']],
      resize_keyboard: true
    }
  });
});




const productMenu = [
  'Kartoshkali Gumma  -  3500',
  'Go`shtli Gumma  -  3500',
  'Sosiskali perashki  -  4000',
  'Shashlikli perashki  -  5000',
  'Kartoshkali Perashki  -  3000'
];

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userStates[chatId]) userStates[chatId] = {};
  const state = userStates[chatId];

  // Boshlash
  if (text === '📦 Buyurtma berish') {
    state.step = 'selecting';
    state.order = [];
    state.currentProduct = null;

    const keyboard = productMenu.map(item => [item]);
    keyboard.push(['✅ Buyurtmani yakunlash'], ['🔙 Bekor qilish']);

    bot.sendMessage(chatId, "Mahsulotni tanlang:", {
      reply_markup: {
        keyboard,
        resize_keyboard: true
      }
    });
    return;
  }

  // Bekor qilish
  if (text === '🔙 Bekor qilish') {
    userStates[chatId] = { step: null };
    bot.sendMessage(chatId, "❌ Buyurtma bekor qilindi.", {
      reply_markup: {
        keyboard: [['📦 Buyurtma berish']],
        resize_keyboard: true
      }
    });
    return;
  }

  // Buyurtmani yakunlash
  if (text === '✅ Buyurtmani yakunlash' && state.order?.length > 0) {
    state.step = 'address';
    let summary = '🆕 Yangi buyurtma:\n\n';

    state.order.forEach(item => {
      summary += `🍴 ${item.product} — ${item.quantity} dona\n`;
    });

    bot.sendMessage(chatId, "📍 Manzilingizni yozing:", {
  reply_markup: {
    keyboard: [['🔙 Bekor qilish']],
    resize_keyboard: true,
    one_time_keyboard: true,
    input_field_placeholder: "Mashal yoniga"
  }
});
  return;
  }

  // Mahsulot tanlang
  if (state.step === 'selecting' && productMenu.includes(text)) {
    state.currentProduct = text;
    state.step = 'awaiting_quantity';

    bot.sendMessage(chatId, `${text}\n\nNechta olasiz?`, {
      reply_markup: {
        remove_keyboard: true
      }
    });
    return;
  }

  // Miqdor yozish
  if (state.step === 'awaiting_quantity' && !isNaN(text)) {
    state.order.push({ product: state.currentProduct, quantity: text });
    state.currentProduct = null;
    state.step = 'selecting';

    const keyboard = productMenu.map(item => [item]);
    keyboard.push(['✅ Buyurtmani yakunlash'], ['🔙 Bekor qilish']);

    bot.sendMessage(chatId, "Yana mahsulot tanlang yoki buyurtmani yakunlang:", {
      reply_markup: {
        keyboard,
        resize_keyboard: true
      }
    });
    return;
  }

  // Manzil → Telefon
  if (state.step === 'address') {
    state.address = text;
    state.step = 'phone';
    // bot.sendMessage(chatId, "Telefon raqamingiz?");
bot.sendMessage(chatId, "📞 Telefon raqamingizni yozing:", {
  reply_markup: {
    keyboard: [['🔙 Bekor qilish']],
    resize_keyboard: true,
    one_time_keyboard: true,
    input_field_placeholder: "955529708"
  }
});
    return;
  }

  // Buyurtmani yuborish
  if (state.step === 'phone') {
    state.phone = text;
  
    let order = '🆕 Yangi buyurtma:\n\n';
    let total = 0;
  
    state.order.forEach(item => {
      const price = getPriceFromText(item.product); // narx ajratiladi
      const sum = price * parseInt(item.quantity);
      total += sum;
      order += `🍴 ${item.product} — ${item.quantity} dona = ${sum} so'm\n`;
    });
  
    order += `\n💰 Jami: ${total} so'm`;
    order += `\n📍 Manzil: ${state.address}`;
    order += `\n📞 Tel: ${state.phone}`;
    order += `\n👤 Buyurtmachi: ${msg.from.first_name} ${msg.from.username ? `(@${msg.from.username})` : ''}`;
  
    bot.sendMessage(adminChatId, order);
    bot.sendMessage(groupChatId, order);
    bot.sendMessage(chatId, "✅ Buyurtmangiz qabul qilindi! Tez orada bog‘lanamiz.\n\n" + order);
  
    userStates[chatId] = { step: null };
  
    bot.sendMessage(chatId, "Yana buyurtma berish uchun pastdagi tugmani bosing👇:", {
      reply_markup: {
        keyboard: [['📦 Buyurtma berish']],
        resize_keyboard: true
      }
    });
    return;
  }
});
