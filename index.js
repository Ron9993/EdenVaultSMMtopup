const { Telegraf, Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');
const config = require('./config.json');

const bot = new Telegraf(config.BOT_TOKEN);
const userLang = {};
const userStage = {};
const userOrders = {};
let currentRates = { usdt: "4600", trx: "1300" };

const messages = {
  en: {
    welcome: "🌐 Welcome to NeoXchange!\nPlease choose your language:",
    language_set: "✅ Language set to English.",
    rates: "💱 *Buy Rates (MMK → Crypto)*\n\nUSDT: {usdt} MMK\nTRX: {trx} MMK",
    menu: "Please choose an option:",
    choose_crypto: "💰 Which crypto do you want to buy?",
    enter_usdt_amount: "💸 How many USDT do you want?",
    enter_trx_amount: "💸 How many TRX do you want?",
    result_usdt: (amt, rate) => `✅ You'll pay approximately ${(amt * rate).toLocaleString()} MMK`,
    result_trx: (amt, rate) => `✅ You'll pay approximately ${(amt * rate).toLocaleString()} MMK`,
    payment_details: "💳 Please transfer MMK to:\n\n🔹 KBZPay: Htun Sein 09777888283\n🔹 UABPay: Htun Sein 09666000106",
    ask_proof: "📤 Upload your payment screenshot:",
    thanks_proof: "✅ Proof received! Admin will verify shortly.",
    approved: "✅ Payment approved! Please send your TRC20 wallet address:",
    wallet_received: (w) => `✅ Wallet received: ${w}\nYour crypto will be sent soon.`,
    rejected: "❌ Payment rejected. Please contact support.",
    ask_track: "🔍 Enter Order ID to track:",
    track_result: (id, st, w) => `🆔 Order ID: ${id}\n📦 Status: ${st}\n🏦 Wallet: ${w || 'Not provided yet'}`,
    not_found: "❌ Order not found. Check the ID.",
    current_status: (st) => `🔔 Your order status is now: *${st}*`
  },
  zh: {
    welcome: "🌐 欢迎来到 NeoXchange！\n请选择您的语言：",
    language_set: "✅ 语言已设置为中文。",
    rates: "💱 *购买汇率 (MMK → 加密货币)*\n\nUSDT: {usdt} MMK\nTRX: {trx} MMK",
    menu: "请选择一个选项：",
    choose_crypto: "💰 您想购买哪种加密货币？",
    enter_usdt_amount: "💸 您想要多少 USDT？",
    enter_trx_amount: "💸 您想要多少 TRX？",
    result_usdt: (amt, rate) => `✅ 您需要支付大约 ${(amt * rate).toLocaleString()} MMK`,
    result_trx: (amt, rate) => `✅ 您需要支付大约 ${(amt * rate).toLocaleString()} MMK`,
    payment_details: "💳 请转账 MMK 至：\n\n🔹 KBZPay: Htun Sein 09777888283\n🔹 UABPay: Htun Sein 09666000106",
    ask_proof: "📤 上传您的付款截图：",
    thanks_proof: "✅ 收到付款凭证！管理员将很快验证。",
    approved: "✅ 付款已批准！请发送您的 TRC20 钱包地址：",
    wallet_received: (w) => `✅ 钱包地址已收到：${w}\n您的加密货币将很快发送。`,
    rejected: "❌ 付款被拒绝。请联系客服。",
    ask_track: "🔍 输入订单 ID 进行跟踪：",
    track_result: (id, st, w) => `🆔 订单 ID: ${id}\n📦 状态: ${st}\n🏦 钱包: ${w || '尚未提供'}`,
    not_found: "❌ 未找到订单。请检查 ID。",
    current_status: (st) => `🔔 您的订单状态现在是：*${st}*`
  },
  my: {
    welcome: "🌐 NeoXchange မှ ကြိုဆိုပါတယ်!\nကျေးဇူးပြု၍ သင်၏ဘာသာစကားကို ရွေးချယ်ပါ:",
    language_set: "✅ ဘာသာစကားကို မြန်မာအဖြစ် သတ်မှတ်ပြီးပါပြီ။",
    rates: "💱 *ဝယ်ယူရေး နှုန်းထား (MMK → Crypto)*\n\nUSDT: {usdt} MMK\nTRX: {trx} MMK",
    menu: "ကျေးဇူးပြု၍ ရွေးချယ်မှုတစ်ခု ရွေးပါ:",
    choose_crypto: "💰 မည်သည့် crypto ကို ဝယ်ချင်ပါသလဲ?",
    enter_usdt_amount: "💸 USDT ဘယ်လောက် လိုအပ်ပါသလဲ?",
    enter_trx_amount: "💸 TRX ဘယ်လောက် လိုအပ်ပါသလဲ?",
    result_usdt: (amt, rate) => `✅ သင်သည် ခန့်မှန်းခြေ ${(amt * rate).toLocaleString()} MMK ပေးရမည်`,
    result_trx: (amt, rate) => `✅ သင်သည် ခန့်မှန်းခြေ ${(amt * rate).toLocaleString()} MMK ပေးရမည်`,
    payment_details: "💳 ကျေးဇူးပြု၍ MMK ကို လွှဲပါ:\n\n🔹 KBZPay: Htun Sein 09777888283\n🔹 UABPay: Htun Sein 09666000106",
    ask_proof: "📤 သင်၏ ငွေပေးချေမှု ဓာတ်ပုံကို upload လုပ်ပါ:",
    thanks_proof: "✅ သက်သေထောက်ခံချက် ရရှိပါပြီ! Admin မှ မကြာမီ စစ်ဆေးပါမည်။",
    approved: "✅ ငွေပေးချေမှု အတည်ပြုပါပြီ! သင်၏ TRC20 wallet လိပ်စာကို ပို့ပါ:",
    wallet_received: (w) => `✅ Wallet လိပ်စာ ရရှိပါပြီ: ${w}\nသင်၏ crypto ကို မကြာမီ ပို့ပေးပါမည်။`,
    rejected: "❌ ငွေပေးချေမှု ငြင်းပယ်ခံရပါပြီ။ ကျေးဇူးပြု၍ အကူအညီကို ဆက်သွယ်ပါ။",
    ask_track: "🔍 စစ်ဆေးရန် Order ID ကို ရိုက်ထည့်ပါ:",
    track_result: (id, st, w) => `🆔 Order ID: ${id}\n📦 အခြေအနေ: ${st}\n🏦 Wallet: ${w || 'မသတ်မှတ်ရသေး'}`,
    not_found: "❌ မှာယူမှု မတွေ့ရှိပါ။ ID ကို စစ်ဆေးပါ။",
    current_status: (st) => `🔔 သင်၏ မှာယူမှု အခြေအနေသည် ယခု: *${st}*`
  }
};

function sendMenu(ctx, lang) {
  ctx.reply(messages[lang].menu, Markup.inlineKeyboard([
    [Markup.button.callback("💱 Buy Crypto", "choose_crypto")],
    [Markup.button.callback("📊 Rates", "check_rates")],
    [Markup.button.callback("📤 Upload Proof", "upload_proof")],
    [Markup.button.callback("🔍 Track Order", "track_order")],
    [Markup.button.url("💬 Talk to Support", "https://t.me/Mr305xie")]
  ]));
}

bot.start(ctx => {
  const id = ctx.from.id;
  userLang[id] = 'en';
  ctx.reply(messages['en'].welcome, Markup.inlineKeyboard([
    [Markup.button.callback("🇬🇧 English", "lang_en")],
    [Markup.button.callback("🇨🇳 中文", "lang_zh")],
    [Markup.button.callback("🇲🇲 မြန်မာ", "lang_my")]
  ]));
});

bot.command("language", ctx => {
  const id = ctx.from.id;
  ctx.reply(messages['en'].welcome, Markup.inlineKeyboard([
    [Markup.button.callback("🇬🇧 English", "lang_en")],
    [Markup.button.callback("🇨🇳 中文", "lang_zh")],
    [Markup.button.callback("🇲🇲 မြန်မာ", "lang_my")]
  ]));
});

bot.action(/lang_(.+)/, ctx => {
  const id = ctx.from.id;
  const lang = ctx.match[1];
  userLang[id] = lang;
  ctx.answerCbQuery();
  ctx.editMessageText(messages[lang].language_set);
  sendMenu(ctx, lang);
});

bot.action("check_rates", ctx => {
  const id = ctx.from.id;
  const lang = userLang[id] || 'en';
  const msg = messages[lang].rates
    .replace("{usdt}", currentRates.usdt)
    .replace("{trx}", currentRates.trx);
  ctx.answerCbQuery();
  ctx.replyWithMarkdown(msg);
});

bot.action("choose_crypto", ctx => {
  const id = ctx.from.id;
  const lang = userLang[id] || 'en';
  userStage[id] = null;
  ctx.answerCbQuery();
  ctx.reply(messages[lang].choose_crypto, Markup.inlineKeyboard([
    [Markup.button.callback("💵 USDT", "buy_usdt")],
    [Markup.button.callback("🪙 TRX", "buy_trx")]
  ]));
});

bot.action("buy_usdt", ctx => {
  const id = ctx.from.id;
  const lang = userLang[id] || 'en';
  userStage[id] = "buy_usdt";
  ctx.answerCbQuery();
  ctx.reply(messages[lang].enter_usdt_amount);
});

bot.action("buy_trx", ctx => {
  const id = ctx.from.id;
  const lang = userLang[id] || 'en';
  userStage[id] = "buy_trx";
  ctx.answerCbQuery();
  ctx.reply(messages[lang].enter_trx_amount);
});

bot.action("upload_proof", ctx => {
  const id = ctx.from.id;
  const lang = userLang[id] || 'en';
  userStage[id] = "upload_proof";
  ctx.answerCbQuery();
  ctx.reply(messages[lang].ask_proof);
});

bot.action("track_order", ctx => {
  const id = ctx.from.id;
  const lang = userLang[id] || 'en';
  userStage[id] = "track";
  ctx.answerCbQuery();
  ctx.reply(messages[lang].ask_track);
});

bot.on("photo", async ctx => {
  const id = ctx.from.id;
  const lang = userLang[id] || 'en';
  if(userStage[id] === "upload_proof") {
    const fileId = ctx.message.photo.slice(-1)[0].file_id;
    const orderId = uuidv4().split("-")[0].toUpperCase();
    userOrders[orderId] = {
      user_id: id,
      username: ctx.from.username || "User",
      lang,
      status: "Pending",
      file_id: fileId,
      wallet: null
    };
    await ctx.reply(messages[lang].thanks_proof);
    await bot.telegram.sendPhoto(config.ADMIN_ID, fileId, {
      caption: `📥 New Proof\n🆔 ${orderId}\n👤 @${ctx.from.username || "User"} (ID: ${id})`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Approve", callback_data: `approve_${orderId}` }],
          [{ text: "❌ Reject", callback_data: `reject_${orderId}` }]
        ]
      }
    });
    userStage[id] = null;
  }
});

