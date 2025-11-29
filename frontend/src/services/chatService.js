// Chat service for communicating with chatbot API

const BASE_URL = '/api';

/**
 * Send a message to the chatbot
 * @param {Object} payload - {sessionId, message, context}
 * @returns {Promise<Object>} {reply, suggestions, routeTo, leadQualified, source}
 */
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
