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
const THB_RATE = 36; // THB per USD

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
          inline_keyboard: [
            [{ text: '💵 MMK (KPay/Wave)', callback_data: 'method_mmk' }],
            [{ text: '🇹🇭 THB (Thai Baht)', callback_data: 'method_thb' }],
            [{ text: '🪙 Crypto (USDT TRC20)', callback_data: 'method_crypto' }]
          ]
        },
      });
    } else if (state.step === 'enter_amount') {
      const amount = parseInt(msg.text);
      
      if (isNaN(amount) || amount <= 0) {
        const currency = state.method === 'THB' ? 'THB' : 'MMK';
        await bot.sendMessage(chatId, `❌ Please enter a valid number (${currency} amount):`);
        return;
      }

      let minAmount, currency, rate, usd;
      
      if (state.method === 'THB') {
        minAmount = 50;
        currency = 'THB';
        rate = THB_RATE;
        
        if (amount < minAmount) {
          await bot.sendMessage(chatId, `❌ Minimum amount is ${minAmount} THB. Please enter a higher amount:`);
          return;
        }
        
        usd = (amount / rate).toFixed(2);
        state.thb = amount;
        state.usd = usd;
        state.step = 'select_thb_payment';

        await bot.sendMessage(chatId, `💳 Choose your THB payment method for ${amount} THB:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💳 PromptPay', callback_data: 'thb_promptpay' }],
              [{ text: '🏦 Bank Transfer', callback_data: 'thb_bank' }],
              [{ text: 'Back', callback_data: 'back_to_amount_thb' }]
            ]
          }
        });
      } else if (state.method === 'MMK') {
        minAmount = 1000;
        currency = 'MMK';
        rate = USD_RATE;
        
        if (amount < minAmount) {
          await bot.sendMessage(chatId, `❌ Minimum amount is ${minAmount} MMK. Please enter a higher amount:`);
          return;
        }
        
        usd = (amount / rate).toFixed(2);
        state.mmk = amount;
        state.usd = usd;
        state.step = 'select_payment_type';

        await bot.sendMessage(chatId, `💳 Choose your payment method for ${amount} MMK:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📱 KPay', callback_data: 'payment_kpay' }],
              [{ text: '🌊 Wave', callback_data: 'payment_wave' }],
              [{ text: 'Back', callback_data: 'back_to_amount' }]
            ]
          }
        });
      } else {
        // Crypto method
        minAmount = 1000;
        currency = 'MMK';
        rate = USD_RATE;
        
        if (amount < minAmount) {
          await bot.sendMessage(chatId, `❌ Minimum amount is ${minAmount} MMK. Please enter a higher amount:`);
          return;
        }
        
        usd = (amount / rate).toFixed(2);
        state.mmk = amount;
        state.usd = usd;
        state.step = 'select_crypto_payment';

        await bot.sendMessage(chatId, `🪙 Choose your crypto payment method for $${usd} USD:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏦 Binance', callback_data: 'crypto_binance' }],
              [{ text: '₮ USDT TRC20', callback_data: 'crypto_usdt_trc20' }],
              [{ text: '₮ USDT BEP20', callback_data: 'crypto_usdt_bep20' }],
              [{ text: '⚡ TRX', callback_data: 'crypto_trx' }],
              [{ text: 'Back', callback_data: 'back_to_amount_crypto' }]
            ]
          }
        });
      }
    }
  } catch (error) {
    console.error('Error in message handler:', error.message);
    await bot.sendMessage(chatId, "❌ Something went wrong. Please try again or use /start to restart.");
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;
  const data = query.data;
  const state = userStates[chatId];

  try {
    if (data === 'method_mmk') {
      state.method = 'MMK';
      state.step = 'enter_amount';

      await bot.editMessageText(`💰 Enter the MMK amount you want to top up:\n\n💱 Exchange Rate: 1 USD = ${USD_RATE} MMK\n\nPlease type the amount in MMK:`, {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Back', callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'method_thb') {
      state.method = 'THB';
      state.step = 'enter_amount';

      await bot.editMessageText(`💰 Enter the THB amount you want to top up:\n\n💱 Exchange Rate: 1 USD = ${THB_RATE} THB\n\nPlease type the amount in THB:`, {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Back', callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'method_crypto') {
      state.method = 'Crypto';
      state.step = 'enter_amount';

      await bot.editMessageText(`💰 Enter the MMK amount you want to top up:\n\n💱 Exchange Rate: 1 USD = ${USD_RATE} MMK\n\nPlease type the amount in MMK:`, {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Back', callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'back_to_method') {
      state.step = 'select_method';
      await bot.editMessageText("💳 Choose your top-up method:", {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '💵 MMK (KPay/Wave)', callback_data: 'method_mmk' }],
            [{ text: '🇹🇭 THB (Thai Baht)', callback_data: 'method_thb' }],
            [{ text: '🪙 Crypto (USDT TRC20)', callback_data: 'method_crypto' }]
          ]
        },
      });
    } else if (data === 'back_to_amount') {
      state.step = 'enter_amount';
      await bot.editMessageText(`💰 Enter the MMK amount you want to top up:\n\n💱 Exchange Rate: 1 USD = ${USD_RATE} MMK\n\nPlease type the amount in MMK:`, {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Back', callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'payment_kpay') {
      state.paymentType = 'KPay';
      state.step = 'await_proof';
      
      await bot.editMessageText(`💳 KPay Payment Details\n\n💰 Amount: ${state.mmk} MMK\n💲 Estimated: $${state.usd} USD\n\n📱 Please send to:\n🏷️ Name: EdenVault SMM\n📞 Phone: 09-123-456-789\n\n📸 After payment, upload your screenshot as proof:`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'payment_wave') {
      state.paymentType = 'Wave';
      state.step = 'await_proof';
      
      await bot.editMessageText(`🌊 Wave Payment Details\n\n💰 Amount: ${state.mmk} MMK\n💲 Estimated: $${state.usd} USD\n\n📱 Please send to:\n🏷️ Name: EdenVault SMM\n📞 Phone: 09-987-654-321\n\n📸 After payment, upload your screenshot as proof:`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'thb_promptpay') {
      state.paymentType = 'PromptPay';
      state.step = 'await_proof';
      
      await bot.editMessageText(`💳 PromptPay Payment Details\n\n💰 Amount: ${state.thb} THB\n💲 Estimated: $${state.usd} USD\n\n📱 Please send to:\n🏷️ Name: EdenVault SMM\n📞 PromptPay ID: 0123456789\n🏦 Bank: Kasikorn Bank\n\n📸 After payment, upload your screenshot as proof:`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'thb_bank') {
      state.paymentType = 'Bank Transfer';
      state.step = 'await_proof';
      
      await bot.editMessageText(`🏦 Bank Transfer Details\n\n💰 Amount: ${state.thb} THB\n💲 Estimated: $${state.usd} USD\n\n📱 Please send to:\n🏷️ Name: EdenVault SMM\n🏦 Bank: Kasikorn Bank\n🔢 Account: 123-4-56789-0\n\n📸 After payment, upload your screenshot as proof:`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'back_to_amount_thb') {
      state.step = 'enter_amount';
      await bot.editMessageText(`💰 Enter the THB amount you want to top up:\n\n💱 Exchange Rate: 1 USD = ${THB_RATE} THB\n\nPlease type the amount in THB:`, {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Back', callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'back_to_amount_crypto') {
      state.step = 'enter_amount';
      await bot.editMessageText(`💰 Enter the MMK amount you want to top up:\n\n💱 Exchange Rate: 1 USD = ${USD_RATE} MMK\n\nPlease type the amount in MMK:`, {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Back', callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'crypto_binance') {
      state.paymentType = 'Binance';
      state.step = 'await_proof';
      
      await bot.editMessageText(`🏦 Binance Payment Details\n\n💰 Amount: $${state.usd} USD\n\n📱 Please send to:\n🏷️ Binance ID: EdenVaultSMM\n📧 Email: payments@edenvault.com\n\n📸 After payment, upload your screenshot as proof:`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'crypto_usdt_trc20') {
      state.paymentType = 'USDT TRC20';
      state.step = 'await_proof';
      
      await bot.editMessageText(`₮ USDT TRC20 Payment Details\n\n💰 Amount: $${state.usd} USD\n\n📱 Please send to:\n🔗 TRC20 Address:\nTXYZ123ABC456DEF789GHI012JKL345MNO678\n\n⚠️ Only send USDT on TRC20 network!\n\n📸 After payment, upload your screenshot as proof:`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'crypto_usdt_bep20') {
      state.paymentType = 'USDT BEP20';
      state.step = 'await_proof';
      
      await bot.editMessageText(`₮ USDT BEP20 Payment Details\n\n💰 Amount: $${state.usd} USD\n\n📱 Please send to:\n🔗 BEP20 Address:\n0xABC123DEF456GHI789JKL012MNO345PQR678\n\n⚠️ Only send USDT on BEP20 network!\n\n📸 After payment, upload your screenshot as proof:`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'crypto_trx') {
      state.paymentType = 'TRX';
      state.step = 'await_proof';
      
      const trxAmount = (parseFloat(state.usd) * 15).toFixed(2); // Assuming 1 USD = 15 TRX
      await bot.editMessageText(`⚡ TRX Payment Details\n\n💰 Amount: ${trxAmount} TRX (≈$${state.usd} USD)\n\n📱 Please send to:\n🔗 TRX Address:\nTRX123ABC456DEF789GHI012JKL345MNO678\n\n📸 After payment, upload your screenshot as proof:`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data.startsWith('processing_')) {
      const userId = data.split('_')[1];
      const userState = userStates[userId];
      
      await bot.sendMessage(userId, "🔄 Your top-up is being processed. Please wait...");
      
      // Update admin message with new buttons
      let amountDisplay, methodDisplay;
      if (userState.method === 'THB') {
        amountDisplay = `🇹🇭 THB: ${userState.thb}`;
        methodDisplay = `${userState.method} (${userState.paymentType})`;
      } else if (userState.method === 'MMK') {
        amountDisplay = `💵 MMK: ${userState.mmk}`;
        methodDisplay = `${userState.method} (${userState.paymentType})`;
      } else {
        amountDisplay = `💵 MMK: ${userState.mmk}`;
        methodDisplay = `${userState.method} (${userState.paymentType})`;
      }
      
      await bot.editMessageCaption(`🔄 PROCESSING\n\n👤 Username: ${userState.username}\n${amountDisplay}\n💲USD: $${userState.usd}\n💳 Method: ${methodDisplay}\n🆔 User: ${userId}`, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Credited', callback_data: `credited_${userId}` },
              { text: '❌ Reject', callback_data: `reject_${userId}` },
            ],
          ],
        },
      });
    } else if (data.startsWith('credited_')) {
      const userId = data.split('_')[1];
      await bot.sendMessage(userId, "✅ Your top-up has been credited! Please check your SMM balance.");
      await bot.editMessageCaption('✅ Credited and completed.', {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
      });

      // Clean up user state
      delete userStates[userId];
    } else if (data.startsWith('reject_')) {
      const userId = data.split('_')[1];
      await bot.sendMessage(userId, "❌ Your top-up was rejected. Please contact support if this is a mistake.");
      await bot.editMessageCaption('❌ Rejected.', {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
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


// Handle Proof Upload
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const state = userStates[chatId];
  if (!state || state.step !== 'await_proof') return;

  try {
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    await bot.sendMessage(chatId, "✅ Thank you! Your proof has been sent for review. We'll notify you after approval.");

    // Send to admin
    let amountDisplay, methodDisplay;
    if (state.method === 'THB') {
      amountDisplay = `🇹🇭 THB: ${state.thb}`;
      methodDisplay = `${state.method} (${state.paymentType})`;
    } else if (state.method === 'MMK') {
      amountDisplay = `💵 MMK: ${state.mmk}`;
      methodDisplay = `${state.method} (${state.paymentType})`;
    } else {
      amountDisplay = `💵 MMK: ${state.mmk}`;
      methodDisplay = `${state.method} (${state.paymentType})`;
    }
    
    await bot.sendPhoto(ADMIN_ID, fileId, {
      caption: `📥 New Top-up Request\n\n👤 Username: ${state.username}\n${amountDisplay}\n💲USD: $${state.usd}\n💳 Method: ${methodDisplay}\n🆔 User: ${chatId}`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Processing', callback_data: `processing_${chatId}` },
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