bot.action(/approve_(.+)/, ctx => {
  const oid = ctx.match[1], o = userOrders[oid];
  if (!o) return;
  o.status = "Approved";
  userStage[o.user_id] = "wallet";
  const lang = o.lang;
  bot.telegram.sendMessage(o.user_id, messages[lang].approved);
  ctx.editMessageCaption(`✅ Approved\n🆔 ${oid}\n👤 @${o.username}`);
  bot.telegram.sendMessage(config.ADMIN_ID, `🛠 Set status for Order ID: ${oid}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "⚙️ Set Processing", callback_data: `status_processing_${oid}` }],
        [{ text: "✅ Set Sent", callback_data: `status_sent_${oid}` }]
      ]
    }
  });
});

bot.action(/reject_(.+)/, ctx => {
  const oid = ctx.match[1], o = userOrders[oid];
  if (!o) return;
  o.status = "Rejected";
  const lang = o.lang;
  bot.telegram.sendMessage(o.user_id, messages[lang].rejected);
  ctx.editMessageCaption(`❌ Rejected\n🆔 ${oid}\n👤 @${o.username}`);
});

bot.action(/status_(processing|sent)_(.+)/, ctx => {
  const status = ctx.match[1];
  const oid = ctx.match[2];
  const o = userOrders[oid];
  if (!o) return;
  o.status = status.charAt(0).toUpperCase() + status.slice(1);
  const lang = o.lang;
  bot.telegram.sendMessage(o.user_id, messages[lang].current_status(o.status), { parse_mode: "Markdown" });
  ctx.answerCbQuery(`Status set to ${o.status}`);
  ctx.editMessageText(`🛠 Status updated to: ${o.status}\n🆔 Order ID: ${oid}`);
});

bot.on("text", ctx => {
  const id = ctx.from.id;
  const lang = userLang[id] || 'en';
  const stage = userStage[id];

  if (stage === "wallet") {
    const w = ctx.message.text.trim();
    const entry = Object.entries(userOrders).find(([_, o]) => o.user_id === id && o.status === "Approved" && !o.wallet);
    if (entry) {
      const [oid, o] = entry;
      o.wallet = w;
      ctx.reply(messages[lang].wallet_received(w));
      ctx.reply(`🆔 Your Order ID: ${oid}`);
      bot.telegram.sendMessage(config.ADMIN_ID, `📬 Wallet Received\n🆔 ${oid}\n👤 @${ctx.from.username || "User"}\n🏦 ${w}`);
    }
    userStage[id] = null;
  }

  else if (stage === "buy_usdt" || stage === "buy_trx") {
    const amt = parseFloat(ctx.message.text.replace(/[^0-9.]/g, ""));
    if (!isNaN(amt)) {
      const rate = stage === "buy_usdt" ? +currentRates.usdt : +currentRates.trx;
      const text = stage === "buy_usdt"
        ? messages[lang].result_usdt(amt, rate)
        : messages[lang].result_trx(amt, rate);
      ctx.reply(text);
      ctx.reply(messages[lang].payment_details, Markup.inlineKeyboard([
        [Markup.button.callback("📤 Upload Proof", "upload_proof")]
      ]));
    }
    userStage[id] = null;
  }

  else if (stage === "track") {
    const oid = ctx.message.text.trim().toUpperCase();
    const o = userOrders[oid];
    if (o) ctx.reply(messages[lang].track_result(oid, o.status, o.wallet));
    else ctx.reply(messages[lang].not_found);
    userStage[id] = null;
  }
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
bot.launch();
console.log("✅ NeoXchange bot running with full features and status updates");
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
