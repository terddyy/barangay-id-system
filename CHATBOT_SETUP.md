# 🤖 Chatbot Setup Guide - Local Development

## Overview
Your Barangay ID System now includes an AI-powered chatbot using **Google Gemini 2.0 Flash API**. This guide will help you set it up to work locally without deploying.

---

## ✅ Quick Setup (5 Minutes)

### Step 1: Get Your Free Gemini API Key

1. **Visit Google AI Studio**: https://makersuite.google.com/app/apikey
   - Or go to: https://aistudio.google.com/app/apikey

2. **Sign in** with your Google account

3. **Click "Create API Key"**
   - Choose "Create API key in new project" (recommended)
   - Or select an existing Google Cloud project

4. **Copy your API key** (looks like: `AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx`)

> ⚠️ **Important**: Keep your API key secret! Don't share it publicly.

---

### Step 2: Configure the API Key

You have **2 options**:

#### **Option A: Environment Variable (Recommended)**

1. Create a `.env` file in the `backend` folder:
   ```powershell
   cd backend
   New-Item -ItemType File -Name ".env"
   ```

2. Open `.env` and add your API key:
   ```env
   GEMINI_API_KEY=AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
   PORT=3000
   NODE_ENV=development
   ```

3. Save the file

#### **Option B: Direct Code Edit (Quick & Simple)**

1. Open `backend/routes/chatbot.js`

2. Find this line (around line 9):
   ```javascript
   const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCtFQ4j3wTYqWFASJsQMlFz41f1nqFSfbc";
   ```

3. Replace the default key with **your API key**:
   ```javascript
   const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_ACTUAL_API_KEY_HERE";
   ```

4. Save the file

---

### Step 3: Restart the Backend Server

1. **Stop the current server** (press `Ctrl+C` in the terminal running the server)

2. **Start it again**:
   ```powershell
   cd backend
   node server.js
   ```

3. You should see:
   ```
   ✅ API running on http://localhost:3000
   ```

   If you see a warning like:
   ```
   ⚠️ WARNING: Gemini API key not configured properly!
   ```
   Go back to Step 2 and check your API key.

---

### Step 4: Test the Chatbot

1. **Make sure both servers are running**:
   - Backend: `node server.js` (port 3000)
   - Frontend: `python -m http.server 8080` (port 8080)

2. **Open your browser**: http://localhost:8080

3. **Login** to the system

4. **Click the chatbot button** (💬 icon, usually bottom-right)

5. **Try asking**:
   - "Paano mag-apply ng barangay clearance?"
   - "Ano ang requirements para sa ID?"
   - "Anong oras ang office hours?"

6. The chatbot should respond in Filipino! 🎉

---

## 🔍 Troubleshooting

### Error: "Sorry, hindi ko po masagot ang tanong ninyo ngayon"

**Check the backend terminal** for detailed error messages:

#### Problem: `403 Forbidden` or `Invalid API Key`
- **Solution**: Your API key is incorrect or expired
- Get a new key from: https://makersuite.google.com/app/apikey
- Update it in `.env` or `chatbot.js`

#### Problem: `400 Bad Request` 
- **Solution**: The API request format might be wrong
- Make sure you're using Gemini 2.0 Flash (current model)
- Check if the model name is correct in `chatbot.js`

#### Problem: `429 Rate Limit Exceeded`
- **Solution**: You've exceeded the free tier limits
- Wait a few minutes before trying again
- Free tier: 60 requests per minute

#### Problem: `ENOTFOUND` or Connection Error
- **Solution**: Check your internet connection
- Make sure you can access: https://generativelanguage.googleapis.com

### Backend Server Not Starting

```powershell
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# Kill the process if needed (replace PID with actual number)
taskkill /PID <PID> /F

# Start server again
cd backend
node server.js
```

### Chatbot Button Not Appearing

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+F5)
3. Check browser console (F12) for JavaScript errors

---

## 📊 Gemini API Free Tier Limits

**Free Tier (No Credit Card Required)**:
- ✅ 60 requests per minute
- ✅ 1,500 requests per day
- ✅ 1 million tokens per month

This is **more than enough** for local development and testing!

**To check your usage**:
Visit: https://aistudio.google.com/app/apikey

---

## 🎨 Customizing the Chatbot

### Change the Language
Open `backend/routes/chatbot.js` and modify the `SYSTEM_CONTEXT`:

```javascript
const SYSTEM_CONTEXT = `You are a helpful AI assistant for Barangay Holy Spirit.

Your role is to help residents in English language. // Change this

AVAILABLE SERVICES:
...
```

### Change the AI Model
In `chatbot.js`, change the model:

```javascript
// Current model (recommended - fastest and free)
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

// Alternative models:
// gemini-1.5-flash (stable)
// gemini-1.5-pro (smarter but slower)
```

### Adjust AI Personality
In `chatbot.js`, modify `generationConfig`:

```javascript
generationConfig: {
  temperature: 0.7,  // Lower = more focused, Higher = more creative (0-1)
  topK: 40,          // Consider top 40 tokens
  topP: 0.95,        // Nucleus sampling threshold
  maxOutputTokens: 1024, // Max response length
}
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` to Git**:
   ```powershell
   # Add to .gitignore
   echo ".env" >> backend/.gitignore
   ```

2. **Use environment variables** in production

3. **Don't expose API keys** in frontend JavaScript

4. **Monitor your API usage** regularly

---

## 🚀 Production Deployment (Optional)

When deploying to a real server:

1. **Set environment variables** on your hosting platform:
   - Heroku: `heroku config:set GEMINI_API_KEY=your_key`
   - Vercel: Add in project settings
   - Railway/Render: Add in environment settings

2. **Never hardcode** API keys in production

3. **Use HTTPS** for all API calls

4. **Implement rate limiting** to prevent abuse

---

## 📚 Additional Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **Get API Key**: https://makersuite.google.com/app/apikey
- **Pricing**: https://ai.google.dev/pricing (Free tier is generous!)
- **Models Overview**: https://ai.google.dev/models

---

## ✅ Success Checklist

- [ ] Got Gemini API key from Google AI Studio
- [ ] Added API key to `.env` or `chatbot.js`
- [ ] Installed dependencies (`npm install` in backend)
- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 8080
- [ ] Chatbot responds in Filipino
- [ ] No errors in backend terminal
- [ ] Added `.env` to `.gitignore`

---

## 💡 Common Questions

**Q: Is this really free?**  
A: Yes! Google's Gemini API has a generous free tier (60 req/min, 1500 req/day)

**Q: Do I need a credit card?**  
A: No! The free tier doesn't require payment information.

**Q: Can I use this in production?**  
A: Yes, but monitor your usage. You might need to upgrade for high traffic.

**Q: What if I exceed the free tier?**  
A: Requests will fail until the limit resets (per minute/day). Consider upgrading.

**Q: Can I change the AI model?**  
A: Yes! See "Customizing the Chatbot" section above.

---

**Need Help?** Check the terminal logs when you send a message. The detailed error messages will tell you exactly what's wrong! 🐛

---

**Last Updated**: November 12, 2025  
**System**: Barangay Holy Spirit Digital ID E-Services  
**AI Model**: Google Gemini 2.0 Flash Exp
