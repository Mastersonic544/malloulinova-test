// Hardcoded FAQ fallback system for when Groq API fails or rate limit is reached

const FAQ_DATABASE = [
  // Services & Capabilities
  {
    keywords: ['services', 'what do you do', 'offer', 'capabilities', 'what can you'],
    response: "We specialize in B2B IoT consulting: smart manufacturing, industrial IoT deployments, predictive maintenance, and connected systems integration. What specific challenge are you facing?",
    suggestions: ["View Our Projects", "Contact Us", "Tell Me More"],
    routeTo: null
  },
  {
    keywords: ['industries', 'sectors', 'who do you work with', 'clients'],
    response: "We work with manufacturing, logistics, energy, and industrial clients. Our projects range from factory automation to supply chain optimization. Which industry are you in?",
    suggestions: ["Manufacturing", "Logistics", "Energy"],
    routeTo: null
  },

  // Pricing & Timeline
  {
    keywords: ['price', 'cost', 'budget', 'how much', 'pricing', 'expensive'],
    response: "Project costs vary based on scope, complexity, and deployment size. Most engagements range from $50k-$500k. Let's discuss your specific needs to provide an accurate estimate.",
    suggestions: ["Contact Us", "View Projects"],
    routeTo: "contact"
  },
  {
    keywords: ['timeline', 'how long', 'duration', 'time frame', 'when'],
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
    keywords: ['cloud', 'platform', 'aws', 'azure', 'software', 'technology'],
    response: "We design cloud-agnostic solutions and work with AWS, Azure, Google Cloud, and private infrastructure. Our approach focuses on your business requirements first, then optimal tech stack.",
    suggestions: ["View Our Approach", "Contact Us"],
    routeTo: "projects"
  },
  {
    keywords: ['data', 'analytics', 'dashboard', 'reporting', 'visualization'],
    response: "We build custom analytics dashboards, real-time monitoring systems, and predictive models. Data visualization and actionable insights are core to every project.",
    suggestions: ["See Examples", "Contact Us"],
    routeTo: "projects"
  },

  // Use Cases
  {
    keywords: ['predictive maintenance', 'machine monitoring', 'downtime', 'maintenance'],
    response: "Predictive maintenance is one of our most requested solutions. We've helped clients reduce downtime by 40-60% through sensor integration and ML models. Want to see a case study?",
    suggestions: ["Yes, Show Me", "Contact Us"],
    routeTo: "projects"
  },
  {
    keywords: ['smart factory', 'industry 4.0', 'automation', 'manufacturing'],
    response: "Smart factory transformations are our specialty. We've deployed solutions for automotive, electronics, and food processing plants. Check out our manufacturing projects!",
    suggestions: ["View Projects", "Contact Us"],
    routeTo: "projects"
  },
  {
    keywords: ['supply chain', 'logistics', 'tracking', 'inventory', 'warehouse'],
    response: "We optimize supply chains with real-time tracking, inventory automation, and predictive demand planning. Our solutions integrate with existing ERP/WMS systems.",
    suggestions: ["View Logistics Projects", "Contact Us"],
    routeTo: "projects"
  },

  // Projects & Case Studies
  {
    keywords: ['projects', 'case studies', 'examples', 'portfolio', 'past work', 'previous'],
    response: "We've completed 50+ IoT deployments across manufacturing, logistics, and energy sectors. Our Projects page showcases detailed case studies with ROI metrics.",
    suggestions: ["View All Projects"],
    routeTo: "projects"
  },
  {
    keywords: ['testimonials', 'reviews', 'success stories'],
    response: "We've partnered with Fortune 500 manufacturers and mid-sized industrial companies. Check our Projects page for client testimonials and success stories.",
    suggestions: ["View Projects", "Contact Us"],
    routeTo: "projects"
  },

  // Getting Started
  {
    keywords: ['start', 'begin', 'first step', 'how to get started', 'get started'],
    response: "Let's start with a free 30-minute consultation to understand your needs. We'll discuss your challenges, potential solutions, and next steps. Ready to schedule?",
    suggestions: ["Yes, Let's Talk", "Learn More First"],
    routeTo: "contact"
  },
  {
    keywords: ['consultation', 'call', 'meeting', 'discuss', 'talk', 'schedule'],
    response: "Perfect! Fill out our contact form with your project details, and we'll schedule a consultation within 24 hours. What's the best email to reach you?",
    suggestions: ["Go to Contact Form"],
    routeTo: "contact"
  },
  {
    keywords: ['contact', 'email', 'phone', 'reach', 'get in touch'],
    response: "You can reach us via our contact form, email at info@malloulinova.com, or call +123-456-7890. What's your preferred contact method?",
    suggestions: ["Fill Contact Form", "Call Now"],
    routeTo: "contact"
  },

  // Greeting Responses
  {
    keywords: ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon'],
    response: "Hi there! 👋 I'm here to help with your IoT consulting needs. Are you looking to improve operations, implement predictive maintenance, or explore smart manufacturing?",
    suggestions: ["Predictive Maintenance", "Smart Factory", "Tell Me More"],
    routeTo: null
  },

  // Help/Questions
  {
    keywords: ['help', 'assist', 'support', 'question'],
    response: "I'm here to help! I can answer questions about our IoT consulting services, show you past projects, or connect you with our team. What would you like to know?",
    suggestions: ["View Projects", "Contact Us", "Learn About Services"],
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

/**
 * Find best FAQ match based on keywords
 * @param {String} userMessage - User's message
 * @returns {Object} FAQ entry with response, suggestions, and routeTo
 */
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
