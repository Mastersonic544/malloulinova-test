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
    const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    
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
    
    // Auto-open after 15 seconds on first visit (skip on mobile to avoid covering screen)
    if (!isMobile && !sessionStorage.getItem('chatOpened')) {
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
            window.location.href = `/projects/${articleId}`;
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
          <img src="/chat.png" alt="Open chat" className="chat-bubble-icon" />
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
