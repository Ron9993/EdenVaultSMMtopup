
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

// Language translations
const translations = {
  en: {
    welcome: "👋 Welcome to EdenVault SMM Top-up Bot!\n\nPlease select your language:",
    enter_username: "Please enter your EdenVault username to continue:",
    choose_method: "💳 Choose your top-up method:",
    mmk_method: "💵 MMK (KPay/Wave)",
    thb_method: "🇹🇭 THB (Thai Baht)",
    crypto_method: "🪙 Crypto (USDT)",
    enter_mmk_amount: "💰 Enter the MMK amount you want to top up:\n\n💱 Exchange Rate: 1 USD = 4510 MMK\n\nPlease type the amount in MMK:",
    enter_thb_amount: "💰 Enter the THB amount you want to top up:\n\n💱 Exchange Rate: 1 USD = 36 THB\n\nPlease type the amount in THB:",
    enter_usd_amount: "💰 Enter the USD amount you want to top up:\n\nPlease type the amount in USD:",
    invalid_amount: "❌ Please enter a valid number",
    min_amount_error: "❌ Minimum amount is",
    choose_thb_payment: "💳 Choose your THB payment method",
    choose_mmk_payment: "💳 Choose your payment method",
    choose_crypto_payment: "🪙 Choose your crypto payment method",
    promptpay: "💳 PromptPay",
    bank_transfer: "🏦 Bank Transfer",
    kpay: "📱 KPay",
    wave: "🌊 Wave",
    binance: "🏦 Binance",
    usdt_trc20: "₮ USDT TRC20",
    usdt_bep20: "₮ USDT BEP20",
    back: "Back",
    proof_received: "✅ Thank you! Your proof has been sent for review. We'll notify you after approval.",
    processing: "🔄 Your top-up is being processed. Please wait...",
    credited: "✅ Your top-up has been credited! Please check your SMM balance.",
    rejected: "❌ Your top-up was rejected. Please contact support if this is a mistake.",
    error: "❌ Something went wrong. Please try again or use /start to restart.",
    upload_proof: "📸 After payment, upload your screenshot as proof:",
    payment_details: "Payment Details"
  },
  zh: {
    welcome: "👋 欢迎使用EdenVault SMM充值机器人!\n\n请选择您的语言:",
    enter_username: "请输入您的EdenVault用户名以继续:",
    choose_method: "💳 选择您的充值方式:",
    mmk_method: "💵 缅甸币 (KPay/Wave)",
    thb_method: "🇹🇭 泰铢 (Thai Baht)",
    crypto_method: "🪙 加密货币 (USDT)",
    enter_mmk_amount: "💰 输入您想充值的缅甸币金额:\n\n💱 汇率: 1美元 = 4510缅甸币\n\n请输入缅甸币金额:",
    enter_thb_amount: "💰 输入您想充值的泰铢金额:\n\n💱 汇率: 1美元 = 36泰铢\n\n请输入泰铢金额:",
    enter_usd_amount: "💰 输入您想充值的美元金额:\n\n请输入美元金额:",
    invalid_amount: "❌ 请输入有效数字",
    min_amount_error: "❌ 最低金额为",
    choose_thb_payment: "💳 选择您的泰铢支付方式",
    choose_mmk_payment: "💳 选择您的支付方式",
    choose_crypto_payment: "🪙 选择您的加密货币支付方式",
    promptpay: "💳 PromptPay",
    bank_transfer: "🏦 银行转账",
    kpay: "📱 KPay",
    wave: "🌊 Wave",
    binance: "🏦 币安",
    usdt_trc20: "₮ USDT TRC20",
    usdt_bep20: "₮ USDT BEP20",
    back: "返回",
    proof_received: "✅ 谢谢！您的付款凭证已发送审核。我们将在批准后通知您。",
    processing: "🔄 您的充值正在处理中。请稍候...",
    credited: "✅ 您的充值已到账！请检查您的SMM余额。",
    rejected: "❌ 您的充值被拒绝。如有疑问请联系客服。",
    error: "❌ 出现错误。请重试或使用 /start 重新开始。",
    upload_proof: "📸 付款后，请上传您的截图作为凭证:",
    payment_details: "付款详情"
  },
  my: {
    welcome: "👋 EdenVault SMM Top-up Bot မှ ကြိုဆိုပါတယ်!\n\nကျေးဇူးပြု၍ သင့်ဘာသာစကားကို ရွေးချယ်ပါ:",
    enter_username: "ကျေးဇူးပြု၍ သင့် EdenVault အမည်ကို ရိုက်ထည့်ပါ:",
    choose_method: "💳 သင့်အတွက် ငွေဖြည့်နည်းလမ်းကို ရွေးချယ်ပါ:",
    mmk_method: "💵 ကျပ် (KPay/Wave)",
    thb_method: "🇹🇭 ဘတ် (Thai Baht)",
    crypto_method: "🪙 Crypto (USDT)",
    enter_mmk_amount: "💰 သင်ဖြည့်လိုသော ကျပ်ပမာဏကို ရိုက်ထည့်ပါ:\n\n💱 လဲလှယ်နှုန်း: 1 USD = 4510 MMK\n\nကျေးဇူးပြု၍ ကျပ်ပမာဏ ရိုက်ထည့်ပါ:",
    enter_thb_amount: "💰 သင်ဖြည့်လိုသော ဘတ်ပမာဏကို ရိုက်ထည့်ပါ:\n\n💱 လဲလှယ်နှုန်း: 1 USD = 36 THB\n\nကျေးဇူးပြု၍ ဘတ်ပမာဏ ရိုက်ထည့်ပါ:",
    enter_usd_amount: "💰 သင်ဖြည့်လိုသော ဒေါ်လာပမာဏကို ရိုက်ထည့်ပါ:\n\nကျေးဇူးပြု၍ ဒေါ်လာပမာဏ ရိုက်ထည့်ပါ:",
    invalid_amount: "❌ ကျေးဇူးပြု၍ မှန်ကန်သော ဂဏန်းကို ရိုက်ထည့်ပါ",
    min_amount_error: "❌ အနည်းဆုံးပမာဏမှာ",
    choose_thb_payment: "💳 သင့်ဘတ် ငွေပေးချေမှုနည်းလမ်းကို ရွေးချယ်ပါ",
    choose_mmk_payment: "💳 သင့်ငွေပေးချေမှုနည်းလမ်းကို ရွေးချယ်ပါ",
    choose_crypto_payment: "🪙 သင့် crypto ငွေပေးချေမှုနည်းလမ်းကို ရွေးချယ်ပါ",
    promptpay: "💳 PromptPay",
    bank_transfer: "🏦 ဘဏ်လွှဲ",
    kpay: "📱 KPay",
    wave: "🌊 Wave",
    binance: "🏦 Binance",
    usdt_trc20: "₮ USDT TRC20",
    usdt_bep20: "₮ USDT BEP20",
    back: "နောက်သို့",
    proof_received: "✅ ကျေးဇူးတင်ပါတယ်! သင့်ငွေပေးချေမှုအထောက်အထားကို စစ်ဆေးရန် ပို့လိုက်ပါပြီ။ အတည်ပြုပြီးနောက် အကြောင်းကြားပါမည်။",
    processing: "🔄 သင့်ငွေဖြည့်မှုကို လုပ်ဆောင်နေပါတယ်။ ကျေးဇူးပြု၍ စောင့်ပါ...",
    credited: "✅ သင့်ငွေဖြည့်မှု အောင်မြင်ပါပြီ! သင့် SMM လက်ကျန်ငွေကို စစ်ဆေးပါ။",
    rejected: "❌ သင့်ငွေဖြည့်မှုကို ငြင်းပယ်ခံရပါတယ်။ မှားယွင်းမှုရှိပါက support နှင့် ဆက်သွယ်ပါ။",
    error: "❌ တစ်ခုခု မှားယွင်းနေပါတယ်။ ပြန်လည်ကြိုးစားပါ သို့မဟုတ် /start သုံး၍ ပြန်စပါ။",
    upload_proof: "📸 ငွေပေးချေမှုပြီးနောက်၊ သင့်ရုပ်ပုံကို အထောက်အထားအဖြစ် upload လုပ်ပါ:",
    payment_details: "ငွေပေးချေမှု အသေးစိတ်"
  }
};

