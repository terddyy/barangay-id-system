/**
 * AI Chatbot Routes with Rate Limiting & Cost Protection
 * Handles resident queries using Google Gemini 2.5 Flash API
 * 
 * @module routes/chatbot
 * @requires express
 * @requires node-fetch
 */

import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// ============================================
// CONFIGURATION & SAFETY LIMITS
// ============================================

// Gemini API Configuration
// Get your free API key from: https://makersuite.google.com/app/apikey
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAVgxHwtYrgf-hSfNJSIgRG-tTbz5hSv0M";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

// Cost Protection Settings (Prevent Bill Skyrocketing)
const RATE_LIMIT = {
  windowMs: 60 * 1000,          // 1 minute window
  maxRequestsPerIP: 10,          // Max 10 requests per IP per minute (safe limit)
  maxRequestsGlobal: 50,         // Max 50 requests globally per minute
  maxTokensPerRequest: 512,      // Reduce from 1024 to save costs
  maxMessageLength: 300,         // Reduce from 500 to prevent abuse
  maxHistoryLength: 5,           // Limit conversation history to save tokens
  dailyRequestLimit: 1000,       // Max 1000 requests per day (safety net)
};

// Rate limiting storage (in-memory, good for single server)
const rateLimitStore = {
  ipRequests: new Map(),         // Track requests per IP
  globalRequests: [],            // Track all requests
  dailyRequests: 0,              // Track daily total
  lastResetDate: new Date().toDateString(),
};

// Token usage tracking
const usageTracking = {
  totalTokensToday: 0,
  totalRequestsToday: 0,
  maxTokensPerDay: 50000,        // Safety limit: 50k tokens/day
};

// Check if API key is configured
if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
  console.warn("⚠️ WARNING: Gemini API key not configured!");
  console.warn("Get your free API key from: https://makersuite.google.com/app/apikey");
} else {
  console.log("✅ Gemini API configured with rate limiting enabled");
  console.log(`   - Max ${RATE_LIMIT.maxRequestsPerIP} req/min per IP`);
  console.log(`   - Max ${RATE_LIMIT.maxRequestsGlobal} req/min globally`);
  console.log(`   - Max ${RATE_LIMIT.dailyRequestLimit} req/day`);
}

// ============================================
// RATE LIMITING FUNCTIONS
// ============================================

/**
 * Check and enforce rate limits
 */
function checkRateLimit(ip) {
  const now = Date.now();
  
  // Reset daily counter if new day
  const today = new Date().toDateString();
  if (rateLimitStore.lastResetDate !== today) {
    rateLimitStore.dailyRequests = 0;
    rateLimitStore.lastResetDate = today;
    usageTracking.totalTokensToday = 0;
    usageTracking.totalRequestsToday = 0;
    console.log("🔄 Daily rate limits reset");
  }
  
  // Check daily limit
  if (rateLimitStore.dailyRequests >= RATE_LIMIT.dailyRequestLimit) {
    return { 
      allowed: false, 
      reason: `Daily limit reached (${RATE_LIMIT.dailyRequestLimit} requests/day). Try again tomorrow.`,
      retryAfter: getSecondsUntilMidnight()
    };
  }
  
  // Check token usage limit
  if (usageTracking.totalTokensToday >= usageTracking.maxTokensPerDay) {
    return { 
      allowed: false, 
      reason: `Daily token limit reached (${usageTracking.maxTokensPerDay} tokens/day). Try again tomorrow.`,
      retryAfter: getSecondsUntilMidnight()
    };
  }
  
  // Clean up old global requests (older than 1 minute)
  rateLimitStore.globalRequests = rateLimitStore.globalRequests.filter(
    timestamp => now - timestamp < RATE_LIMIT.windowMs
  );
  
  // Check global rate limit
  if (rateLimitStore.globalRequests.length >= RATE_LIMIT.maxRequestsGlobal) {
    return { 
      allowed: false, 
      reason: `System busy. Too many requests. Please wait a moment.`,
      retryAfter: 60
    };
  }
  
  // Clean up old IP requests
  if (rateLimitStore.ipRequests.has(ip)) {
    const ipData = rateLimitStore.ipRequests.get(ip);
    ipData.requests = ipData.requests.filter(
      timestamp => now - timestamp < RATE_LIMIT.windowMs
    );
  }
  
  // Check per-IP rate limit
  const ipData = rateLimitStore.ipRequests.get(ip) || { requests: [] };
  if (ipData.requests.length >= RATE_LIMIT.maxRequestsPerIP) {
    return { 
      allowed: false, 
      reason: `Too many requests. Limit: ${RATE_LIMIT.maxRequestsPerIP} per minute. Please wait.`,
      retryAfter: 60
    };
  }
  
  // All checks passed - record this request
  ipData.requests.push(now);
  rateLimitStore.ipRequests.set(ip, ipData);
  rateLimitStore.globalRequests.push(now);
  rateLimitStore.dailyRequests++;
  
  return { allowed: true };
}

