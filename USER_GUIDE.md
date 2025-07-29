# **DeFi Trading Copilot: Step-by-Step User Guide**

## **🚀 Getting Started**

### **Step 1: Deploy & Access the App**
1. **Deploy using Docker** (or access your hosted version)
   ```bash
   docker run -p 3000:80 defi-trading-copilot
   ```
2. **Open your browser** and go to `http://localhost:3000`
3. **You'll see the main dashboard** with a setup prompt

*📸 Screenshot: Main dashboard with "Configure Now" button visible*

---

## **⚙️ Initial Setup (One-Time)**

### **Step 2: Configure Your API Keys**
1. **Click "Configure Now"** or the settings button in the header
2. **The configuration modal opens** with four sections

*📸 Screenshot: Configuration modal showing all API key input fields*

### **Step 3: Add Required Services**
**Add these API keys in order:**

**🗄️ Supabase Database** (Required)
1. Go to [supabase.com](https://supabase.com) and create account
2. Create a new project (free tier is fine)
3. Copy your **Project URL** and **Anon Key** from Settings > API
4. Paste both into the Supabase fields

*📸 Screenshot: Supabase configuration section with fields filled*

**🤖 OpenAI API** (Required)  
1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Create API key (starts with `sk-`)
3. Paste into OpenAI field

*📸 Screenshot: OpenAI configuration section*

**📊 Supra Oracle** (Optional - for automation)
1. Go to [supra.com](https://supra.com) to get API key
2. Paste into Supra field (or leave blank for manual trading)

**🔗 BSC RPC** (Optional - default works fine)
1. Leave default Binance RPC or add premium provider like Alchemy
2. Click **"Save Configuration"**

*📸 Screenshot: All fields filled, green checkmarks showing validation*

---

## **🔗 Connect Your Wallet**

### **Step 4: Connect MetaMask**
1. **Click "Connect Wallet"** in the top right
2. **Select MetaMask** from the options
3. **Approve the connection** in MetaMask popup
4. **Make sure you're on BSC network** (Chain ID: 56)

*📸 Screenshot: Wallet connection options (MetaMask, WalletConnect)*

*📸 Screenshot: Successfully connected wallet showing address and BNB balance*

---

## **📊 Getting Your First AI Trade Idea**

### **Step 5: Generate AI Recommendation**
1. **Check the price widget** showing current BNB price
2. **Click "Get AI Trade Idea"** button
3. **Wait for AI analysis** (takes 5-10 seconds)

*📸 Screenshot: Price widget showing BNB price and "Get AI Trade Idea" button*

*📸 Screenshot: Loading state with spinner while AI generates idea*

### **Step 6: Review AI Suggestion**
**The AI trade card appears with:**
- **Entry Price** - When to buy
- **Take Profit** - When to sell for profit  
- **Stop Loss** - When to sell to limit losses
- **Confidence Score** - AI's confidence (1-10)
- **Reasoning** - Why this trade makes sense
- **Timeframe** - How long to hold

*📸 Screenshot: Complete trade idea card with all details filled*

---

## **🎯 Choosing Your Action**

### **Step 7: Decide What To Do**
**You have 3 options:**

**🚫 Ignore** - Dismiss this trade idea
- Click **"Ignore"** if you don't like the suggestion
- Card disappears, no record kept

**👁️ Monitor** - Paper trade (practice mode)
- Click **"Monitor"** to watch without real money
- Trade gets added to your history for learning

**🚀 Execute** - Real trade with automation
- Click **"Execute"** to trade with real money
- Opens execution modal for final confirmation

*📸 Screenshot: Three action buttons clearly visible on trade card*

---

## **💰 Executing a Real Trade**

### **Step 8: Trade Execution Modal**
**When you click "Execute", a detailed modal opens:**

1. **Review trade details** - Entry, targets, amounts
2. **Set trade amount** - How much USDT to trade (default: $100)
3. **Adjust take profit/stop loss** if desired
4. **Review fees and slippage**

*📸 Screenshot: Trade execution modal showing all parameters*

### **Step 9: Confirm & Execute**
1. **Click "Execute Trade"**
2. **App checks token approvals** automatically
3. **MetaMask prompts for approval** (if needed)
4. **Approve the transaction**
5. **Second MetaMask prompt for the swap**
6. **Approve the swap transaction**

*📸 Screenshot: MetaMask approval popup*

*📸 Screenshot: Trade execution progress with checkmarks*

### **Step 10: Automation Setup**
**After successful swap:**
1. **App automatically sets up automation** with Supra
2. **Take profit and stop loss orders activate**
3. **Success message appears** with transaction hash
4. **Trade appears in your history**

*📸 Screenshot: Success screen showing completed trade and automation status*

---

## **📈 Monitoring Your Trades**

### **Step 11: Track Performance**
1. **Scroll down to "Trade History"** section
2. **See all your trades** with current P&L
3. **Green = profit, Red = loss**
4. **Click transaction hash** to view on BSC scan

*📸 Screenshot: Trade history showing multiple trades with P&L*

### **Step 12: Automation Working**
**Your automated orders work 24/7:**
- **Take profit triggers** when price hits target
- **Stop loss activates** if price drops too much
- **You get notifications** when orders execute
- **No need to watch charts constantly**

*📸 Screenshot: Automation status indicators showing active orders*

---

## **🔄 Daily Workflow**

### **Step 13: Regular Usage**
**Your typical daily routine:**

1. **Open the app** 
2. **Check current BNB price**
3. **Click "Get AI Trade Idea"** 
4. **Review AI suggestion**
5. **Choose: Ignore, Monitor, or Execute**
6. **Let automation handle the rest**

*📸 Screenshot: Clean dashboard ready for daily use*

---

## **⚠️ Tips & Best Practices**

### **Important Notes:**
- **Start small** - Use small amounts while learning
- **Don't ignore stop losses** - They protect your money
- **AI isn't perfect** - Use your judgment too
- **Monitor gas fees** - Higher during busy times
- **Keep some BNB** - For transaction fees

### **Troubleshooting:**
- **Trade not working?** Check BSC network connection
- **No AI ideas?** Verify OpenAI API key
- **Automation failed?** Check Supra configuration
- **Stuck transaction?** Increase gas price in MetaMask

*📸 Screenshot: Settings/help section showing troubleshooting tips*

---

## **🎉 You're Ready to Trade!**

**Congratulations! You now know how to:**
✅ Set up the app with API keys  
✅ Connect your wallet safely  
✅ Get AI-powered trade suggestions  
✅ Execute trades with automation  
✅ Monitor your portfolio performance  

**Start with small amounts and let the AI guide your DeFi trading journey!**

*📸 Screenshot: Dashboard showing successful setup with active trades and positive P&L* 