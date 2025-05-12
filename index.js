require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./userModel'); // modelni chaqirish

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB ulandi');
}).catch(err => {
  console.error('❌ MongoDB xatolik:', err);
});


const TelegramBot = require('node-telegram-bot-api');

const token = '7470866098:AAGwiOK90YvgSKej8RFhzdowtwozZ7Y-WJA'; // Bot tokeni
const adminChatId = 805693777; // Admin Telegram ID
const groupChatId = -1002618646109
; // Guruh chat ID (minus bilan boshlanadi)
// const adminChatId = -4685247186; // Admin Telegram ID

const bot = new TelegramBot(token, { polling: true });

const userStates = {}; // Foydalanuvchilar holatini saqlash

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const from = msg.from;

  try {
    const existingUser = await User.findOne({ id: from.id });
    if (!existingUser) {
      await User.create({
        id: from.id,
        first_name: from.first_name || '',
        username: from.username || '',
        is_bot: from.is_bot,
        language_code: from.language_code || ''
      });
      console.log(`🆕 Yangi foydalanuvchi saqlandi: ${from.first_name}`);
    } else {
      console.log(`ℹ️ Foydalanuvchi mavjud: ${from.first_name}`);
    }
  } catch (err) {
    console.error("❌ Mongo saqlashda xatolik:", err);
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
    bot.sendMessage(chatId, "Nima buyurtma qilmoqchisiz?\n\n" +
  "✅ Kartoshkali perashki\n" +
  "✅ Sosiskali perashki\n" +
  "✅ Shashlikli perashki\n" +
  "✅ Gumma", {
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

                  
