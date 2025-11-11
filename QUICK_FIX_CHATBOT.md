# 🚀 Quick Fix: Chatbot Not Working

## The Problem
You're seeing one of these errors:
```
❌ Chatbot error: Error: Sorry, hindi ko po masagot ang tanong ninyo ngayon. Subukan ulit mamaya.
```
OR
```
⚠️ WARNING: Gemini API key not configured properly!
❌ Gemini API error: 429 - You exceeded your current quota
```

**Good News:** The chatbot code is working perfectly! You just need your own FREE API key.

## ✅ Solution (2 Steps)

### Step 1: Get Gemini API Key (2 minutes)

1. Go to: **https://makersuite.google.com/app/apikey**
2. Sign in with Google
3. Click **"Create API Key"**
4. Copy your key (looks like: `AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXx`)

### Step 2: Add Your API Key (1 minute)

**Option A - Quick & Easy:**
1. Open: `backend/routes/chatbot.js`
2. Find line 9:
   ```javascript
   const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCtFQ4j3wTYqWFASJsQMlFz41f1nqFSfbc";
   ```
3. Replace with YOUR key:
   ```javascript
   const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_KEY_HERE";
   ```
4. Save the file

**Option B - Better for Security:**
1. Create file: `backend/.env`
2. Add this line:
   ```
   GEMINI_API_KEY=YOUR_KEY_HERE
   ```
3. Save the file

### Step 3: Restart Backend

```powershell
# Press Ctrl+C to stop current server
# Then restart:
cd backend
node server.js
```

You should see: `✅ API running on http://localhost:3000`

### Step 4: Test Chatbot

1. Refresh your browser (F5)
2. Click chatbot button
3. Ask: "Ano ang requirements para sa barangay clearance?"
4. It should respond in Filipino! 🎉

---

## 🔍 Still Not Working?

Check the backend terminal for error messages:

- **403 Error**: API key is wrong → Get new key from step 1
- **429 Error**: Too many requests → Wait 1 minute
- **Connection Error**: Check internet connection

---

## 📚 Full Guide

For detailed setup, troubleshooting, and customization, see:
**[CHATBOT_SETUP.md](./CHATBOT_SETUP.md)**

---

## ✅ It's Working When:

- ✅ Backend shows: `✅ API running on http://localhost:3000`
- ✅ No warnings about "API key not configured"
- ✅ Chatbot responds in Filipino
- ✅ No errors in terminal when you send messages

---

**That's it!** The chatbot works 100% locally, no deployment needed. 🚀
