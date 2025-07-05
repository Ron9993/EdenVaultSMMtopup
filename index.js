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
const USD_RATE = 4490; // MMK per USD
const THB_RATE = 33; // THB per USD

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

// Help Command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const userLang = userStates[chatId]?.language || 'en';

  const helpText = {
    en: `🤖 **EdenVault SMM Bot Commands**

🔧 **Available Commands:**
• /start - Start the bot and select language
• /help - Show this help message
• /balance - Check your account balance
• /history - View your transaction history
• /support - Contact support
• /rates - View current exchange rates

💳 **Payment Methods:**
• MMK (KPay/Wave)
• THB (PromptPay/Bank Transfer)
• Crypto (Binance, USDT TRC20/BEP20)

📞 **Need Help?** Use /support to contact our team!`,
    zh: `🤖 **EdenVault SMM 机器人命令**

🔧 **可用命令:**
• /start - 启动机器人并选择语言
• /help - 显示此帮助信息
• /balance - 查看账户余额
• /history - 查看交易历史
• /support - 联系客服
• /rates - 查看当前汇率

💳 **支付方式:**
• 缅甸币 (KPay/Wave)
• 泰铢 (PromptPay/银行转账)
• 加密货币 (币安, USDT TRC20/BEP20)

📞 **需要帮助?** 使用 /support 联系我们的团队！`,
    my: `🤖 **EdenVault SMM Bot ညွှန်ကြားချက်များ**

🔧 **အသုံးပြုနိုင်သော ညွှန်ကြားချက်များ:**
• /start - Bot ကို စတင်ပြီး ဘာသာစကား ရွေးချယ်ပါ
• /help - ဤအကူအညီကို ပြပါ
• /balance - သင့်အကောင့် လက်ကျန်ငွေကို စစ်ဆေးပါ
• /history - သင့်ငွေလွှဲမှတ်တမ်းကို ကြည့်ပါ
• /support - အကူအညီ ဆက်သွယ်ပါ
• /rates - လက်ရှိလဲလှယ်နှုန်းကို ကြည့်ပါ

💳 **ငွေပေးချေမှုနည်းလမ်းများ:**
• ကျပ် (KPay/Wave)
• ဘတ် (PromptPay/ဘဏ်လွှဲ)
• Crypto (Binance, USDT TRC20/BEP20)

📞 **အကူအညီလိုပါသလား?** /support သုံး၍ ကျွန်ုပ်တို့အဖွဲ့နှင့် ဆက်သွယ်ပါ！`
  };

  try {
    await bot.sendMessage(chatId, helpText[userLang], { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /help command:', error.message);
  }
});

// Balance Command
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const userLang = userStates[chatId]?.language || 'en';

  const balanceText = {
    en: `💰 **Account Balance Check**

To check your EdenVault SMM balance:
1. Login to your EdenVault account
2. Visit: https://edenvault.com/balance
3. Or check in your SMM panel dashboard

🔄 Recent top-ups will reflect within 5-10 minutes after admin approval.

Need help? Use /support`,
    zh: `💰 **账户余额查询**

查看您的 EdenVault SMM 余额:
1. 登录您的 EdenVault 账户
2. 访问: https://edenvault.com/balance
3. 或在您的 SMM 面板仪表板中查看

🔄 最近的充值将在管理员批准后 5-10 分钟内反映。

需要帮助? 使用 /support`,
    my: `💰 **အကောင့်လက်ကျန်ငွေ စစ်ဆေးခြင်း**

သင့် EdenVault SMM လက်ကျန်ငွေကို စစ်ဆေးရန်:
1. သင့် EdenVault အကောင့်သို့ လော့ဂ်အင်ဝင်ပါ
2. ဝင်ရောက်ပါ: https://edenvault.com/balance
3. သို့မဟုတ် သင့် SMM panel dashboard တွင် စစ်ဆေးပါ

🔄 လတ်တလောငွေဖြည့်မှုများသည် admin အတည်ပြုပြီးနောက် ၅-၁၀ မိနစ်အတွင်း ပြသပါမည်။

အကူအညီလိုပါသလား? /support ကိုသုံးပါ`
  };

  try {
    await bot.sendMessage(chatId, balanceText[userLang], { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /balance command:', error.message);
  }
});

