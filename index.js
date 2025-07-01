require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Validate environment variables
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not found in environment variables');
  process.exit(1);
}

if (!process.env.ADMIN_ID) {
  console.error('❌ ADMIN_ID not found in environment variables');
  process.exit(1);
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = process.env.ADMIN_ID;
const USD_RATE = 4510; // MMK per USD

let userStates = {}; // To track each user's flow

// Bot error handling
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error.message);
});

console.log('✅ EdenVault SMM Top-up Bot is running...');

// Start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    userStates[chatId] = { step: 'get_username' };
    await bot.sendMessage(chatId, "👋 Welcome to EdenVault SMM Top-up Bot!\n\nPlease enter your EdenVault username to continue:");
  } catch (error) {
    console.error('Error in /start command:', error.message);
  }
});

// Collect EdenVault Username
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (!userStates[chatId] || msg.text?.startsWith('/')) return;

  const state = userStates[chatId];

  try {
    if (state.step === 'get_username') {
      state.username = msg.text;
      state.step = 'select_method';

      await bot.sendMessage(chatId, "💳 Choose your top-up method:", {
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
        await bot.sendMessage(chatId, "💰 Choose MMK amount to top up:", {
          reply_markup: {
            keyboard: [['3000', '5000', '10000'], ['Back']],
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        });
      } else if (msg.text.includes('Crypto')) {
        state.method = 'Crypto';
        state.step = 'select_amount';
        await bot.sendMessage(chatId, "💰 Choose Crypto amount (in MMK):", {
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
        await bot.sendMessage(chatId, "💳 Choose your top-up method again:", {
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

      await bot.sendMessage(chatId, `📸 Please upload your payment proof now.\n\nAmount: ${mmk} MMK\nEstimated: $${usd} USD`);
    }
  } catch (error) {
    console.error('Error in message handler:', error.message);
    await bot.sendMessage(chatId, "❌ Something went wrong. Please try again or use /start to restart.");
  }
});

// Handle Proof Upload
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  if (!state || state.step !== 'await_proof') return;

  try {
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    await bot.sendMessage(chatId, "✅ Thank you! Your proof has been sent for review. We'll notify you after approval.");

    // Send to admin
    await bot.sendPhoto(ADMIN_ID, fileId, {
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
  } catch (error) {
    console.error('Error in photo handler:', error.message);
    await bot.sendMessage(chatId, "❌ Failed to process your payment proof. Please try again.");
  }
});

// Admin Actions
bot.on('callback_query', async (query) => {
  const data = query.data;
  const msg = query.message;

  try {
    if (data.startsWith('approve_')) {
      const userId = data.split('_')[1];
      await bot.sendMessage(userId, "✅ Your top-up has been approved! Please check your SMM balance.");
      await bot.editMessageCaption('✅ Approved and credited.', {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      });
      
      // Clean up user state
      delete userStates[userId];
    }

    if (data.startsWith('reject_')) {
      const userId = data.split('_')[1];
      await bot.sendMessage(userId, "❌ Your top-up was rejected. Please contact support if this is a mistake.");
      await bot.editMessageCaption('❌ Rejected.', {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
      });
      
      // Clean up user state
      delete userStates[userId];
    }

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Error in callback query handler:', error.message);
    await bot.answerCallbackQuery(query.id, { text: "❌ Something went wrong" });
  }
});
