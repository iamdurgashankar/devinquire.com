import React, { useState, useRef, useEffect } from "react";
import { X, Send, Phone, Mail, MessageCircle, Bot } from "lucide-react";

const FAQ = [
  {
    q: "How can I contact support?",
    a: "You can contact us via WhatsApp, phone, or email using the quick actions below.",
  },
  {
    q: "How do I post a blog?",
    a: "Sign in to the DevInquire Dashboard and open Editorial Studio.",
  },
  {
    q: "How do I start a project?",
    a: "Visit our Services or Contact page to request a consultation or use the quick inquiry modal.",
  },
  {
    q: "What is DevInquire?",
    a: "DevInquire is a digital engineering studio specializing in full-stack web apps, mobile apps, and AI solutions.",
  },
];

const CONTACTS = {
  whatsapp: "https://wa.me/918763155488",
  phone: "tel:+918763155488",
  email: "mailto:contact@devinquire.com",
};

function getBotReply(input) {
  input = input.toLowerCase();
  if (input.includes("whatsapp"))
    return "Click the WhatsApp pill below to message our engineering team directly.";
  if (input.includes("call") || input.includes("phone"))
    return "Click the Call pill below to speak directly with our studio.";
  if (input.includes("email"))
    return "Click the Email pill below to send us your project brief.";

  for (const { q, a } of FAQ) {
    if (input.includes(q.split(" ")[0].toLowerCase())) {
      return a;
    }
  }

  const defaultResponses = [
    "I'm your DevInquire AI assistant. I can help with project inquiries, services, blog insights, or connecting you with our team.",
    "Welcome to DevInquire! Ask me about our full-stack web, mobile, and AI engineering capabilities.",
    "Need a custom quote or technical consultation? Ask away or use the direct contact buttons below.",
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export default function SupportAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hello! I'm DI AI, your DevInquire assistant.\n\n• Web & Mobile Engineering\n• Product Suite & Cloud Architecture\n• Direct Studio Support\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const typingTimeout = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open, typingText]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  const showTypingEffect = (fullText) => {
    setTyping(true);
    setTypingText("");
    let i = 0;
    function typeChar() {
      setTypingText((prev) => prev + fullText[i]);
      i++;
      if (i < fullText.length) {
        typingTimeout.current = setTimeout(typeChar, 15);
      } else {
        setTyping(false);
        setMessages((msgs) => [...msgs, { from: "bot", text: fullText }]);
        setTypingText("");
      }
    }
    typeChar();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || typing) return;
    const userMsg = { from: "user", text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    const currentInput = input;
    setInput("");
    const reply = getBotReply(currentInput);
    showTypingEffect(reply);
  };

  return (
    <>
      {/* Apple Intelligence Floating Pill Button */}
      <button
        className="fixed bottom-6 right-6 z-50 apple-pill-btn rounded-full px-4 py-3 shadow-xl flex items-center gap-2 group"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open DevInquire AI Support Chat"
      >
        <span className="text-[13px] font-semibold badge-white">
          DI AI
        </span>
      </button>

      {/* macOS Popover Chat Sheet */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 max-w-[92vw] apple-glass rounded-[24px] overflow-hidden flex flex-col animate-slide-up">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--apple-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[11px] bg-gradient-to-b from-[#BF5AF2] via-[#5E5CE6] to-[#4e45e1] flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-white badge-white" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-[var(--apple-text-primary)] leading-tight">
                  DevInquire Intelligence
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#28CD41]" />
                  <span className="text-[11px] text-[var(--apple-text-tertiary)]">
                    Online · Instant Response
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full apple-subcard flex items-center justify-center text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
              aria-label="Close chat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={chatRef}
            className="p-4 space-y-3 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: 300 }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.from === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`rounded-[16px] px-3.5 py-2.5 max-w-[85%] text-[13px] leading-relaxed whitespace-pre-line ${
                    msg.from === "user"
                      ? "apple-pill-btn badge-white"
                      : "apple-subcard text-[var(--apple-text-primary)]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start animate-fade-in">
                <div className="rounded-[16px] px-3.5 py-2.5 max-w-[85%] text-[13px] apple-subcard text-[var(--apple-text-primary)]">
                  {typingText}
                  <span className="animate-pulse text-[var(--apple-blue)] font-bold">
                    |
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-3 border-t border-[var(--apple-border)] flex items-center gap-2"
          >
            <input
              type="text"
              className="flex-1 apple-input px-3.5 py-2 text-[13px]"
              placeholder="Ask DI AI anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={typing}
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-full apple-pill-btn flex items-center justify-center disabled:opacity-40 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5 badge-white" />
            </button>
          </form>

          {/* Direct Action Pills */}
          <div className="px-3 pb-3 grid grid-cols-3 gap-2">
            <a
              href={CONTACTS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-[10px] apple-subcard text-[11px] font-medium text-[var(--apple-text-secondary)] hover:text-[#28CD41]"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#28CD41]" />
              <span>WhatsApp</span>
            </a>
            <a
              href={CONTACTS.phone}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-[10px] apple-subcard text-[11px] font-medium text-[var(--apple-text-secondary)] hover:text-[var(--apple-blue)]"
            >
              <Phone className="w-3.5 h-3.5 text-[var(--apple-blue)]" />
              <span>Call</span>
            </a>
            <a
              href={CONTACTS.email}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-[10px] apple-subcard text-[11px] font-medium text-[var(--apple-text-secondary)] hover:text-[var(--apple-purple)]"
            >
              <Mail className="w-3.5 h-3.5 text-[var(--apple-purple)]" />
              <span>Email</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