// Helper function to get text in user's language
function getText(userId, key, ...args) {
  const userLang = userStates[userId]?.language || 'en';
  const text = translations[userLang][key] || translations['en'][key];
  if (args.length > 0) {
    return text + ' ' + args.join(' ');
  }
  return text;
}

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
    userStates[chatId] = { 
      step: 'select_language',
      language: 'en' // Default language
    };
    await bot.sendMessage(chatId, "👋 Welcome to EdenVault SMM Top-up Bot!\n欢迎使用EdenVault SMM充值机器人!\nEdenVault SMM Top-up Bot မှ ကြိုဆိုပါတယ်!\n\nPlease select your language / 请选择语言 / ဘာသာစကားရွေးချယ်ပါ:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇺🇸 English', callback_data: 'lang_en' }],
          [{ text: '🇨🇳 中文', callback_data: 'lang_zh' }],
          [{ text: '🇲🇲 မြန်မာ', callback_data: 'lang_my' }]
        ]
      }
    });
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

      await bot.sendMessage(chatId, getText(chatId, 'choose_method'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'mmk_method'), callback_data: 'method_mmk' }],
            [{ text: getText(chatId, 'thb_method'), callback_data: 'method_thb' }],
            [{ text: getText(chatId, 'crypto_method'), callback_data: 'method_crypto' }]
          ]
        },
      });
    } else if (state.step === 'enter_amount') {
      const amount = parseInt(msg.text);

      if (isNaN(amount) || amount <= 0) {
        const currency = state.method === 'THB' ? 'THB' : (state.method === 'MMK' ? 'MMK' : 'USD');
        await bot.sendMessage(chatId, `${getText(chatId, 'invalid_amount')} (${currency}):`);
        return;
      }

      let minAmount, currency, rate, usd;

      if (state.method === 'THB') {
        minAmount = 50;
        currency = 'THB';
        rate = THB_RATE;

        if (amount < minAmount) {
          await bot.sendMessage(chatId, `${getText(chatId, 'min_amount_error')} ${minAmount} THB. ${getText(chatId, 'enter_thb_amount')}`);
          return;
        }

        usd = (amount / rate).toFixed(2);
        state.thb = amount;
        state.usd = usd;
        state.step = 'select_thb_payment';

        await bot.sendMessage(chatId, `${getText(chatId, 'choose_thb_payment')} ${amount} THB:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: getText(chatId, 'promptpay'), callback_data: 'thb_promptpay' }],
              [{ text: getText(chatId, 'bank_transfer'), callback_data: 'thb_bank' }],
              [{ text: getText(chatId, 'back'), callback_data: 'back_to_amount_thb' }]
            ]
          }
        });
      } else if (state.method === 'MMK') {
        minAmount = 1000;
        currency = 'MMK';
        rate = USD_RATE;

        if (amount < minAmount) {
          await bot.sendMessage(chatId, `${getText(chatId, 'min_amount_error')} ${minAmount} MMK. ${getText(chatId, 'enter_mmk_amount')}`);
          return;
        }

        usd = (amount / rate).toFixed(2);
        state.mmk = amount;
        state.usd = usd;
        state.step = 'select_payment_type';

        await bot.sendMessage(chatId, `${getText(chatId, 'choose_mmk_payment')} ${amount} MMK:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: getText(chatId, 'kpay'), callback_data: 'payment_kpay' }],
              [{ text: getText(chatId, 'wave'), callback_data: 'payment_wave' }],
              [{ text: getText(chatId, 'back'), callback_data: 'back_to_amount' }]
            ]
          }
        });
      } else {
        // Crypto method
        minAmount = 1;
        currency = 'USD';
        rate = 1;

        if (amount < minAmount) {
          await bot.sendMessage(chatId, `${getText(chatId, 'min_amount_error')} ${minAmount} USD. ${getText(chatId, 'enter_usd_amount')}`);
          return;
        }

        usd = amount;
        state.usd = usd;
        state.step = 'select_crypto_payment';

        await bot.sendMessage(chatId, `${getText(chatId, 'choose_crypto_payment')} $${usd} USD:`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: getText(chatId, 'binance'), callback_data: 'crypto_binance' }],
              [{ text: getText(chatId, 'usdt_trc20'), callback_data: 'crypto_usdt_trc20' }],
              [{ text: getText(chatId, 'usdt_bep20'), callback_data: 'crypto_usdt_bep20' }],
              [{ text: getText(chatId, 'back'), callback_data: 'back_to_amount_crypto' }]
            ]
          }
        });
      }
    }
  } catch (error) {
    console.error('Error in message handler:', error.message);
    await bot.sendMessage(chatId, getText(chatId, 'error'));
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;
  const data = query.data;
  const state = userStates[chatId];

  try {
    if (data.startsWith('lang_')) {
      const lang = data.split('_')[1];
      if (!userStates[chatId]) {
        userStates[chatId] = {};
      }
      userStates[chatId].language = lang;
      userStates[chatId].step = 'get_username';

      await bot.editMessageText(getText(chatId, 'enter_username'), {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'method_mmk') {
      state.method = 'MMK';
      state.step = 'enter_amount';

      await bot.editMessageText(getText(chatId, 'enter_mmk_amount'), {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'method_thb') {
      state.method = 'THB';
      state.step = 'enter_amount';

      await bot.editMessageText(getText(chatId, 'enter_thb_amount'), {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'method_crypto') {
      state.method = 'Crypto';
      state.step = 'enter_amount';

      await bot.editMessageText(getText(chatId, 'enter_usd_amount'), {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'back_to_method') {
      state.step = 'select_method';
      await bot.editMessageText(getText(chatId, 'choose_method'), {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'mmk_method'), callback_data: 'method_mmk' }],
            [{ text: getText(chatId, 'thb_method'), callback_data: 'method_thb' }],
            [{ text: getText(chatId, 'crypto_method'), callback_data: 'method_crypto' }]
          ]
        },
      });
    } else if (data === 'back_to_amount') {
      state.step = 'enter_amount';
      await bot.editMessageText(getText(chatId, 'enter_mmk_amount'), {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'payment_kpay') {
      state.paymentType = 'KPay';
      state.step = 'await_proof';

      await bot.editMessageText(`💳 KPay ${getText(chatId, 'payment_details')}\n\n💰 ${getText(chatId, 'choose_method') === getText(chatId, 'choose_method') ? 'Amount' : 'ပမာဏ'}: ${state.mmk} MMK\n💲 USD: $${state.usd}\n\n📱 Please send to:\n🏷️ Name: EdenVault SMM\n📞 Phone: 09-123-456-789\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'payment_wave') {
      state.paymentType = 'Wave';
      state.step = 'await_proof';

      await bot.editMessageText(`🌊 Wave ${getText(chatId, 'payment_details')}\n\n💰 Amount: ${state.mmk} MMK\n💲 USD: $${state.usd}\n\n📱 Please send to:\n🏷️ Name: EdenVault SMM\n📞 Phone: 09-987-654-321\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'thb_promptpay') {
      state.paymentType = 'PromptPay';
      state.step = 'await_proof';

      await bot.editMessageText(`💳 PromptPay ${getText(chatId, 'payment_details')}\n\n💰 Amount: ${state.thb} THB\n💲 USD: $${state.usd}\n\n📱 Please send to:\n🏷️ Name: EdenVault SMM\n📞 PromptPay ID: 0123456789\n🏦 Bank: Kasikorn Bank\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'thb_bank') {
      state.paymentType = 'Bank Transfer';
      state.step = 'await_proof';

      await bot.editMessageText(`🏦 ${getText(chatId, 'bank_transfer')} ${getText(chatId, 'payment_details')}\n\n💰 Amount: ${state.thb} THB\n💲 USD: $${state.usd}\n\n📱 Please send to:\n🏷️ Name: EdenVault SMM\n🏦 Bank: Kasikorn Bank\n🔢 Account: 123-4-56789-0\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'back_to_amount_thb') {
      state.step = 'enter_amount';
      await bot.editMessageText(getText(chatId, 'enter_thb_amount'), {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'back_to_amount_crypto') {
      state.step = 'enter_amount';
      await bot.editMessageText(getText(chatId, 'enter_usd_amount'), {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }]
          ]
        },
      });
    } else if (data === 'crypto_binance') {
      state.paymentType = 'Binance';
      state.step = 'await_proof';

      await bot.editMessageText(`🏦 ${getText(chatId, 'binance')} ${getText(chatId, 'payment_details')}\n\n💰 Amount: $${state.usd} USD\n\n📱 Please send to:\n🏷️ Binance ID: EdenVaultSMM\n📧 Email: payments@edenvault.com\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'crypto_usdt_trc20') {
      state.paymentType = 'USDT TRC20';
      state.step = 'await_proof';

      await bot.editMessageText(`₮ ${getText(chatId, 'usdt_trc20')} ${getText(chatId, 'payment_details')}\n\n💰 Amount: $${state.usd} USD\n\n📱 Please send to:\n🔗 TRC20 Address:\nTXYZ123ABC456DEF789GHI012JKL345MNO678\n\n⚠️ Only send USDT on TRC20 network!\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'crypto_usdt_bep20') {
      state.paymentType = 'USDT BEP20';
      state.step = 'await_proof';

      await bot.editMessageText(`₮ ${getText(chatId, 'usdt_bep20')} ${getText(chatId, 'payment_details')}\n\n💰 Amount: $${state.usd} USD\n\n📱 Please send to:\n🔗 BEP20 Address:\n0xABC123DEF456GHI789JKL012MNO345PQR678\n\n⚠️ Only send USDT on BEP20 network!\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data.startsWith('processing_')) {
      const userId = data.split('_')[1];
      const userState = userStates[userId];

      await bot.sendMessage(userId, getText(userId, 'processing'));

      // Update admin message with new buttons
      let amountDisplay, methodDisplay;
      if (userState.method === 'THB') {
        amountDisplay = `🇹🇭 THB: ${userState.thb}`;
        methodDisplay = `${userState.method} (${userState.paymentType})`;
      } else if (userState.method === 'MMK') {
        amountDisplay = `💵 MMK: ${userState.mmk}`;
        methodDisplay = `${userState.method} (${userState.paymentType})`;
      } else {
        amountDisplay = `💲 USD: $${userState.usd}`;
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
      await bot.sendMessage(userId, getText(userId, 'credited'));
      await bot.editMessageCaption('✅ Credited and completed.', {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
      });

      // Clean up user state
      delete userStates[userId];
    } else if (data.startsWith('reject_')) {
      const userId = data.split('_')[1];
      await bot.sendMessage(userId, getText(userId, 'rejected'));
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

    await bot.sendMessage(chatId, getText(chatId, 'proof_received'));

    // Send to admin
    let amountDisplay, methodDisplay;
    if (state.method === 'THB') {
      amountDisplay = `🇹🇭 THB: ${state.thb}`;
      methodDisplay = `${state.method} (${state.paymentType})`;
    } else if (state.method === 'MMK') {
      amountDisplay = `💵 MMK: ${state.mmk}`;
      methodDisplay = `${state.method} (${state.paymentType})`;
    } else {
      amountDisplay = `💲 USD: $${state.usd}`;
      methodDisplay = `${state.method} (${state.paymentType})`;
    }

    await bot.sendPhoto(ADMIN_ID, fileId, {
      caption: `📥 New Top-up Request\n\n👤 Username: ${state.username}\n${amountDisplay}\n💲USD: $${state.usd}\n💳 Method: ${methodDisplay}\n🆔 User: ${chatId}\n🌐 Language: ${state.language}`,
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
    await bot.sendMessage(chatId, getText(chatId, 'error'));
  }
});

// Admin Actions
