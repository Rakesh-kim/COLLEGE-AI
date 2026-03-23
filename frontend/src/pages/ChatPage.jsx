import { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import useVoice from '../hooks/useVoice';
import { toast } from 'react-toastify';
import {
  RiSendPlane2Line, RiMic2Line, RiMicOffLine,
  RiRobot2Line, RiUser3Line, RiCheckDoubleLine
} from 'react-icons/ri';

// ─── Typing Indicator ───────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-2 animate-fade-in">
    <div className="w-7 h-7 rounded-full bg-primary-600/30 border border-primary-600/40 flex items-center justify-center text-primary-400 text-sm shrink-0">
      <RiRobot2Line />
    </div>
    <div className="bubble-ai flex gap-1.5 items-center px-4 py-3">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  </div>
);

// ─── Message Bubble ─────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0
        ${isUser ? 'bg-primary-600' : 'bg-primary-600/30 border border-primary-600/40 text-primary-400'}`}>
        {isUser ? <RiUser3Line /> : <RiRobot2Line />}
      </div>
      <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-white/50' : 'text-slate-500'}`}>
          {new Date(msg.timestamp || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

// ─── Suggestion Chips ───────────────────────────────
const SUGGESTIONS = [
  "I want to register for a hostel room",
  "What documents do I need to upload?",
  "Check my registration status",
  "I prefer a double room",
  "What are the hostel rules?",
];

// ─── Profile Panel ──────────────────────────────────
const ProfilePanel = ({ profile }) => {
  if (!profile) return null;
  const { completionFlags, completionPercent, registrationStatus } = profile;
  return (
    <div className="glass-card p-4 space-y-3 animate-fade-in">
      <p className="section-label">Registration Progress</p>
      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500 transition-all duration-700"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 text-right">{completionPercent}% complete</p>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(completionFlags).map(([key, done]) => (
          <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${done ? 'bg-emerald-900/30 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
            <RiCheckDoubleLine className={done ? 'text-emerald-400' : 'text-slate-600'} />
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        ))}
      </div>
      <div className="text-center">
        <span className={`badge badge-${registrationStatus}`}>
          {registrationStatus.charAt(0).toUpperCase() + registrationStatus.slice(1)}
        </span>
      </div>
    </div>
  );
};

// ─── Main Chat Page ──────────────────────────────────
export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Voice input: append transcript to input field
  const handleTranscript = useCallback((text) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
    inputRef.current?.focus();
  }, []);
  const { isListening, interimText, startListening, stopListening, supported } = useVoice(handleTranscript);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load chat history on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await chatAPI.getHistory();
        if (res.data.chatHistory.length > 0) {
          setMessages(res.data.chatHistory);
        } else {
          // Welcome message for new users
          setMessages([{
            role: 'assistant',
            content: `Hello ${user?.name}! 👋 I'm your Hostel AI assistant.\n\nI'm here to help you complete your hostel registration. Just chat with me like you would with a friend — I'll collect your details and guide you step by step.\n\nLet's start! Could you tell me your **roll number** and **course**?`,
            timestamp: new Date(),
          }]);
        }
      } catch {
        toast.error('Could not load chat history.');
      } finally {
        setHistoryLoaded(true);
      }
    };
    load();
  }, [user?.name]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');

    // Optimistically add user message
    const userMsg = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(trimmed);
      const aiMsg = { role: 'assistant', content: res.data.reply, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
      if (res.data.studentProfile) setProfile(res.data.studentProfile);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get AI response.');
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full gap-3 max-h-[calc(100vh-6rem)]">
      <div className="flex gap-3 flex-1 min-h-0">
        {/* ── Chat Column ── */}
        <div className="flex flex-col flex-1 glass-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary-600/30 border border-primary-600/40 flex items-center justify-center text-primary-400 text-lg">
              <RiRobot2Line />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Hostel AI Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
                <span className="text-xs text-slate-400">Online · Powered by GPT-4o</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {!historyLoaded ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                {loading && <TypingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              {SUGGESTIONS.slice(0, 3).map((s) => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary-600/40 text-primary-400 hover:bg-primary-600/20 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="px-4 pb-4 pt-2 border-t border-white/5 shrink-0">
            {interimText && (
              <p className="text-xs text-slate-500 mb-2 px-1 italic">🎤 {interimText}</p>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or use voice…"
                rows={1}
                className="input-field flex-1 resize-none min-h-[44px] max-h-[120px] py-2.5"
                style={{ height: 'auto' }}
                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
              />
              {/* Voice Button */}
              {supported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all
                    ${isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'border border-white/10 text-slate-400 hover:border-primary-600 hover:text-primary-400'}`}
                >
                  {isListening ? <RiMicOffLine /> : <RiMic2Line />}
                </button>
              )}
              {/* Send Button */}
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="btn-primary w-11 h-11 !px-0 flex items-center justify-center text-lg shrink-0">
                <RiSendPlane2Line />
              </button>
            </div>
          </div>
        </div>

        {/* ── Profile Panel (desktop only) ── */}
        <div className="hidden lg:flex flex-col w-72 gap-3 shrink-0 overflow-y-auto">
          {profile ? (
            <ProfilePanel profile={profile} />
          ) : (
            <div className="glass-card p-5 text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-sm font-medium text-white">Chat to Register</p>
              <p className="text-xs text-slate-400 mt-1">Your registration progress will appear here as you chat with the AI.</p>
            </div>
          )}
          {/* Quick suggestions (secondary) */}
          <div className="glass-card p-4">
            <p className="section-label mb-3">Quick Actions</p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs text-left px-3 py-2 rounded-lg border border-white/5 text-slate-400 hover:border-primary-600/40 hover:text-primary-400 hover:bg-primary-600/10 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
