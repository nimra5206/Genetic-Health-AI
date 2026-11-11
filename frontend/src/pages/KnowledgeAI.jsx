import React, { useState, useRef, useEffect } from "react";
import "./KnowledgeAI.css";

function KnowledgeAI() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am your Genetic Health knowledge assistant. Now I can answer ANYTHING - Ask me about Thalassemia, Hemophilia, Breast Cancer, or 'I have fever and chest pain today, what should I do?'"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const quickPrompts = [
    { label: "Thalassemia", icon: "🩸" },
    { label: "Hemophilia", icon: "🩺" },
    { label: "BRCA1 Breast Cancer", icon: "🧬" },
    { label: "Sweat Chloride", icon: "🧪" }
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_KEY;
      if (!apiKey) throw new Error("VITE_GEMINI_KEY missing in frontend/.env");

      // FIXED FOR NEW 2026 KEYS - gemini-3.8-flash
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `You are KnowledgeAI Assistant for GeneticHealthAI FYP. You are a real medical AI like ChatGPT. Answer ANY medical question: symptoms, genetics, biomarkers, genes. Be friendly, helpful, detailed. For genetic conditions give gene, biomarker, inheritance pattern. Always end with: Educational demo only - not medical advice.

User: ${query}`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gemini Error");

      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { sender: "bot", text: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="knowledge-ai-chat-wrapper">
      <div className="chat-messages-area">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble-row ${msg.sender}`}>
            {msg.sender === "bot" && <div className="bot-avatar-icon">🤖</div>}
            <div className={`chat-bubble ${msg.sender}`}>{msg.text}</div>
          </div>
        ))}
        {loading && <div className="chat-bubble-row bot"><div className="bot-avatar-icon">🤖</div><div className="chat-bubble bot">Thinking...</div></div>}
        <div ref={bottomRef} />
      </div>
      <div className="quick-prompts-container">
        {quickPrompts.map((p, idx) => (
          <button key={idx} className="prompt-pill-btn" disabled={loading} onClick={() => handleSend(p.label)}><span>{p.icon}</span><span>{p.label}</span></button>
        ))}
      </div>
      <div className="chat-input-section">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="chat-input-form">
          <input type="text" placeholder="Ask about a condition, biomarker, or gene..." value={input} disabled={loading} onChange={(e) => setInput(e.target.value)} className="chat-text-input" />
          <button type="submit" disabled={loading} className="chat-send-btn">{loading? "..." : "Send ↗"}</button>
        </form>
        <p className="chat-disclaimer-note">Educational demo responses only — not a substitute for professional medical advice.</p>
      </div>
    </div>
  );
}
export default KnowledgeAI;