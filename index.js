require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = process.env.ADMIN_ID;
const USD_RATE = 4510; // MMK per USD

let userStates = {}; // To track each user's flow

// Start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: 'get_username' };
  bot.sendMessage(chatId, "👋 Welcome to EdenVault SMM Top-up Bot!\n\nPlease enter your EdenVault username to continue:");
});

// Collect EdenVault Username
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (!userStates[chatId] || msg.text.startsWith('/')) return;

  const state = userStates[chatId];

  if (state.step === 'get_username') {
    state.username = msg.text;
    state.step = 'select_method';

    bot.sendMessage(chatId, "💳 Choose your top-up method:", {
      reply_markup: {
        keyboard: [['💵 MMK (KPay/Wave)', '🪙 Crypto (USDT TRC20)']],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  } else if (state.step === 'select_method') {
    if (msg.text.includes('MMK')) {
      state.method = 'MMK';
      state.step = 'select_amount';
      bot.sendMessage(chatId, "💰 Choose MMK amount to top up:", {
        reply_markup: {
          keyboard: [['3000', '5000', '10000'], ['Back']],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
    } else if (msg.text.includes('Crypto')) {
      state.method = 'Crypto';
      state.step = 'select_amount';
      bot.sendMessage(chatId, "💰 Choose Crypto amount (in MMK):", {
        reply_markup: {
          keyboard: [['3000', '5000', '10000'], ['Back']],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
    }
  } else if (state.step === 'select_amount') {
    if (msg.text === 'Back') {
      state.step = 'select_method';
      bot.sendMessage(chatId, "💳 Choose your top-up method again:", {
        reply_markup: {
          keyboard: [['💵 MMK (KPay/Wave)', '🪙 Crypto (USDT TRC20)']],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
      return;
    }

    const mmk = parseInt(msg.text);
    if (isNaN(mmk)) return;

    const usd = (mmk / USD_RATE).toFixed(2);
    state.mmk = mmk;
    state.usd = usd;
    state.step = 'await_proof';

    bot.sendMessage(chatId, `📸 Please upload your payment proof now.\n\nAmount: ${mmk} MMK\nEstimated: $${usd} USD`);
  }
});

// Handle Proof Upload
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  if (!state || state.step !== 'await_proof') return;

  const fileId = msg.photo[msg.photo.length - 1].file_id;

  bot.sendMessage(chatId, "✅ Thank you! Your proof has been sent for review. We'll notify you after approval.");

  // Send to admin
  bot.sendPhoto(ADMIN_ID, fileId, {
    caption: `📥 New Top-up Request\n\n👤 Username: ${state.username}\n💵 MMK: ${state.mmk}\n💲USD: $${state.usd}\n💳 Method: ${state.method}\n🆔 User: ${chatId}`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: `approve_${chatId}` },
          { text: '❌ Reject', callback_data: `reject_${chatId}` },
        ],
      ],
    },
  });

  state.step = 'waiting_admin';
});

// Admin Actions
bot.on('callback_query', (query) => {
  const data = query.data;
  const msg = query.message;

  if (data.startsWith('approve_')) {
    const userId = data.split('_')[1];
    bot.sendMessage(userId, "✅ Your top-up has been approved! Please check your SMM balance.");
    bot.editMessageCaption('✅ Approved and credited.', {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    });
  }

  if (data.startsWith('reject_')) {
    const userId = data.split('_')[1];
    bot.sendMessage(userId, "❌ Your top-up was rejected. Please contact support if this is a mistake.");
    bot.editMessageCaption('❌ Rejected.', {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
    });
  }

  bot.answerCallbackQuery(query.id);
});
