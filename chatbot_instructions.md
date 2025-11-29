# CHATBOT_INSTRUCTIONS.md

## Malloulinova B2B IoT Consulting Chatbot

### Overview
An intelligent, conversion-focused chatbot that qualifies leads, answers IoT consulting questions, and routes visitors to relevant pages. Uses Groq's free API (1,000 requests/day) with a hardcoded FAQ fallback system for reliability.

---

## 1. Core Objectives

- **Lead Qualification**: Capture name, email, company, and project needs
- **Instant Answers**: Handle common IoT consulting questions 24/7
- **Smart Routing**: Direct users to Projects, Articles, or Contact page based on intent
- **Zero Cost**: Leverage Groq's free tier + hardcoded fallbacks
- **High Conversion**: Every conversation leads to a CTA (contact form, project view, consultation booking)

---

## 2. Technical Architecture

### Stack
- **Frontend**: React component `ChatWidget.jsx` with minimize/maximize states
- **Backend**: POST `/api/chat` endpoint (Express + Vercel compatible)
- **AI Provider**: Groq API (free tier: 1,000 requests/day, 6,000 tokens/min)
- **Fallback System**: Hardcoded FAQ matcher when API limit reached or fails
- **Storage**: Supabase table `chat_conversations` for lead tracking

### File Structure
```
/Malloulinova
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ChatWidget.jsx          # Main chat UI component
│       │   └── ChatMessage.jsx         # Individual message bubble
│       └── services/
│           └── chatService.js          # API calls to /api/chat
├── backend/
│   ├── chatbot/
│   │   ├── groqClient.js               # Groq API integration
│   │   ├── faqMatcher.js               # Hardcoded FAQ fallback
│   │   ├── intentDetector.js           # Keyword-based routing logic
│   │   └── systemPrompt.js             # Groq system instructions
│   └── server.js                        # Add /api/chat route
├── api/
│   └── [...path].js                     # Add chat handler for Vercel
└── CHATBOT_INSTRUCTIONS.md (this file)
```

---

## 3. Database Schema

```sql
create table public.chat_conversations (
  id text primary key,
  session_id text not null unique,
  visitor_name text,
  visitor_email text,
  visitor_company text,
  project_type text,
  messages jsonb default '[]'::jsonb not null,
  lead_qualified boolean default false,
  route_suggested text, -- 'contact', 'projects', 'article', null
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  last_message_at timestamptz default now() not null
);

create index idx_chat_session on public.chat_conversations(session_id);
create index idx_chat_qualified on public.chat_conversations(lead_qualified);
create index idx_chat_updated on public.chat_conversations(last_message_at);
```

---

## 4. API Contract

### POST /api/chat

**Request** (application/json):
```json
{
  "sessionId": "string (UUID v4, client-generated on first load)",
  "message": "string (user's message)",
  "context": {
    "currentPage": "home | projects | article | contact",
    "visitorData": {
      "name": "string | null",
      "email": "string | null",
      "company": "string | null"
    }
  }
}
```

**Response**:
```json
{
  "reply": "string (bot response)",
  "suggestions": ["string", "string", "string"], // Quick reply buttons (max 3)
  "routeTo": "contact | projects | article-{id} | null", // Navigation hint
  "leadQualified": boolean,
  "source": "groq | fallback" // For debugging/analytics
}
```

**Error Response** (500):
```json
{
  "reply": "I'm having trouble connecting right now. Please email us at contact@malloulinova.com or call +123-456-7890.",
  "suggestions": ["Contact Us", "View Projects"],
  "source": "error"
}
```

---

## 5. Groq API Integration

