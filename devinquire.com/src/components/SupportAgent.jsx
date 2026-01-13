import React, { useState, useRef, useEffect } from 'react';
// Firebase Functions removed - implement alternative AI chat service

const FAQ = [
  { q: 'How can I contact support?', a: 'You can contact us via WhatsApp, phone, or email using the buttons below.' },
  { q: 'How do I post a blog?', a: 'Sign in as admin, go to the Admin Panel, and use the Blog Management section.' },
  { q: 'How do I reset my password?', a: 'Go to the login page and click "Forgot password?" or contact support.' },
  { q: 'What is Devinquire?', a: 'Devinquire is a modern platform for blogging, user management, and more.' },
];

const CONTACTS = {
    whatsapp: 'https://wa.me/918763155488',
    phone: 'tel:+918763155488',
  email: 'mailto:contact@devinquire.com',
};

function getBotReply(input) {
  input = input.toLowerCase();
  
  // Enhanced responses with emojis and better formatting
  if (input.includes('whatsapp')) return '💬 Click the WhatsApp button below to chat with us instantly! Our team is ready to help.';
  if (input.includes('call') || input.includes('phone')) return '📞 Click the Call button below to reach us by phone. We\'re here to assist you!';
  if (input.includes('email')) return '📧 Click the Email button below to send us a detailed message. We\'ll get back to you soon!';
  
  // Enhanced FAQ matching
  for (const { q, a } of FAQ) {
    if (input.includes(q.split(' ')[0].toLowerCase())) {
      return `💡 ${a}`;
    }
  }
  
  // More intelligent default responses
  const defaultResponses = [
    "🤖 I'm your DevInquire AI assistant! I can help with blog management, account issues, technical support, and more. What specific question do you have?",
    "✨ I'm here to make your DevInquire experience smooth! Whether it's about blogging, accounts, or technical help - just ask away!",
    "🎯 I'm designed to help you with all things DevInquire! Feel free to ask about our features or use the contact buttons below for human support."
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.className = 'fixed bottom-8 right-8 z-[9999] bg-[#0077b6] text-white px-6 py-3 rounded-xl shadow-2xl font-semibold text-base animate-fade-in-out';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = 0; }, 1800);
  setTimeout(() => { toast.remove(); }, 2200);
}

// TODO: Implement alternative AI chat service
// const aiChatFunction = alternativeAIService.chat;