/**
 * Get seconds until midnight (for retry-after header)
 */
function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
}

/**
 * Track token usage
 */
function trackUsage(tokens) {
  usageTracking.totalTokensToday += tokens;
  usageTracking.totalRequestsToday++;
  
  // Log warning if approaching limits
  if (usageTracking.totalTokensToday > usageTracking.maxTokensPerDay * 0.8) {
    console.warn(`⚠️ Warning: 80% of daily token limit used (${usageTracking.totalTokensToday}/${usageTracking.maxTokensPerDay})`);
  }
}

/**
 * System context for the AI chatbot
 * Provides specific knowledge about Barangay Holy Spirit services
 */
const SYSTEM_CONTEXT = `You are a helpful AI assistant for Barangay Holy Spirit Digital ID E-Services System.

Your role is to help residents with information about barangay services in Filipino/Tagalog language.

AVAILABLE SERVICES:
1. Barangay ID - Digital ID card para sa mga residente
2. Barangay Clearance - Certificate para sa employment, business permit, etc.
3. Certificate of Indigency - Para sa medical assistance at legal aid
4. Certificate of Residency - Proof na nakatira sa barangay
5. Business Permit - Para sa small business owners
6. Community Tax Certificate (Cedula) - Annual tax certificate

PAANO MAG-REQUEST NG DOCUMENTS:
1. Mag-login gamit ang ID number sa system
2. Piliin ang document type na kailangan
3. I-fill up ang required information
4. Maghintay ng approval (Pending → Approved → Released)
5. Kunin ang document sa barangay hall

REQUIREMENTS:
- Valid ID
- Proof of residency
- Contact number
- Purpose ng request

OFFICE HOURS:
Monday to Friday: 8:00 AM - 5:00 PM
Location: Barangay Holy Spirit Hall, Quezon City

For complaints or feedback, pwede ring mag-submit online sa system.

IMPORTANT: Always respond in Filipino/Tagalog language. Be polite, helpful, and concise. If asked about something outside barangay services, politely redirect to relevant information.`;

/**
 * POST /api/chatbot/ask
 * Send a question to the AI chatbot and get a response
 * 
 * @route POST /api/chatbot/ask
 * @access Public (no auth required for chatbot)
 * @param {string} req.body.message - User's question
 * @param {array} req.body.history - Optional conversation history
 * @returns {Object} AI response with message and metadata
 */
