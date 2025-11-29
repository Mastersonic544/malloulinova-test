// Intent detection and lead qualification logic

/**
 * Detect user intent from message and conversation history
 * @param {String} message - Current user message
 * @param {Array} conversationHistory - Array of previous messages
 * @returns {Object} {intent: string, route: string|null}
 */
function detectIntent(message, conversationHistory) {
  const msg = message.toLowerCase();
  
  // High-intent phrases (ready to convert)
  const highIntent = [
    'lets talk', 'let\'s talk', 'contact you', 'schedule', 'ready to start',
    'interested in', 'want to discuss', 'need help with',
    'looking for', 'can you help', 'get started', 'sign up',
    'book', 'appointment', 'consultation'
  ];
  
  // Information-seeking phrases
  const infoSeeking = [
    'how does', 'what is', 'tell me about', 'explain',
    'learn more', 'want to know', 'curious about', 'wondering'
  ];
  
  // Project/portfolio interest
  const projectInterest = [
    'examples', 'case studies', 'past work', 'projects',
    'portfolio', 'show me', 'see your work', 'previous'
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

/**
 * Check if lead should be marked as qualified
 * @param {Object} visitorData - {name, email, company}
 * @returns {Boolean} true if all required fields are present
 */
function shouldQualifyLead(visitorData) {
  return !!(
    visitorData.visitor_name &&
    visitorData.visitor_email &&
    visitorData.visitor_company
  );
}

/**
 * Generate context-aware suggestions based on intent
 * @param {Object} intent - Intent object from detectIntent
 * @param {Object} context - Current page context
 * @returns {Array} Array of suggestion strings
 */
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

module.exports = { detectIntent, shouldQualifyLead, generateSuggestions };
