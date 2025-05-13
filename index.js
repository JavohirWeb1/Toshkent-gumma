

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
  userStates[chatId] = { step: null };

  const options = {
    reply_markup: {
      keyboard: [['📦 Buyurtma berish']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };

  bot.sendMessage(chatId, "Xush kelibsiz! Quyidagi tugma orqali buyurtma bering:", options);
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

    bot.sendMessage(chatId, summary + "\n📍 Endi manzilingizni yozing:");
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
    bot.sendMessage(chatId, "Telefon raqamingiz?");
    return;
  }

  // Buyurtmani yuborish
  if (state.step === 'phone') {
    state.phone = text;

    let order = '🆕 Yangi buyurtma:\n\n';
    state.order.forEach(item => {
      order += `🍴 ${item.product} — ${item.quantity} dona\n`;
    });

    order += `\n📍 Manzil: ${state.address}\n📞 Tel: ${state.phone}\n👤 Buyurtmachi: ${msg.from.first_name} ${msg.from.username ? `(@${msg.from.username})` : ''}`;

    bot.sendMessage(adminChatId, order);
    bot.sendMessage(groupChatId, order);
    bot.sendMessage(chatId, "✅ Buyurtmangiz qabul qilindi! Tez orada bog‘lanamiz.");

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

// // Buyurtma berish tugmasi
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const text = msg.text;

//   if (!userStates[chatId]) userStates[chatId] = {};

//   const state = userStates[chatId];

//   // if (text === '📦 Buyurtma berish') {
//   //   state.step = 'product';
//   //   bot.sendMessage(chatId, "Nima buyurtma qilmoqchisiz?\n\n" +
//   // "✅ Kartoshkali Gumma  -  3500\n" +
//   // "✅ Go`shtli Gumma  -  3500\n" +
//   // "✅ Sosiskali perashki  -  4000\n" +
//   // "✅ Shashlikli perashki  -  5000\n" +
//   // "✅ Kartoshkali Perashki  -  3000", {
//   //                   reply_markup: {
//   //                     keyboard: [['🔙 Bekor qilish']],
//   //                     resize_keyboard: true,
//   //                     one_time_keyboard: true
//   //                   }
//   //                 });
//   //   return;
//   // }
// if (text === '📦 Buyurtma berish') {
//   state.step = 'product';
//   bot.sendMessage(chatId, "Nima buyurtma qilmoqchisiz?", {
//     reply_markup: {
//       keyboard: [
//         ['Kartoshkali Gumma  -  3500'],
//         ['Go`shtli Gumma  -  3500'],
//         ['Sosiskali perashki  -  4000'],
//         ['Shashlikli perashki  -  5000'],
//         ['Kartoshkali Perashki  -  3000'],
//         ['🔙 Bekor qilish']
//       ],
//       resize_keyboard: true,
//       one_time_keyboard: true
//     }
//   });
//   return;
// }

//   if (text === '🔙 Bekor qilish') {
//                     userStates[chatId] = { step: null };
                  
//                     bot.sendMessage(chatId, "❌ Buyurtma bekor qilindi. Pastdagi tugma orqali qayta buyurtma bersangiz bo'ladi!", {
//                       reply_markup: {
//                         keyboard: [['📦 Buyurtma berish']],
//                         resize_keyboard: true,
//                         one_time_keyboard: true
//                       }
//                     });
//                     return;
//                   }
                  

//   switch (state.step) {
//     case 'product':
//       state.product = text;
//       state.step = 'quantity';
//       bot.sendMessage(chatId, "Miqdori?", {
//                     reply_markup: {
//                        force_reply: true,
//                        input_field_placeholder: "Masalan: 10"
//                       keyboard: [['🔙 Bekor qilish']],
//                       resize_keyboard: true,
//                       one_time_keyboard: true
//                     }
//                   });
//       break;
//     case 'quantity':
//       state.quantity = text;
//       state.step = 'address';
//       bot.sendMessage(chatId, "Manzilingiz?", {
//                     reply_markup: {
//                       keyboard: [['🔙 Bekor qilish']],
//                       resize_keyboard: true,
//                       one_time_keyboard: true
//                     }
//                   });
//       break;
//     case 'address':
//       state.address = text;
//       state.step = 'phone';
//       bot.sendMessage(chatId, "Telefon raqamingiz?", {
//                     reply_markup: {
//                       keyboard: [['🔙 Bekor qilish']],
//                       resize_keyboard: true,
//                       one_time_keyboard: true
//                     }
//                   });
//       break;
//     case 'phone':
//       state.phone = text;
    

//       // Buyurtmani to‘liq yuboramiz
//       const order = `🆕 Yangi buyurtma:\n` +
//         `📦 Mahsulot: ${state.product}\n` +
//         `🔢 Miqdori: ${state.quantity}\n` +
//         `📍 Manzil: ${state.address}\n` +
//         `📞 Tel: ${state.phone}\n` +
//         `👤 Buyurtmachi: ${msg.from.first_name} ${msg.from.username ? `(@${msg.from.username})` : ''}`;

//       bot.sendMessage(adminChatId, order);
//       bot.sendMessage(groupChatId, order);
//       bot.sendMessage(chatId, "✅ Buyurtmangiz qabul qilindi! Tez orada bog‘lanamiz. ");

//       // Reset and return to order button
//       userStates[chatId] = { step: null };
//       bot.sendMessage(chatId, "Yana buyurtma berish uchun pastdagi tugmani bosing👇:", {
//         reply_markup: {
//           keyboard: [['📦 Buyurtma berish']],
//           resize_keyboard: true,
//           one_time_keyboard: true
//         }
//       });
//       break;

//     default:
//       break;
//   }
// });

                  
