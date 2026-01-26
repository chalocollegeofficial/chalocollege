import React, { useMemo, useState } from 'react';
import { MessageCircle, Mic, Send, Volume2, VolumeX, X } from 'lucide-react';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 'intro',
      from: 'bot',
      text: 'Hi! Main AaoCollege assistant hoon. Courses, fees ya admission ke baare me pooch sakte ho.',
    },
  ]);

  const quickPrompts = useMemo(
    () => [
      'Top UG courses',
      'Fees range',
      'Admission process',
      'PG options',
      'Scholarship info',
    ],
    []
  );

  const quickLinks = useMemo(
    () => [
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'PG', href: '/get-pg' },
      { label: 'Colleges', href: '/colleges' },
      { label: 'Blog', href: '/blog' },
    ],
    []
  );

  const cannedReplies = useMemo(
    () => [
      {
        match: ['fee', 'fees', 'price', 'cost'],
        text: 'Fees college aur course ke hisab se change hoti hai. Aap kis course ka fees range chahte ho?',
      },
      {
        match: ['ug', 'undergraduate'],
        text: 'UG me BBA, BCA, B.Tech, BA, B.Com jaise options milte hain. Kya aapko kisi specific course me interest hai?',
      },
      {
        match: ['pg', 'postgraduate', 'mba', 'mca'],
        text: 'PG me MBA, MCA, M.Tech jaise programs popular hain. Aapka preferred PG course kaun sa hai?',
      },
      {
        match: ['admission', 'apply'],
        text: 'Admission process me counseling, document verification aur form fill shamil hota hai. Main aapko next steps bata sakta hoon.',
      },
      {
        match: ['course', 'courses'],
        text: 'Courses ke liye aap UG/PG choose karo aur specialization batao. Main aapko best options suggest kar dunga.',
      },
      {
        match: ['about', 'company', 'aaocollege'],
        text: 'AaoCollege students ko right college choose karne me help karta hai. Aap /about page dekh sakte ho.',
      },
      {
        match: ['services', 'service'],
        text: 'Services me counseling, shortlisting, aur admission support shamil hai. /services page par details milengi.',
      },
      {
        match: ['pg', 'hostel', 'pg listing'],
        text: 'PG listings ke liye /get-pg page open karo. Main location ke hisab se suggest bhi kar sakta hoon.',
      },
      {
        match: ['blog', 'news', 'article'],
        text: 'Latest guidance ke liye /blog page check karo.',
      },
    ],
    []
  );

  const pushMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  const respond = (text) => {
    const lower = text.toLowerCase();
    const match = cannedReplies.find((r) => r.match.some((m) => lower.includes(m)));
    return match?.text || 'Thanks! Aapka query note kar liya. Kya aap city ya course bhi bata sakte ho?';
  };

  const fetchGroqReply = async (text) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) return null;

    const recentMessages = messages
      .slice(-6)
      .map((m) => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    const body = {
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content:
            'You are AaoCollege assistant. Reply in simple Hinglish, be concise, helpful, and ask for missing details like course, city, or budget when needed.',
        },
        ...recentMessages,
        { role: 'user', content: text },
      ],
      temperature: 0.6,
      max_tokens: 256,
    };

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    return reply || null;
  };

  const speak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      pushMessage({
        id: `b-${Date.now()}`,
        from: 'bot',
        text: 'Sorry, voice input is not supported in this browser.',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setIsListening(false);
      if (transcript) handleSend(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleSend = async (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    pushMessage({ id: `u-${Date.now()}`, from: 'user', text: trimmed });
    setInput('');
    setIsTyping(true);

    try {
      const reply = (await fetchGroqReply(trimmed)) || respond(trimmed);
      pushMessage({ id: `b-${Date.now()}`, from: 'bot', text: reply });
      speak(reply);
    } catch (e) {
      const fallback = respond(trimmed);
      pushMessage({ id: `b-${Date.now()}`, from: 'bot', text: fallback });
      speak(fallback);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      <div
        className={`absolute bottom-16 right-0 w-[320px] sm:w-[360px] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.6)] transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-4'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div>
            <p className="text-sm font-semibold text-slate-900">AaoCollege Assistant</p>
            <p className="text-xs text-slate-500">Online - Replies instantly</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceEnabled((prev) => !prev)}
              className="p-1 rounded-lg hover:bg-slate-100"
              aria-label={voiceEnabled ? 'Mute voice' : 'Enable voice'}
              title={voiceEnabled ? 'Mute voice replies' : 'Enable voice replies'}
            >
              {voiceEnabled ? (
                <Volume2 className="h-4 w-4 text-slate-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100"
              aria-label="Close chat"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 max-h-[360px] overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.from === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-500 rounded-2xl px-3 py-2 text-xs">
                Typing...
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSend(p)}
                className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[11px] px-3 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-200">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(input);
            }}
            placeholder="Type your message..."
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={startVoiceInput}
            className={`h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center transition ${
              isListening ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'
            }`}
            aria-label="Voice input"
            title="Voice input"
          >
            <Mic className={`h-4 w-4 ${isListening ? 'text-blue-600' : 'text-slate-600'}`} />
          </button>
          <button
            type="button"
            onClick={() => handleSend(input)}
            className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`absolute bottom-0 right-0 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition ${
          isOpen ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'
        }`}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};

export default ChatbotWidget;