export default function SupportAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! 👋 I\'m DevInquire AI, your intelligent assistant powered by advanced AI technology. I\'m here to help you with:\n\n🔹 Blog creation & management\n🔹 Account assistance\n🔹 Technical support\n🔹 Platform navigation\n\nWhat can I help you with today? ✨' },
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
      // TODO: Replace with alternative AI service call
      // const result = await aiChatFunction({ message: input });
      // For now, use local bot reply
      const reply = getBotReply(input);
      showTypingEffect(reply);
    } catch (err) {
      console.error('AI chat error:', err);
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
        className="fixed bottom-6 right-6 z-50 bg-[#0077b6] text-white rounded-xl shadow-xl p-2 hover:p-2.5 flex items-center justify-center gap-2 hover:scale-105 transition-all duration-300 focus:outline-none group border border-white/20 backdrop-blur-sm overflow-hidden"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open DevInquire AI Support Chat"
        style={{ boxShadow: '0 8px 32px rgba(80,0,200,0.18)' }}
      >
        {/* DevInquire Logo - Always Visible */}
        <div className="relative z-10 flex items-center justify-center text-white font-bold text-sm pl-2">
          <span className="text-white/80 mr-0.5 text-xs">&#123;</span>
          <span className="text-white font-bold">DI</span>
          <span className="text-white/80 ml-0.5 text-xs">&#125;</span>
        </div>

        {/* Text - Appears on Hover */}
        <span className="font-semibold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[120px] overflow-hidden transition-all duration-300 ease-in-out group-hover:text-blue-100">
          DevInquire AI
        </span>
      </button>
      {/* Chat Widget */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-72 max-w-[95vw] bg-white/95 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/50 flex flex-col animate-slide-up" style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/20 bg-[#0077b6] rounded-t-3xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-[#0077b6]/20"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 bg-[#0077b6] rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4.28 1.07a1 1 0 01-1.22-1.22l1.07-4.28A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <div>
                <span className="font-bold text-white drop-shadow-sm text-xl tracking-tight">DevInquire Support</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
                  <span className="text-white/90 text-sm font-medium">Online now</span>
                </div>
              </div>
            </div>
            <button 
               onClick={() => setOpen(false)} 
               className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2.5 transition-all duration-200 backdrop-blur-sm relative z-10 group"
               aria-label="Close chat"
             >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div ref={chatRef} className="flex-1 px-3 py-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent bg-white/50" style={{ maxHeight: 280 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`rounded-lg px-2.5 py-1.5 max-w-[85%] text-xs leading-relaxed shadow-sm ${msg.from === 'user' ? 'bg-[#0077b6] text-white shadow-lg border border-blue-500/20' : 'bg-white/95 text-slate-700 border border-slate-200/50 backdrop-blur-sm shadow-md'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start animate-fade-in">
                <div className="rounded-lg px-2.5 py-1.5 max-w-[85%] text-xs shadow-sm bg-white/95 text-slate-700 border border-slate-200/50 backdrop-blur-sm">
                  {typingText}<span className="animate-pulse text-blue-600 font-semibold">|</span>
                </div>
              </div>
            )}
            {loading && !typing && (
              <div className="flex justify-start animate-fade-in">
                <div className="rounded-lg px-2.5 py-1.5 max-w-[85%] text-xs shadow-sm bg-white/95 text-slate-700 border border-slate-200/50 backdrop-blur-sm flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span className="text-slate-600 font-medium">Thinking...</span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-2 border-t border-slate-200/30 bg-white/90 backdrop-blur-sm">
            <div className="flex-1 relative">
              <input
                 type="text"
                 className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white/95 text-slate-800 placeholder-slate-500 transition-all duration-200 backdrop-blur-sm shadow-sm text-xs"
                 placeholder="Type your message..."
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 autoFocus
                 disabled={typing}
               />
              {input && (
                 <button
                   type="button"
                   onClick={() => setInput('')}
                   className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               )}
            </div>
            <button 
               type="submit" 
               disabled={!input.trim() || typing}
               className="bg-[#0077b6] hover:bg-[#005a8a] text-white px-3 py-1.5 rounded-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5 border border-blue-500/20 text-xs"
             >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                 </svg>
               )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <div className="flex justify-between gap-1.5 px-3 py-2 border-t border-slate-200/30 bg-white/80 backdrop-blur-sm rounded-b-2xl">
            <a
               href={CONTACTS.whatsapp}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-800 text-white rounded-lg py-2 font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 group backdrop-blur-sm border border-emerald-500/20"
               onClick={() => handleContactClick('whatsapp')}
               tabIndex={0}
               title="Chat on WhatsApp"
             >
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-200 shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 32 32"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.607 1.938 6.563L4 29l7.625-1.938A12.93 12.93 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22.75c-1.98 0-3.92-.52-5.625-1.5l-.4-.23-4.5 1.145 1.145-4.5-.23-.4A10.72 10.72 0 015.25 15c0-5.93 4.82-10.75 10.75-10.75S26.75 9.07 26.75 15 21.93 25.75 16 25.75zm5.07-7.13c-.277-.138-1.637-.808-1.89-.9-.253-.092-.437-.138-.62.138-.184.277-.713.9-.875 1.085-.161.184-.322.207-.6.069-.277-.138-1.17-.432-2.23-1.377-.824-.735-1.38-1.64-1.542-1.917-.161-.277-.017-.426.122-.563.126-.125.277-.322.415-.483.138-.161.184-.276.276-.46.092-.184.046-.345-.023-.483-.069-.138-.62-1.497-.85-2.05-.224-.54-.453-.466-.62-.475-.161-.007-.345-.009-.53-.009-.184 0-.483.069-.737.345-.253.276-.966.945-.966 2.3 0 1.354.99 2.66 1.127 2.844.138.184 1.95 2.98 4.73 4.06.662.286 1.178.456 1.582.583.664.211 1.27.181 1.748.11.534-.08 1.637-.668 1.87-1.312.23-.644.23-1.196.161-1.312-.069-.115-.253-.184-.53-.322z" /></svg>
              </div>
              <span className="text-[10px] font-bold tracking-wide">WhatsApp</span>
            </a>
            <a
               href={CONTACTS.phone}
               className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-[#0077b6] hover:bg-[#005a8a] focus:bg-slate-900 text-white rounded-lg py-2 font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 group backdrop-blur-sm border border-blue-600/20"
               onClick={() => handleContactClick('phone')}
               tabIndex={0}
               title="Call us"
             >
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-200 shadow-sm">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <span className="text-[10px] font-bold tracking-wide">Call</span>
            </a>
            <a
               href={CONTACTS.email}
               className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-purple-700 hover:bg-purple-800 focus:bg-slate-900 text-white rounded-lg py-2 font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 group backdrop-blur-sm border border-purple-600/20"
               onClick={() => handleContactClick('email')}
               tabIndex={0}
               title="Email us"
             >
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-200 shadow-sm">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-[10px] font-bold tracking-wide">Email</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}