const TelegramBot = require('node-telegram-bot-api');

const token = '7470866098:AAGwiOK90YvgSKej8RFhzdowtwozZ7Y-WJA'; // Bot tokeni
const adminChatId = 805693777; // Admin Telegram ID
const groupChatId = -1002618646109
; // Guruh chat ID (minus bilan boshlanadi)
// const adminChatId = -4685247186; // Admin Telegram ID

const bot = new TelegramBot(token, { polling: true });

const userStates = {}; // Foydalanuvchilar holatini saqlash

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = {
    id: msg.from.id,
    first_name: msg.from.first_name || '',
    username: msg.from.username || '',
  };

  // Foydalanuvchini fayldan tekshirish
  let users = [];
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json'));
  }

  // ID mavjud bo‘lmasa — qo‘shamiz
  const alreadyExists = users.find(u => u.id === user.id);
  if (!alreadyExists) {
    users.push(user);
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    console.log(`🆕 Yangi foydalanuvchi saqlandi: ${user.first_name}`);
  }

  bot.sendMessage(chatId, "Xush kelibsiz! Buyurtma berish uchun tugmadan foydalaning.", {
    reply_markup: {
      keyboard: [['📦 Buyurtma berish']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// Buyurtma berish tugmasi
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userStates[chatId]) userStates[chatId] = {};

  const state = userStates[chatId];

  if (text === '📦 Buyurtma berish') {
    state.step = 'product';
    bot.sendMessage(chatId, "Nima buyurtma qilmoqchisiz? Perashki,   Gumma,   Shashlik perashki", {
                    reply_markup: {
                      keyboard: [['🔙 Bekor qilish']],
                      resize_keyboard: true,
                      one_time_keyboard: true
                    }
                  });
    return;
  }
  if (text === '🔙 Bekor qilish') {
                    userStates[chatId] = { step: null };
                  
                    bot.sendMessage(chatId, "❌ Buyurtma bekor qilindi. Pastdagi tugma orqali qayta buyurtma bersangiz bo'ladi!", {
                      reply_markup: {
                        keyboard: [['📦 Buyurtma berish']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                      }
                    });
                    return;
                  }
                  

  switch (state.step) {
    case 'product':
      state.product = text;
      state.step = 'quantity';
      bot.sendMessage(chatId, "Miqdori?", {
                    reply_markup: {
                      keyboard: [['🔙 Bekor qilish']],
                      resize_keyboard: true,
                      one_time_keyboard: true
                    }
                  });
      break;
    case 'quantity':
      state.quantity = text;
      state.step = 'address';
      bot.sendMessage(chatId, "Manzilingiz?", {
                    reply_markup: {
                      keyboard: [['🔙 Bekor qilish']],
                      resize_keyboard: true,
                      one_time_keyboard: true
                    }
                  });
      break;
    case 'address':
      state.address = text;
      state.step = 'phone';
      bot.sendMessage(chatId, "Telefon raqamingiz?", {
                    reply_markup: {
                      keyboard: [['🔙 Bekor qilish']],
                      resize_keyboard: true,
                      one_time_keyboard: true
                    }
                  });
      break;
    case 'phone':
      state.phone = text;

      // Buyurtmani to‘liq yuboramiz
      const order = `🆕 Yangi buyurtma:\n` +
        `📦 Mahsulot: ${state.product}\n` +
        `🔢 Miqdori: ${state.quantity}\n` +
        `📍 Manzil: ${state.address}\n` +
        `📞 Tel: ${state.phone}\n` +
        `👤 Buyurtmachi: ${msg.from.first_name} ${msg.from.username ? `(@${msg.from.username})` : ''}`;

      bot.sendMessage(adminChatId, order);
      bot.sendMessage(groupChatId, order);
      bot.sendMessage(chatId, "✅ Buyurtmangiz qabul qilindi! Tez orada bog‘lanamiz.");

      // Reset and return to order button
      userStates[chatId] = { step: null };
      bot.sendMessage(chatId, "Yana buyurtma berish uchun pastdagi tugmani bosing:", {
        reply_markup: {
          keyboard: [['📦 Buyurtma berish']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
      break;

    default:
      break;
  }
});

                  