### Setup
1. Sign up at https://console.groq.com
2. Generate free API key (no credit card required)
3. Add to `.env`:
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxx
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_MAX_TOKENS=500
   ```

### Models Available (Free Tier)
- **llama-3.3-70b-versatile** (Recommended: best balance)
- llama-3.1-8b-instant (Faster, less accurate)
- mixtral-8x7b-32768 (Larger context window)

### Rate Limits (Free Tier)
- 1,000 requests/day
- 6,000 tokens/minute
- 30 requests/minute

### Implementation (`backend/chatbot/groqClient.js`)
```javascript
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function getGroqResponse(messages, systemPrompt) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages // Array of {role: 'user'|'assistant', content: '...'}
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: parseInt(process.env.GROQ_MAX_TOKENS) || 500,
      temperature: 0.7,
      top_p: 1,
      stream: false
    });

    return {
      success: true,
      reply: completion.choices[0].message.content,
      usage: completion.usage // Track token consumption
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { getGroqResponse };
```

---

## 6. System Prompt (Groq Instructions)

**File**: `backend/chatbot/systemPrompt.js`

```javascript
const SYSTEM_PROMPT = `You are an AI assistant for Malloulinova, a B2B IoT consulting firm specializing in industrial IoT, smart manufacturing, and connected systems.

YOUR ROLE:
- Qualify leads by understanding their business needs
- Answer IoT consulting questions professionally
- Route visitors to the right page (projects, contact form, articles)
- Keep responses concise (2-3 sentences max)

CONVERSATION STRATEGY:
1. Start friendly and open-ended: "How can I help with your IoT project?"
2. Ask discovery questions: industry, use case, current challenges
3. Collect contact info naturally (name → company → email)
4. Always end with a call-to-action

ROUTING LOGIC:
- If user asks about past work/case studies → Route to PROJECTS page
- If user wants detailed consultation → Route to CONTACT page
- If user asks about specific IoT topic → Search and link to ARTICLES
- If user is ready to start → Route to CONTACT page with urgency

LEAD QUALIFICATION:
- Mark as qualified when you have: name + email + company name
- For qualified leads, push for immediate contact: "Let's schedule a call to discuss your specific needs"

PERSONALITY:
- Professional but warm
- Confident (you're an IoT expert)
- Action-oriented (guide toward next step)
- Never use jargon without explanation

CONSTRAINTS:
- Responses under 60 words
- No pricing specifics (say "it varies by scope—let's discuss on a call")
- No technical implementation details (offer consultation instead)
- Don't promise features/timelines without human approval

EXAMPLE FLOW:
User: "We need help with predictive maintenance"
You: "Predictive maintenance is our specialty! What industry are you in, and what equipment are you looking to monitor?"
[Continue conversation → Get name/company → Route to CONTACT]

Remember: Every conversation should end with the user either (1) filling out contact form, (2) viewing projects, or (3) reading a relevant article.`;

module.exports = { SYSTEM_PROMPT };
```

---

## 7. Hardcoded FAQ Fallback System

When Groq API fails or rate limit is hit, use keyword-based pattern matching.

**File**: `backend/chatbot/faqMatcher.js`

```javascript
const FAQ_DATABASE = [
  // Services & Capabilities
  {
    keywords: ['services', 'what do you do', 'offer', 'capabilities'],
    response: "We specialize in B2B IoT consulting: smart manufacturing, industrial IoT deployments, predictive maintenance, and connected systems integration. What specific challenge are you facing?",
    suggestions: ["View Our Projects", "Contact Us", "Tell Me More"],
    routeTo: null
  },
  {
    keywords: ['industries', 'sectors', 'who do you work with'],
    response: "We work with manufacturing, logistics, energy, and industrial clients. Our projects range from factory automation to supply chain optimization. Which industry are you in?",
    suggestions: ["Manufacturing", "Logistics", "Energy"],
    routeTo: null
  },

  // Pricing & Timeline
  {
    keywords: ['price', 'cost', 'budget', 'how much', 'pricing'],
    response: "Project costs vary based on scope, complexity, and deployment size. Most engagements range from $50k-$500k. Let's discuss your specific needs to provide an accurate estimate.",
    suggestions: ["Contact Us", "View Projects"],
    routeTo: "contact"
  },
  {
    keywords: ['timeline', 'how long', 'duration', 'time frame'],
    response: "Typical projects take 3-9 months from planning to deployment. Timeline depends on system complexity and integration requirements. Want to discuss your project specifics?",
    suggestions: ["Yes, Let's Talk", "View Case Studies"],
    routeTo: "contact"
  },

  // Technical Questions
  {
    keywords: ['sensors', 'hardware', 'devices', 'equipment'],
    response: "We're hardware-agnostic and work with leading IoT sensor manufacturers. Our focus is system integration, data architecture, and business value. What type of equipment are you looking to connect?",
    suggestions: ["Tell Me More", "Contact Us"],
    routeTo: null
  },
  {
    keywords: ['cloud', 'platform', 'aws', 'azure', 'software'],
    response: "We design cloud-agnostic solutions and work with AWS, Azure, Google Cloud, and private infrastructure. Our approach focuses on your business requirements first, then optimal tech stack.",
    suggestions: ["View Our Approach", "Contact Us"],
    routeTo: "projects"
  },
  {
    keywords: ['data', 'analytics', 'dashboard', 'reporting'],
    response: "We build custom analytics dashboards, real-time monitoring systems, and predictive models. Data visualization and actionable insights are core to every project.",
    suggestions: ["See Examples", "Contact Us"],
    routeTo: "projects"
  },

  // Use Cases
  {
    keywords: ['predictive maintenance', 'machine monitoring', 'downtime'],
    response: "Predictive maintenance is one of our most requested solutions. We've helped clients reduce downtime by 40-60% through sensor integration and ML models. Want to see a case study?",
    suggestions: ["Yes, Show Me", "Contact Us"],
    routeTo: "projects"
  },
  {
    keywords: ['smart factory', 'industry 4.0', 'automation'],
    response: "Smart factory transformations are our specialty. We've deployed solutions for automotive, electronics, and food processing plants. Check out our manufacturing projects!",
    suggestions: ["View Projects", "Contact Us"],
    routeTo: "projects"
  },
  {
    keywords: ['supply chain', 'logistics', 'tracking', 'inventory'],
    response: "We optimize supply chains with real-time tracking, inventory automation, and predictive demand planning. Our solutions integrate with existing ERP/WMS systems.",
    suggestions: ["View Logistics Projects", "Contact Us"],
    routeTo: "projects"
  },

  // Projects & Case Studies
  {
    keywords: ['projects', 'case studies', 'examples', 'portfolio', 'past work'],
    response: "We've completed 50+ IoT deployments across manufacturing, logistics, and energy sectors. Our Projects page showcases detailed case studies with ROI metrics.",
    suggestions: ["View All Projects"],
    routeTo: "projects"
  },
  {
    keywords: ['clients', 'customers', 'testimonials', 'reviews'],
    response: "We've partnered with Fortune 500 manufacturers and mid-sized industrial companies. Check our Projects page for client testimonials and success stories.",
    suggestions: ["View Projects", "Contact Us"],
    routeTo: "projects"
  },

  // Getting Started
  {
    keywords: ['start', 'begin', 'first step', 'how to get started'],
    response: "Let's start with a free 30-minute consultation to understand your needs. We'll discuss your challenges, potential solutions, and next steps. Ready to schedule?",
    suggestions: ["Yes, Let's Talk", "Learn More First"],
    routeTo: "contact"
  },
  {
    keywords: ['consultation', 'call', 'meeting', 'discuss', 'talk'],
    response: "Perfect! Fill out our contact form with your project details, and we'll schedule a consultation within 24 hours. What's the best email to reach you?",
    suggestions: ["Go to Contact Form"],
    routeTo: "contact"
  },
  {
    keywords: ['contact', 'email', 'phone', 'reach'],
    response: "You can reach us via our contact form, email at contact@malloulinova.com, or call +123-456-7890. What's your preferred contact method?",
    suggestions: ["Fill Contact Form", "Call Now"],
    routeTo: "contact"
  },

  // Greeting Responses
  {
    keywords: ['hi', 'hello', 'hey', 'greetings'],
    response: "Hi there! 👋 I'm here to help with your IoT consulting needs. Are you looking to improve operations, implement predictive maintenance, or explore smart manufacturing?",
    suggestions: ["Predictive Maintenance", "Smart Factory", "Tell Me More"],
    routeTo: null
  },

  // Fallback (no keyword match)
  {
    keywords: ['*'], // Wildcard - matches everything
    response: "I'd love to help! Can you tell me more about your IoT project or challenge? Or, I can connect you with our team for a detailed discussion.",
    suggestions: ["View Projects", "Contact Us", "Learn About Services"],
    routeTo: null
  }
];

function findBestMatch(userMessage) {
  const messageLower = userMessage.toLowerCase();
  
  // Try exact keyword matches first
  for (const faq of FAQ_DATABASE) {
    if (faq.keywords.includes('*')) continue; // Skip wildcard for now
    
    for (const keyword of faq.keywords) {
      if (messageLower.includes(keyword.toLowerCase())) {
        return faq;
      }
    }
  }
  
  // Return wildcard fallback if no match
  return FAQ_DATABASE.find(faq => faq.keywords.includes('*'));
}

module.exports = { findBestMatch, FAQ_DATABASE };
```

---

## 8. Intent Detection & Routing

**File**: `backend/chatbot/intentDetector.js`

```javascript
function detectIntent(message, conversationHistory) {
  const msg = message.toLowerCase();
  
  // High-intent phrases (ready to convert)
  const highIntent = [
    'lets talk', 'contact you', 'schedule', 'ready to start',
    'interested in', 'want to discuss', 'need help with',
    'looking for', 'can you help', 'get started'
  ];
  
  // Information-seeking phrases
  const infoSeeking = [
    'how does', 'what is', 'tell me about', 'explain',
    'learn more', 'want to know', 'curious about'
  ];
  
  // Project/portfolio interest
  const projectInterest = [
    'examples', 'case studies', 'past work', 'projects',
    'portfolio', 'clients', 'show me'
  ];
  
  // Check intent
  if (highIntent.some(phrase => msg.includes(phrase))) {
    return { intent: 'high_conversion', route: 'contact' };
  }
  
  if (projectInterest.some(phrase => msg.includes(phrase))) {
    return { intent: 'project_research', route: 'projects' };
  }
  
  if (infoSeeking.some(phrase => msg.includes(phrase))) {
    return { intent: 'information', route: null };
  }
  
  // Check conversation length (long conversation = higher intent)
  if (conversationHistory.length > 6) {
    return { intent: 'engaged', route: 'contact' };
  }
  
  return { intent: 'discovery', route: null };
}

function shouldQualifyLead(visitorData) {
  return !!(
    visitorData.name &&
    visitorData.email &&
    visitorData.company
  );
}

module.exports = { detectIntent, shouldQualifyLead };
```

---

## 9. Backend Chat Handler

**Add to `backend/server.js`** (and mirror in `api/[...path].js` for Vercel):

```javascript
const { getGroqResponse } = require('./chatbot/groqClient');
const { findBestMatch } = require('./chatbot/faqMatcher');
const { detectIntent, shouldQualifyLead } = require('./chatbot/intentDetector');
const { SYSTEM_PROMPT } = require('./chatbot/systemPrompt');
const { nanoid } = require('nanoid');

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message, context } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Missing sessionId or message' });
    }
    
    // Fetch or create conversation
    let { data: conversation } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (!conversation) {
      const { data: newConv } = await supabase
        .from('chat_conversations')
        .insert({
          id: nanoid(),
          session_id: sessionId,
          messages: []
        })
        .select()
        .single();
      conversation = newConv;
    }
    
    // Add user message to history
    const messages = conversation.messages || [];
    messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    
    // Detect intent
    const intent = detectIntent(message, messages);
    
    // Try Groq API first
    let botReply, suggestions, source;
    const groqMessages = messages.map(m => ({ role: m.role, content: m.content }));
    
    const groqResult = await getGroqResponse(groqMessages, SYSTEM_PROMPT);
    
    if (groqResult.success) {
      botReply = groqResult.reply;
      source = 'groq';
      
      // Generate context-aware suggestions based on intent
      suggestions = generateSuggestions(intent, context);
      
    } else {
      // Fallback to hardcoded FAQ
      const faqMatch = findBestMatch(message);
      botReply = faqMatch.response;
      suggestions = faqMatch.suggestions;
      source = 'fallback';
      intent.route = faqMatch.routeTo;
    }
    
    // Add bot response to history
    messages.push({ role: 'assistant', content: botReply, timestamp: new Date().toISOString() });
    
    // Update visitor data if provided
    const visitorData = {
      visitor_name: context.visitorData?.name || conversation.visitor_name,
      visitor_email: context.visitorData?.email || conversation.visitor_email,
      visitor_company: context.visitorData?.company || conversation.visitor_company
    };
    
    const leadQualified = shouldQualifyLead(visitorData);
    
    // Save conversation
    await supabase
      .from('chat_conversations')
      .update({
        messages,
        ...visitorData,
        lead_qualified: leadQualified,
        route_suggested: intent.route,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    // Return response
    res.json({
      reply: botReply,
      suggestions: suggestions || ["Tell Me More", "Contact Us"],
      routeTo: intent.route,
      leadQualified,
      source
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      reply: "I'm having trouble right now. Please email us at contact@malloulinova.com",
      suggestions: ["Contact Us", "View Projects"],
      source: 'error'
    });
  }
});

