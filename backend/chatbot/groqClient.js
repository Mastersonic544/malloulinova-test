// Groq API client for chatbot responses
// Free tier: 1,000 requests/day, 6,000 tokens/min

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Get AI response from Groq API
 * @param {Array} messages - Conversation history [{role: 'user'|'assistant', content: '...'}]
 * @param {String} systemPrompt - System instructions for the AI
 * @returns {Object} {success: boolean, reply: string, usage: object, error: string}
 */
async function getGroqResponse(messages, systemPrompt) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not set, falling back to FAQ system');
      return {
        success: false,
        error: 'API key not configured'
      };
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
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
      usage: completion.usage
    };
  } catch (error) {
    console.error('Groq API Error:', error.message || error);
    
    // Check if it's a rate limit error
    if (error.status === 429) {
      console.warn('Groq rate limit reached, falling back to FAQ');
    }
    
    return {
      success: false,
      error: error.message || 'API request failed'
    };
  }
}

module.exports = { getGroqResponse };