router.post("/ask", async (req, res) => {
  const { message, history = [] } = req.body;
  
  // Get client IP (works with proxies too)
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   'unknown';

  // ============================================
  // STEP 1: RATE LIMITING (Prevent Abuse)
  // ============================================
  const rateLimitResult = checkRateLimit(clientIP);
  if (!rateLimitResult.allowed) {
    console.warn(`🚫 Rate limit exceeded for IP: ${clientIP} - ${rateLimitResult.reason}`);
    return res.status(429).json({ 
      success: false,
      error: "Sandali lang po. " + rateLimitResult.reason,
      retryAfter: rateLimitResult.retryAfter,
      technicalError: rateLimitResult.reason
    });
  }

  // ============================================
  // STEP 2: INPUT VALIDATION (Prevent Waste)
  // ============================================
  
  // Check if message exists
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ 
      error: "Message is required and must be a non-empty string" 
    });
  }

  // Enforce message length limit (cost protection)
  if (message.length > RATE_LIMIT.maxMessageLength) {
    return res.status(400).json({ 
      error: `Message too long. Maximum ${RATE_LIMIT.maxMessageLength} characters. Current: ${message.length}` 
    });
  }
  
  // Limit conversation history (saves tokens = saves money)
  const limitedHistory = Array.isArray(history) 
    ? history.slice(-RATE_LIMIT.maxHistoryLength) 
    : [];
  
  // Sanitize input (prevent prompt injection)
  const sanitizedMessage = message.trim().substring(0, RATE_LIMIT.maxMessageLength);

  // ============================================
  // STEP 3: API CALL (With Cost Optimization)
  // ============================================
  
  try {
    // Build conversation context (limited to save tokens)
    const conversationContext = limitedHistory.length > 0 
      ? limitedHistory.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n')
      : '';

    // Construct the full prompt (optimized for cost)
    const fullPrompt = `${SYSTEM_CONTEXT}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ''}
User: ${sanitizedMessage}

Please respond in Filipino/Tagalog language, be helpful and concise (max 200 words).`;

    // Prepare Gemini API request with cost optimization
    const geminiRequestBody = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: RATE_LIMIT.maxTokensPerRequest,  // Reduced to save costs
        stopSequences: ["\n\n\n"],  // Stop if response gets too long
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // Call Gemini API with timeout (prevent hanging requests)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiRequestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Gemini API error:", response.status, errorData);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (response.status === 400) {
        errorMessage = 'Invalid request to Gemini API. Check API key or request format.';
      } else if (response.status === 403) {
        errorMessage = 'Gemini API key is invalid or expired. Get a new one from https://makersuite.google.com/app/apikey';
      } else if (response.status === 429) {
        // Check if it's quota exhausted vs rate limit
        if (errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = '⚠️ API key quota exhausted! Get YOUR OWN free key from https://makersuite.google.com/app/apikey and add it to .env or chatbot.js line 17';
        } else {
          errorMessage = 'Rate limit exceeded (60 req/min). Please wait a moment and try again.';
        }
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      throw new Error(`Gemini API Error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();

    // Extract the AI response
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from AI");
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Track token usage (for monitoring and cost control)
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;
    trackUsage(tokensUsed);

    // Return structured response
    res.json({
      success: true,
      message: aiResponse,
      metadata: {
        timestamp: new Date().toISOString(),
        model: "gemini-2.0-flash-exp",
        tokensUsed: tokensUsed,
        dailyUsage: {
          requests: usageTracking.totalRequestsToday,
          tokens: usageTracking.totalTokensToday,
          limit: usageTracking.maxTokensPerDay
        }
      }
    });

    console.log(`✅ Chatbot response (${tokensUsed} tokens) | Daily: ${usageTracking.totalRequestsToday} req, ${usageTracking.totalTokensToday} tokens`);

  } catch (error) {
    console.error("❌ Chatbot error:", error.name, error.message);
    
    // Handle specific error types
    let userMessage = "Sorry, hindi ko po masagot ang tanong ninyo ngayon. Subukan ulit mamaya.";
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      userMessage = "Request timeout. Ang sistema ay masyadong busy. Subukan ulit.";
      statusCode = 504;
    } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      userMessage = "API quota reached. Please contact administrator or try again tomorrow.";
      statusCode = 429;
    }
    
    // User-friendly error response
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      technicalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/chatbot/health
 * Health check endpoint for chatbot service
 * 
 * @route GET /api/chatbot/health
 * @access Public
 * @returns {Object} Service status
 */
router.get("/health", (req, res) => {
  const today = new Date().toDateString();
  const isNewDay = rateLimitStore.lastResetDate !== today;
  
  res.json({
    status: "operational",
    service: "AI Chatbot Assistant with Rate Limiting",
    model: "gemini-2.0-flash-exp",
    timestamp: new Date().toISOString(),
    rateLimits: {
      perIP: `${RATE_LIMIT.maxRequestsPerIP} requests/minute`,
      global: `${RATE_LIMIT.maxRequestsGlobal} requests/minute`,
      daily: `${RATE_LIMIT.dailyRequestLimit} requests/day`,
      tokensPerDay: `${usageTracking.maxTokensPerDay} tokens/day`
    },
    usage: {
      todayRequests: isNewDay ? 0 : usageTracking.totalRequestsToday,
      todayTokens: isNewDay ? 0 : usageTracking.totalTokensToday,
      percentUsed: isNewDay ? 0 : Math.round((usageTracking.totalTokensToday / usageTracking.maxTokensPerDay) * 100)
    }
  });
});

/**
 * GET /api/chatbot/stats
 * Get usage statistics (admin only in production)
 * 
 * @route GET /api/chatbot/stats
 * @access Public (should add auth in production)
 * @returns {Object} Usage statistics
 */
router.get("/stats", (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    limits: RATE_LIMIT,
    usage: {
      dailyRequests: rateLimitStore.dailyRequests,
      totalTokensToday: usageTracking.totalTokensToday,
      totalRequestsToday: usageTracking.totalRequestsToday,
      percentOfDailyLimit: Math.round((rateLimitStore.dailyRequests / RATE_LIMIT.dailyRequestLimit) * 100),
      percentOfTokenLimit: Math.round((usageTracking.totalTokensToday / usageTracking.maxTokensPerDay) * 100),
    },
    activeConnections: {
      trackedIPs: rateLimitStore.ipRequests.size,
      recentRequests: rateLimitStore.globalRequests.length
    },
    lastReset: rateLimitStore.lastResetDate
  });
});

export default router;