function generateSuggestions(intent, context) {
  if (intent.intent === 'high_conversion') {
    return ["Schedule Consultation", "View Projects", "Learn More"];
  }
  if (intent.intent === 'project_research') {
    return ["View All Projects", "Contact Us"];
  }
  if (context.currentPage === 'projects') {
    return ["Contact Us", "Learn About Services"];
  }
  return ["View Projects", "Contact Us", "Tell Me More"];
}
```

---

## 10. Frontend Implementation

### ChatWidget.jsx (Main Component)

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../services/chatService';
import './ChatWidget.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [visitorData, setVisitorData] = useState({ name: null, email: null, company: null });
  
  const messagesEndRef = useRef(null);
  
  // Initialize session on mount
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('chatSessionId');
    const storedMessages = sessionStorage.getItem('chatMessages');
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } else {
      const newSessionId = generateUUID();
      setSessionId(newSessionId);
      sessionStorage.setItem('chatSessionId', newSessionId);
      
      // Initial greeting
      const greeting = {
        role: 'assistant',
        content: "Hi! 👋 I'm here to help with IoT consulting questions. What brings you here today?",
        suggestions: ["Smart Manufacturing", "Predictive Maintenance", "View Projects"]
      };
      setMessages([greeting]);
      sessionStorage.setItem('chatMessages', JSON.stringify([greeting]));
    }
    
    // Auto-open after 15 seconds on first visit
    if (!sessionStorage.getItem('chatOpened')) {
      setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('chatOpened', 'true');
      }, 15000);
    }
  }, []);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async (messageText = null) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;
    
    // Add user message
    const userMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await sendChatMessage({
        sessionId,
        message: textToSend,
        context: {
          currentPage: window.location.pathname.split('/')[1] || 'home',
          visitorData
        }
      });
      
      const botMessage = {
        role: 'assistant',
        content: response.reply,
        suggestions: response.suggestions,
        routeTo: response.routeTo
      };
      
      const newMessages = [...updatedMessages, botMessage];
      setMessages(newMessages);
      sessionStorage.setItem('chatMessages', JSON.stringify(newMessages));
      
      // Handle routing
      if (response.routeTo) {
        setTimeout(() => {
          if (response.routeTo === 'contact') {
            window.location.href = '/contact';
          } else if (response.routeTo === 'projects') {
            window.location.href = '/projects';
          } else if (response.routeTo.startsWith('article-')) {
            const articleId = response.routeTo.replace('article-', '');
            window.location.href = `/article/${articleId}`;
          }
        }, 2000);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting. Please email us at contact@malloulinova.com",
        suggestions: ["Contact Us"]
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    if (suggestion === "Contact Us" || suggestion === "Fill Contact Form" || suggestion === "Go to Contact Form") {
      window.location.href = '/contact';
    } else if (suggestion === "View Projects" || suggestion === "View All Projects") {
      window.location.href = '/projects';
    } else {
      handleSend(suggestion);
    }
  };
  
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  return (
    <>
      {/* Chat Bubble */}
      {!isOpen && (
        <button
          className="chat-bubble"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          💬
        </button>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-avatar">🤖</div>
              <div>
                <h3>Malloulinova Assistant</h3>
                <p>IoT Consulting Expert</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="chat-close-btn">✕</button>
          </div>
          
          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <div className="message-bubble">
                  {msg.content}
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="suggestions">
                    {msg.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        className="suggestion-btn"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="message-bubble typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

### chatService.js

```javascript
const BASE_URL = '/api';

export async function sendChatMessage(payload) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error('Chat request failed');
  }
  
  return response.json();
}
```

### ChatWidget.css

```css
/* Chat Bubble */
.chat-bubble {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 28px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  animation: pulse 2s infinite;
}

.chat-bubble:hover {
  transform: scale(1.1);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6); }
}

/* Chat Window */
.chat-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

@media (max-width: 768px) {
  .chat-window {
    width: 100vw;
    height: 100vh;
    bottom: 0;
    right: 0;
    border-radius: 0;
  }
}

/* Header */
.chat-header {