// History Command
bot.onText(/\/history/, async (msg) => {
  const chatId = msg.chat.id;
  const userLang = userStates[chatId]?.language || 'en';

  const historyText = {
    en: `📋 **Transaction History**

To view your complete transaction history:
1. Login to your EdenVault account
2. Go to: https://edenvault.com/transactions
3. Filter by date range if needed

📊 You can also view:
• Pending transactions
• Completed top-ups
• Failed transactions
• Refund status

💡 For specific transaction inquiries, use /support with your transaction ID.`,
    zh: `📋 **交易历史**

查看您的完整交易历史:
1. 登录您的 EdenVault 账户
2. 前往: https://edenvault.com/transactions
3. 如需要可按日期范围筛选

📊 您还可以查看:
• 待处理交易
• 已完成充值
• 失败交易
• 退款状态

💡 如有特定交易询问，请使用 /support 并提供您的交易ID。`,
    my: `📋 **ငွေလွှဲမှတ်တမ်း**

သင့်ငွေလွှဲမှတ်တမ်း အပြည့်အစုံကို ကြည့်ရန်:
1. သင့် EdenVault အကောင့်သို့ လော့ဂ်အင်ဝင်ပါ
2. သွားပါ: https://edenvault.com/transactions
3. လိုအပ်ပါက ရက်စွဲအပိုင်းအခြားဖြင့် စစ်ထုတ်ပါ

📊 သင်ကြည့်နိုင်သေးတာများ:
• စောင့်ဆိုင်းနေသောငွေလွှဲများ
• ပြီးစီးသောငွေဖြည့်များ
• မအောင်မြင်သောငွေလွှဲများ
• ငွေပြန်အခြေအနေ

💡 တိကျသောငွေလွှဲမေးခွန်းများအတွက်၊ သင့်ငွေလွှဲ ID နှင့်အတူ /support ကိုသုံးပါ။`
  };

  try {
    await bot.sendMessage(chatId, historyText[userLang], { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /history command:', error.message);
  }
});

// Support Command
bot.onText(/\/support/, async (msg) => {
  const chatId = msg.chat.id;
  const userLang = userStates[chatId]?.language || 'en';

  const supportText = {
    en: `🆘 **Customer Support**

📞 **Contact Methods:**
• Telegram: @EdenVaultSupport
• Email: support@edenvault.com
• Live Chat: https://edenvault.com/support

⏰ **Support Hours:**
• Monday - Friday: 9:00 AM - 6:00 PM (GMT+7)
• Saturday: 10:00 AM - 4:00 PM (GMT+7)  
• Sunday: Emergency support only

🚨 **For Urgent Issues:**
• Failed payments: Include transaction screenshot
• Account problems: Provide your username
• Technical issues: Describe the problem clearly

📧 **Email Template:**
Subject: [URGENT] Your Issue Here
- Username: Your EdenVault username
- Issue: Describe your problem
- Screenshots: Attach relevant images`,
    zh: `🆘 **客户支持**

📞 **联系方式:**
• Telegram: @EdenVaultSupport
• 邮箱: support@edenvault.com
• 在线客服: https://edenvault.com/support

⏰ **支持时间:**
• 周一至周五: 上午9:00 - 下午6:00 (GMT+7)
• 周六: 上午10:00 - 下午4:00 (GMT+7)
• 周日: 仅紧急支持

🚨 **紧急问题:**
• 支付失败: 请包含交易截图
• 账户问题: 请提供您的用户名
• 技术问题: 请清楚描述问题

📧 **邮件模板:**
主题: [紧急] 您的问题描述
- 用户名: 您的 EdenVault 用户名
- 问题: 描述您的问题
- 截图: 附上相关图片`,
    my: `🆘 **ဖောက်သည်အကူအညီ**

📞 **ဆက်သွယ်နည်းများ:**
• Telegram: @EdenVaultSupport
• Email: support@edenvault.com
• Live Chat: https://edenvault.com/support

⏰ **အကူအညီချိန်ပိုင်းများ:**
• တနင်္လာ - သောကြာ: နံနက် ၉:၀၀ - ညနေ ၆:၀၀ (GMT+7)
• စနေ: နံနက် ၁၀:၀၀ - ညနေ ၄:၀၀ (GMT+7)
• တနင်္ဂနွေ: အရေးပေါ်အကူအညီသာ

🚨 **အရေးပေါ်ပြဿနာများအတွက်:**
• ငွေပေးမှုမအောင်မြင်ခြင်း: ငွေလွှဲစခရင်ရှော့ထည့်ပါ
• အကောင့်ပြဿနာများ: သင့်အသုံးပြုသူအမည်ပေးပါ
• နည်းပညာပြဿနာများ: ပြဿနာကို ရှင်းလင်းစွာဖော်ပြပါ

📧 **Email ပုံစံ:**
ခေါင်းစဉ်: [အရေးပေါ်] သင့်ပြဿနာဒီမှာ
- အသုံးပြုသူအမည်: သင့် EdenVault အသုံးပြုသူအမည်
- ပြဿနာ: သင့်ပြဿနာကိုဖော်ပြပါ
- ရုပ်ပုံများ: သက်ဆိုင်ရာပုံများတွဲပါ`
  };

  try {
    await bot.sendMessage(chatId, supportText[userLang], { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /support command:', error.message);
  }
});

// Rates Command
bot.onText(/\/rates/, async (msg) => {
  const chatId = msg.chat.id;
  const userLang = userStates[chatId]?.language || 'en';

  const ratesText = {
    en: `💱 **Current Exchange Rates**

🇺🇸 **USD Base Currency**
💵 MMK: 1 USD = ${USD_RATE} MMK
🇹🇭 THB: 1 USD = ${THB_RATE} THB
🪙 USDT: 1 USD = 1 USDT

📊 **Minimum Amounts:**
• MMK: 1,000 MMK minimum
• THB: 50 THB minimum  
• USDT: 1 USD minimum

⚠️ **Note:** Rates are updated regularly and may vary slightly during processing.

🔄 Last updated: ${new Date().toLocaleDateString()}`,
    zh: `💱 **当前汇率**

🇺🇸 **美元基准货币**
💵 缅甸币: 1美元 = ${USD_RATE} 缅甸币
🇹🇭 泰铢: 1美元 = ${THB_RATE} 泰铢
🪙 USDT: 1美元 = 1 USDT

📊 **最低金额:**
• 缅甸币: 最低 1,000 缅甸币
• 泰铢: 最低 50 泰铢
• USDT: 最低 1 美元

⚠️ **注意:** 汇率定期更新，处理过程中可能略有变化。

🔄 最后更新: ${new Date().toLocaleDateString()}`,
    my: `💱 **လက်ရှိလဲလှယ်နှုန်းများ**

🇺🇸 **ဒေါ်လာ အခြေခံငွေကြေး**
💵 ကျပ်: ၁ ဒေါ်လာ = ${USD_RATE} ကျပ်
🇹🇭 ဘတ်: ၁ ဒေါ်လာ = ${THB_RATE} ဘတ်
🪙 USDT: ၁ ဒေါ်လာ = ၁ USDT

📊 **အနည်းဆုံးပမာဏများ:**
• ကျပ်: အနည်းဆုံး ၁,၀၀၀ ကျပ်
• ဘတ်: အနည်းဆုံး ၅၀ ဘတ်
• USDT: အနည်းဆုံး ၁ ဒေါ်လာ

⚠️ **မှတ်ချက်:** နှုန်းများကို ပုံမှန်အပ်ဒိတ်လုပ်ပြီး လုပ်ဆောင်နေစဉ်အတွင်း အနည်းငယ်ကွဲပြားနိုင်ပါသည်။

🔄 နောက်ဆုံးအပ်ဒိတ်: ${new Date().toLocaleDateString()}`
  };

  try {
    await bot.sendMessage(chatId, ratesText[userLang], { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /rates command:', error.message);
  }
});

// Admin Stats Command (only for admin)
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;

  if (chatId.toString() !== ADMIN_ID) {
    return bot.sendMessage(chatId, "❌ You don't have permission to use this command.");
  }

  try {
    const totalUsers = Object.keys(userStates).length;
    const activeUsers = Object.values(userStates).filter(state => state.step && state.step !== 'waiting_admin').length;
    const pendingRequests = Object.values(userStates).filter(state => state.step === 'waiting_admin').length;

    const statsText = `📊 **Bot Statistics**

👥 **Users:**
• Total users: ${totalUsers}
• Active sessions: ${activeUsers}
• Pending requests: ${pendingRequests}

⚡ **System:**
• Bot uptime: ${process.uptime().toFixed(0)} seconds
• Memory usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Node version: ${process.version}

🔄 **Last restart:** ${new Date().toLocaleString()}`;

    await bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /stats command:', error.message);
  }
});

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
          [{ text: '🇲🇲 မြန်မာ', callback_data: 'lang_my' }],
          [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
            [{ text: getText(chatId, 'crypto_method'), callback_data: 'method_crypto' }],
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
              [{ text: getText(chatId, 'back'), callback_data: 'back_to_amount_thb' }],
              [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
              [{ text: getText(chatId, 'back'), callback_data: 'back_to_amount' }],
              [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
              [{ text: getText(chatId, 'back'), callback_data: 'back_to_amount_crypto' }],
              [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }],
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }],
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }],
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
            [{ text: getText(chatId, 'crypto_method'), callback_data: 'method_crypto' }],
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }],
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
          ]
        },
      });
    } else if (data === 'payment_kpay') {
      state.paymentType = 'KPay';
      state.step = 'await_proof';

      await bot.editMessageText(`💳 KPay ${getText(chatId, 'payment_details')}\n\n💰 ${getText(chatId, 'choose_method') === getText(chatId, 'choose_method') ? 'Amount' : 'ပမာဏ'}: ${state.mmk} MMK\n💲 USD: $${state.usd}\n\n📱 Please send to:\n🏷️ Name: Win Thuzar\n📞 Phone: 09760301586\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'payment_wave') {
      state.paymentType = 'Wave';
      state.step = 'await_proof';

      await bot.editMessageText(`🌊 Wave ${getText(chatId, 'payment_details')}\n\n💰 Amount: ${state.mmk} MMK\n💲 USD: $${state.usd}\n\n📱 Please send to:\n🏷️ Name: Zar Zar Phoo\n📞 Phone: 09760301586\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'thb_promptpay') {
      await bot.editMessageText(`💳 PromptPay ${getText(chatId, 'payment_details')}\n\n⚠️ Currently Unavailable\n\nThis payment method is temporarily unavailable. Please choose another payment option.\n\n${getText(chatId, 'choose_thb_payment')}`, {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'promptpay'), callback_data: 'thb_promptpay' }],
            [{ text: getText(chatId, 'bank_transfer'), callback_data: 'thb_bank' }],
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_amount_thb' }],
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
          ]
        }
      });
    } else if (data === 'thb_bank') {
      await bot.editMessageText(`🏦 ${getText(chatId, 'bank_transfer')} ${getText(chatId, 'payment_details')}\n\n⚠️ Currently Unavailable\n\nThis payment method is temporarily unavailable. Please choose another payment option.\n\n${getText(chatId, 'choose_thb_payment')}`, {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'promptpay'), callback_data: 'thb_promptpay' }],
            [{ text: getText(chatId, 'bank_transfer'), callback_data: 'thb_bank' }],
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_amount_thb' }],
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
          ]
        }
      });
    } else if (data === 'back_to_amount_thb') {
      state.step = 'enter_amount';
      await bot.editMessageText(getText(chatId, 'enter_thb_amount'), {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }],
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
            [{ text: getText(chatId, 'back'), callback_data: 'back_to_method' }],
              [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
          ]
        },
      });
    } else if (data === 'crypto_binance') {
      state.paymentType = 'Binance';
      state.step = 'await_proof';

      await bot.editMessageText(`🏦 ${getText(chatId, 'binance')} ${getText(chatId, 'payment_details')}\n\n💰 Amount: $${state.usd} USD\n\n📱 Please send to:\n🏷️ Nickname: TaronWu\n🆔 Binance ID: 137954961\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'crypto_usdt_trc20') {
      state.paymentType = 'USDT TRC20';
      state.step = 'await_proof';

      await bot.editMessageText(`₮ ${getText(chatId, 'usdt_trc20')} ${getText(chatId, 'payment_details')}\n\n💰 Amount: $${state.usd} USD\n\n📱 Please send to:\n🔗 TRC20 Address:\nTPEzUBycdj9MDcJVNEYSP8TCRjx1gMG7LN\n\n⚠️ Only send USDT on TRC20 network!\n\n${getText(chatId, 'upload_proof')}`, {
        chat_id: chatId,
        message_id: msgId,
      });
    } else if (data === 'crypto_usdt_bep20') {
      state.paymentType = 'USDT BEP20';
      state.step = 'await_proof';

      await bot.editMessageText(`₮ ${getText(chatId, 'usdt_bep20')} ${getText(chatId, 'payment_details')}\n\n💰 Amount: $${state.usd} USD\n\n📱 Please send to:\n🔗 BEP20 Address:\n0xc47964619fbac4c167067e3c4bdc70ff0b4e5c1c\n\n⚠️ Only send USDT on BEP20 network!\n\n${getText(chatId, 'upload_proof')}`, {
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
            [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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
    } else if (data === 'back_to_menu') {
        // Handle the menu callback
        await bot.sendMessage(chatId, "📋 Menu Options:\n\n/start - Restart the bot\n/help - Get help"); // Customize menu options
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
          [{ text: '📋 Menu', callback_data: 'back_to_menu' }]
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