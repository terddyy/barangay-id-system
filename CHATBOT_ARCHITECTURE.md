# 🎯 Chatbot Architecture - How It Works Locally

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR LOCAL COMPUTER                          │
│                                                                   │
│  ┌─────────────────┐         ┌──────────────────┐               │
│  │   Browser       │         │  Backend Server  │               │
│  │  (Port 8080)    │────1───▶│   (Port 3000)    │               │
│  │                 │         │                  │               │
│  │  coreA.html     │         │   chatbot.js     │               │
│  │  - User types   │         │   - Receives msg │               │
│  │    question     │         │   - Builds prompt│               │
│  │  - Shows reply  │◀────4───│   - Returns AI   │               │
│  │                 │         │     response     │               │
│  └─────────────────┘         └──────────────────┘               │
│                                       │                          │
└───────────────────────────────────────┼──────────────────────────┘
                                        │
                                        │ 2. HTTP POST
                                        │ with prompt
                                        │
                          ┌─────────────▼─────────────┐
                          │      INTERNET              │
                          └─────────────┬─────────────┘
                                        │
                                        │ 3. API Request
                                        │ (Your API Key)
                                        │
                          ┌─────────────▼─────────────┐
                          │  Google Gemini API        │
                          │  (generativelanguage.     │
                          │   googleapis.com)         │
                          │                           │
                          │  - AI Processing          │
                          │  - Returns Filipino text  │
                          └───────────────────────────┘
```

## 🔄 Request Flow

**Step 1: User Sends Message**
```javascript
// Frontend (coreA.html)
User types: "Ano ang requirements para sa clearance?"
   ↓
ChatbotService.ask(message) called
   ↓
Sends to: http://localhost:3000/api/chatbot/ask
```

**Step 2: Backend Receives & Processes**
```javascript
// Backend (routes/chatbot.js)
Receives message
   ↓
Builds context with barangay information
   ↓
Creates prompt in Filipino
   ↓
Adds conversation history
```

**Step 3: Call Gemini API**
```javascript
// Backend calls Google
POST to: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
   ↓
Headers: { "Content-Type": "application/json" }
   ↓
Auth: ?key=YOUR_API_KEY
   ↓
Body: { contents, generationConfig, safetySettings }
```

**Step 4: Return Response**
```javascript
// Gemini responds in ~1-2 seconds
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "Ang requirements para sa barangay clearance ay..."
      }]
    }
  }]
}
   ↓
Backend extracts text
   ↓
Sends to frontend
   ↓
User sees response
```

## 🔐 Why It's Secure Locally

✅ **No Deployment Needed**
- Everything runs on YOUR computer
- No public server required

✅ **API Key Protected**
- Key stays in backend code (not exposed to browser)
- Users can't see your API key

✅ **Free Tier Generous**
- 60 requests/minute
- 1,500 requests/day
- Perfect for development!

## 💡 What Happens When:

### ✅ SUCCESS (200 OK)
```
User: "Paano mag-apply?"
  ↓
Backend: Sends to Gemini
  ↓
Gemini: Returns Filipino response
  ↓
User: Sees helpful answer ✓
```

### ❌ ERROR - Invalid API Key (403)
```
User: "Paano mag-apply?"
  ↓
Backend: Sends to Gemini
  ↓
Gemini: "Invalid API Key" ✗
  ↓
Backend: Catches error
  ↓
User: "Sorry, hindi ko po masagot..."
  ↓
Terminal: Shows detailed error message
```

### ❌ ERROR - Rate Limit (429)
```
Too many requests (>60/min)
  ↓
Gemini: "Rate limit exceeded" ✗
  ↓
Backend: Catches error
  ↓
User: "Sorry, subukan ulit mamaya..."
  ↓
Solution: Wait 1 minute
```

### ❌ ERROR - No Internet
```
User: "Paano mag-apply?"
  ↓
Backend: Tries to connect
  ↓
Network: Connection failed ✗
  ↓
User: "May problema sa connection..."
```

## 🎯 Components Checklist

| Component | Port | Purpose | Required |
|-----------|------|---------|----------|
| Frontend Server | 8080 | Serves HTML/JS/CSS | ✅ Yes |
| Backend Server | 3000 | API & chatbot logic | ✅ Yes |
| Gemini API | HTTPS | AI processing | ✅ Yes |
| Internet | - | Connect to Gemini | ✅ Yes |
| Database | SQLite | Store residents | ✅ Yes |
| API Key | - | Authenticate with Gemini | ✅ Yes |

## 📊 Data Flow Summary

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Backend  │────▶│  Gemini  │
│ Browser  │     │ Node.js  │     │   API    │
└──────────┘     └──────────┘     └──────────┘
     ▲                 │                 │
     │                 │                 │
     └─────────────────┴─────────────────┘
              Response with AI answer
```

## 🚀 Quick Commands

**Start Backend:**
```powershell
cd backend
node server.js
```

**Start Frontend:**
```powershell
python -m http.server 8080
```

**Test Chatbot:**
```powershell
# In browser console (F12):
ChatbotService.ask("Test message").then(console.log)
```

**Check Logs:**
- Backend: Look at terminal running `node server.js`
- Frontend: Press F12 → Console tab

---

**Remember**: Everything works LOCALLY. No deployment, no cloud hosting needed! 🎉
