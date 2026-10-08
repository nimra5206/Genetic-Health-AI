import React, { useState } from "react";
import KnowledgeAI from "../pages/KnowledgeAI.jsx";
import "./GlobalChatbot.css";

function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="global-chatbot-wrapper">
      {/* Floating Bouncing Trigger Icon (Bottom Right) */}
      <button
        className={`chatbot-trigger-btn ${isOpen ? "active" : ""}`}
        onClick={toggleChatbot}
        title="KnowledgeAI Assistant"
        aria-label="Toggle KnowledgeAI Chatbot"
      >
        {isOpen ? (
          <span className="close-icon">✕</span>
        ) : (
          <div className="bot-icon-container">
            <span className="bot-icon">🤖</span>
            <span className="pulse-ring"></span>
          </div>
        )}
      </button>

      {/* Dimmed Overlay Backdrop (optional, for easy click-away close) */}
      {isOpen && <div className="chatbot-backdrop" onClick={toggleChatbot}></div>}

      {/* Modern Right-Side Sliding Drawer */}
      <div className={`chatbot-drawer-container ${isOpen ? "open" : ""}`}>
        <div className="chatbot-drawer-header">
          <div className="header-info">
            <div className="bot-avatar">🤖</div>
            <div>
              <h3>KnowledgeAI Assistant</h3>
              <p className="status-subtext">
                <span className="online-dot">●</span> Clinical Decision Support Active
              </p>
            </div>
          </div>
          <button className="close-drawer-btn" onClick={toggleChatbot} title="Close Panel">
            ✕
          </button>
        </div>

        <div className="chatbot-drawer-body">
          <KnowledgeAI />
        </div>
      </div>
    </div>
  );
}

export default GlobalChatbot;