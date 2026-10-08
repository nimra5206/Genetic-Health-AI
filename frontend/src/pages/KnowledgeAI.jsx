import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config"; // Config import kiya
import "./KnowledgeAI.css";

function KnowledgeAI() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am your Genetic Health knowledge assistant. Ask me about any of the five supported conditions (Thalassemia, Hemophilia, Breast Cancer, Sickle Cell Anemia, Cystic Fibrosis), their biomarkers, or inheritance patterns."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    { label: "Thalassemia", icon: "🩸" },
    { label: "Hemophilia", icon: "🩺" },
    { label: "BRCA1 Breast Cancer", icon: "🧬" },
    { label: "Sweat Chloride", icon: "🧪" }
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");

    setLoading(true);

    try {
      const token = localStorage.getItem("access");

      // FIX: Using API_BASE_URL from config.js
      const response = await axios.post(
        `${API_BASE_URL}/api/predictions/rag-chat/`,
        { query: query },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );

      const botReply =
        response.data.answer ||
        response.data.response ||
        response.data.message ||
        `Information regarding "${query}": Please refer to clinical guidelines for genomic variant validation.`;

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("Knowledge AI API Error:", error);
      
      // Fallback for seamless testing if backend RAG view is still under build
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `[Genetic AI Knowledge]: Details regarding "${query}" — Assessment of biomarkers, genomic inheritance, and clinical variant risk required for diagnosis.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="knowledge-ai-chat-wrapper">
      <div className="chat-messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-bubble-row ${msg.sender}`}>
            {msg.sender === "bot" && <div className="bot-avatar-icon">🤖</div>}
            <div className={`chat-bubble ${msg.sender}`}>{msg.text}</div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-row bot">
            <div className="bot-avatar-icon">🤖</div>
            <div className="chat-bubble bot loading-bubble">
              Searching knowledge base...
            </div>
          </div>
        )}
      </div>

      <div className="quick-prompts-container">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            className="prompt-pill-btn"
            disabled={loading}
            onClick={() => handleSend(prompt.label)}
          >
            <span>{prompt.icon}</span>
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>

      <div className="chat-input-section">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="chat-input-form"
        >
          <input
            type="text"
            placeholder="Ask about a condition, biomarker, or gene..."
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            className="chat-text-input"
          />
          <button type="submit" disabled={loading} className="chat-send-btn">
            {loading ? "..." : "Send ↗"}
          </button>
        </form>
        <p className="chat-disclaimer-note">
          Educational demo responses only — not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
}

export default KnowledgeAI;