import React, { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../services/api';

const FAQ = [
  { q: 'How can I contact support?', a: 'You can contact us via WhatsApp, phone, or email using the buttons below.' },
  { q: 'How do I post a blog?', a: 'Sign in as admin, go to the Admin Panel, and use the Blog Management section.' },
  { q: 'How do I reset my password?', a: 'Go to the login page and click "Forgot password?" or contact support.' },
  { q: 'What is Devinquire?', a: 'Devinquire is a modern platform for blogging, user management, and more.' },
];

const CONTACTS = {
  whatsapp: 'https://wa.me/91XXXXXXXXXX',
  phone: 'tel:+91XXXXXXXXXX',
  email: 'mailto:support@devinquire.com',
};

function getBotReply(input) {
  input = input.toLowerCase();
  if (input.includes('whatsapp')) return 'Click the WhatsApp button below to chat with us instantly!';
  if (input.includes('call') || input.includes('phone')) return 'Click the Call button below to reach us by phone.';
  if (input.includes('email')) return 'Click the Email button below to send us a message.';
  for (const { q, a } of FAQ) {
    if (input.includes(q.split(' ')[0])) return a;
  }
  return "I'm here to help! You can ask a question or use the contact buttons below.";
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.className = 'fixed bottom-8 right-8 z-[9999] bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold text-base animate-fade-in-out';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = 0; }, 1800);
  setTimeout(() => { toast.remove(); }, 2200);
}

const API_AI_ENDPOINT = `${API_BASE}/ai_chat.php`;

export default function SupportAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am Devinquire Support AI. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const typingTimeout = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open, typingText]);

  useEffect(() => {
    return () => { if (typingTimeout.current) clearTimeout(typingTimeout.current); };
  }, []);

  const showTypingEffect = (fullText) => {
    setTyping(true);
    setTypingText('');
    let i = 0;
    function typeChar() {
      setTypingText((prev) => prev + fullText[i]);
      i++;
      if (i < fullText.length) {
        typingTimeout.current = setTimeout(typeChar, 18);
      } else {
        setTyping(false);
        setMessages((msgs) => [...msgs, { from: 'bot', text: fullText }]);
        setTypingText('');
      }
    }
    typeChar();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || typing) return;
    const userMsg = { from: 'user', text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);
    setInput('');
    try {
      const res = await fetch(API_AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        showTypingEffect(data.reply);
      } else {
        setMessages((msgs) => [...msgs, { from: 'bot', text: getBotReply(input) }]);
      }
    } catch (err) {
      setMessages((msgs) => [...msgs, { from: 'bot', text: getBotReply(input) }]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (type) => {
    if (type === 'whatsapp') showToast('Opening WhatsApp chat...');
    if (type === 'phone') showToast('Opening phone dialer...');
    if (type === 'email') showToast('Opening email client...');
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-2xl p-4 flex items-center justify-center hover:scale-105 transition-transform duration-200 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Support Chat"
        style={{ boxShadow: '0 8px 32px rgba(80,0,200,0.18)' }}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4.28 1.07a1 1 0 01-1.22-1.22l1.07-4.28A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
      {/* Chat Widget */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[95vw] bg-white/60 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/30 flex flex-col" style={{ boxShadow: '0 12px 48px rgba(80,0,200,0.18)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/30 bg-gradient-to-r from-blue-400/70 to-purple-400/70 rounded-t-2xl">
            <span className="font-semibold text-white drop-shadow text-lg flex items-center gap-2">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4.28 1.07a1 1 0 01-1.22-1.22l1.07-4.28A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Devinquire Support
            </span>
            <button onClick={() => setOpen(false)} className="text-white hover:text-red-200 rounded-full p-1 ml-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div ref={chatRef} className="flex-1 px-4 py-3 space-y-2 overflow-y-auto" style={{ maxHeight: 320 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-xl px-4 py-2 mb-1 max-w-[80%] text-sm shadow ${msg.from === 'user' ? 'bg-blue-500 text-white' : 'bg-white/80 text-gray-800 border border-blue-100'}`}>{msg.text}</div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-2 mb-1 max-w-[80%] text-sm shadow bg-white/80 text-gray-800 border border-blue-100">
                  {typingText}<span className="animate-pulse">|</span>
                </div>
              </div>
            )}
            {loading && !typing && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-2 mb-1 max-w-[80%] text-sm shadow bg-white/80 text-gray-800 border border-blue-100 animate-pulse">Thinking...</div>
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-white/30 bg-white/60 rounded-b-2xl">
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 text-gray-800"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-150">Send</button>
          </form>
          <div className="flex justify-between gap-3 px-4 py-3 border-t border-white/30 bg-white/80 rounded-b-2xl">
            <a
              href={CONTACTS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center justify-center gap-1 bg-green-500/90 hover:bg-green-600 focus:bg-green-700 text-white rounded-xl py-3 font-semibold transition-all duration-150 shadow-lg group"
              onClick={() => handleContactClick('whatsapp')}
              tabIndex={0}
              title="Chat on WhatsApp"
            >
              <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 32 32"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.607 1.938 6.563L4 29l7.625-1.938A12.93 12.93 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22.75c-1.98 0-3.92-.52-5.625-1.5l-.4-.23-4.5 1.145 1.145-4.5-.23-.4A10.72 10.72 0 015.25 15c0-5.93 4.82-10.75 10.75-10.75S26.75 9.07 26.75 15 21.93 25.75 16 25.75zm5.07-7.13c-.277-.138-1.637-.808-1.89-.9-.253-.092-.437-.138-.62.138-.184.277-.713.9-.875 1.085-.161.184-.322.207-.6.069-.277-.138-1.17-.432-2.23-1.377-.824-.735-1.38-1.64-1.542-1.917-.161-.277-.017-.426.122-.563.126-.125.277-.322.415-.483.138-.161.184-.276.276-.46.092-.184.046-.345-.023-.483-.069-.138-.62-1.497-.85-2.05-.224-.54-.453-.466-.62-.475-.161-.007-.345-.009-.53-.009-.184 0-.483.069-.737.345-.253.276-.966.945-.966 2.3 0 1.354.99 2.66 1.127 2.844.138.184 1.95 2.98 4.73 4.06.662.286 1.178.456 1.582.583.664.211 1.27.181 1.748.11.534-.08 1.637-.668 1.87-1.312.23-.644.23-1.196.161-1.312-.069-.115-.253-.184-.53-.322z"/></svg>
              <span className="text-xs">WhatsApp</span>
            </a>
            <a
              href={CONTACTS.phone}
              className="flex-1 flex flex-col items-center justify-center gap-1 bg-blue-600/90 hover:bg-blue-700 focus:bg-blue-800 text-white rounded-xl py-3 font-semibold transition-all duration-150 shadow-lg group"
              onClick={() => handleContactClick('phone')}
              tabIndex={0}
              title="Call us"
            >
              <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 32 32"><path strokeLinecap="round" strokeLinejoin="round" d="M6 7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2V7zm0 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2zm12-12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V7zm0 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span className="text-xs">Call</span>
            </a>
            <a
              href={CONTACTS.email}
              className="flex-1 flex flex-col items-center justify-center gap-1 bg-purple-600/90 hover:bg-purple-700 focus:bg-purple-800 text-white rounded-xl py-3 font-semibold transition-all duration-150 shadow-lg group"
              onClick={() => handleContactClick('email')}
              tabIndex={0}
              title="Email us"
            >
              <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 32 32"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8l12 8 12-8M4 8v16a2 2 0 002 2h16a2 2 0 002-2V8M4 8l12 8 12-8" /></svg>
              <span className="text-xs">Email</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
} 