// require('dotenv').config();
// const { Telegraf } = require('telegraf');
// const sqlite3 = require('sqlite3').verbose();

// const bot = new Telegraf(process.env.BOT_TOKEN);
// const db = new sqlite3.Database('./database/orders.db');

// // Admin sozlamalari
// const admins = process.env.ADMIN_ID ? process.env.ADMIN_ID.split(',').map(Number) : [];
// const adminGroup = process.env.ADMIN_GROUP_ID ? parseInt(process.env.ADMIN_GROUP_ID) : null;
// let userState = {};

// // Database yaratish
// db.serialize(() => {
//   db.run(`
//     CREATE TABLE IF NOT EXISTS orders (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       user_id INTEGER NOT NULL,
//       username TEXT,
//       product_type TEXT NOT NULL,
//       quantity INTEGER NOT NULL,
//       address TEXT NOT NULL,
//       phone TEXT NOT NULL,
//       status TEXT DEFAULT 'new',
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//       operator_id INTEGER
//     )
//   `);
// });

// // Buyurtmani formatlash
// function formatOrder(order) {
//   return `🆔 Buyurtma ID: ${order.id}
// 👤 Foydalanuvchi: @${order.username || 'noma`lum'}
// 📦 Mahsulot: ${order.product_type}
// 🔢 Miqdor: ${order.quantity}
// 📍 Manzil: ${order.address}
// 📞 Telefon: ${order.phone}
// 🕒 Vaqt: ${order.created_at}
// 🟢 Holati: ${order.status}`;
// }

// // Adminlarga bildirishnoma yuborish
// async function notifyAdmins(orderId) {
//   try {
//     const order = await new Promise((resolve, reject) => {
//       db.get("SELECT * FROM orders WHERE id = ?", [orderId], (err, row) => {
//         if (err) reject(err);
//         else resolve(row);
//       });
//     });
    
//     if (!order) return;
    
//     const message = `🆕 Yangi buyurtma!\n\n${formatOrder(order)}`;
    
//     // Adminlarga xabar yuborish
//     admins.forEach(adminId => {
//       bot.telegram.sendMessage(adminId, message, {
//         reply_markup: {
//           inline_keyboard: [
//             [
//               { text: '✅ Qabul qilish', callback_data: `accept_${orderId}` },
//               { text: '❌ Rad etish', callback_data: `reject_${orderId}` }
//             ]
//           ]
//         }
//       });
//     });
    
//     // Agar admin gruppa bo'lsa
//     if (adminGroup) {
//       bot.telegram.sendMessage(adminGroup, message, {
//         reply_markup: {
//           inline_keyboard: [
//             [
//               { text: '✅ Qabul qilish', callback_data: `accept_${orderId}` },
//               { text: '❌ Rad etish', callback_data: `reject_${orderId}` }
//             ]
//           ]
//         }
//       });
//     }
    
//   } catch (err) {
//     console.error('Bildirishnoma yuborishda xato:', err);
//   }
// }

// // Start komandasi
// bot.start((ctx) => {
//   ctx.reply(`Assalomu alaykum! Zomin Gumma buyurtma botiga xush kelibsiz!`, {
//     reply_markup: {
//       keyboard: [
//         ['🛍 Buyurtma berish'],
//         ['📋 Mening buyurtmalarim'],
//         ['📞 Biz bilan aloqa']
//       ],
//       resize_keyboard: true
//     }
//   });
// });

// // Admin paneli
// bot.command('admin', (ctx) => {
//   if (!admins.includes(ctx.from.id)) {
//     return ctx.reply('⚠️ Sizga ruxsat yo\'q!');
//   }
  
//   ctx.reply('Admin paneli:', {
//     reply_markup: {
//       keyboard: [
//         ['🆕 Yangi buyurtmalar'],
//         ['✅ Tasdiqlanganlar'],
//         ['📊 Statistika'],
//         ['📢 Xabar yuborish'],
//         ['🏠 Asosiy menyu']
//       ],
//       resize_keyboard: true
//     }
//   });
// });

// // ... (oldingi kodlarni qoldiring, faqat contact handlerida notifyAdmins() qo'shildi)

// // Botni ishga tushirish
// bot.launch()
//   .then(() => console.log('Bot ishga tushdi!'))
//   .catch(err => console.error('Xatolik:', err));

// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));








// // Yangi buyurtmalarni ko'rsatish
// bot.hears('🆕 Yangi buyurtmalar', (ctx) => {
//   if (!admins.includes(ctx.from.id)) return;
  
//   db.all("SELECT * FROM orders WHERE status='new'", [], (err, rows) => {
//     if (err) return ctx.reply('Xatolik yuz berdi!');
//     if (rows.length === 0) return ctx.reply('Yangi buyurtmalar mavjud emas');
    
//     rows.forEach(order => {
//       ctx.reply(formatOrder(order), {
//         reply_markup: {
//           inline_keyboard: [
//             [
//               { text: '✅ Qabul qilish', callback_data: `accept_${order.id}` },
//               { text: '❌ Rad etish', callback_data: `reject_${order.id}` }
//             ]
//           ]
//         }
//       });
//     });
//   });
// });

// // Tasdiqlangan buyurtmalar
// bot.hears('✅ Tasdiqlanganlar', (ctx) => {
//   if (!admins.includes(ctx.from.id)) return;
  
//   db.all("SELECT * FROM orders WHERE status='accepted' ORDER BY created_at DESC LIMIT 10", [], (err, rows) => {
//     if (err) return ctx.reply('Xatolik yuz berdi!');
//     if (rows.length === 0) return ctx.reply('Tasdiqlangan buyurtmalar mavjud emas');
    
//     let message = '✅ Tasdiqlangan buyurtmalar:\n\n';
//     rows.forEach(order => {
//       message += `${formatOrder(order)}\n\n`;
//     });
//     ctx.reply(message);
//   });
// });

// // Xabar yuborish funksiyasi
// bot.hears('📢 Xabar yuborish', async (ctx) => {
//   if (!admins.includes(ctx.from.id)) return;
  
//   ctx.reply('Barcha foydalanuvchilarga yubormoqchi bo\'lgan xabaringizni yuboring:');
  
//   // Keyingi xabarni kutish
//   bot.on('text', async (nextCtx) => {
//     if (nextCtx.from.id !== ctx.from.id) return;
    
//     try {
//       const users = await new Promise((resolve, reject) => {
//         db.all("SELECT DISTINCT user_id FROM orders", [], (err, rows) => {
//           if (err) reject(err);
//           else resolve(rows.map(row => row.user_id));
//         });
//       });
      
//       let success = 0;
//       for (const userId of users) {
//         try {
//           await bot.telegram.sendMessage(userId, nextCtx.message.text);
//           success++;
//         } catch (err) {
//           console.error(`Xabar yuborishda xato (${userId}):`, err);
//         }
//       }
      
//       nextCtx.reply(`Xabar ${success} ta foydalanuvchiga muvaffaqiyatli yuborildi!`);
//     } catch (err) {
//       console.error('Xabar yuborishda xato:', err);
//       nextCtx.reply('Xatolik yuz berdi, qayta urinib ko\'ring!');
//     }
//   });
// });