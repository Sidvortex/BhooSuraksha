/**
 * AI Landslide Assistant (Chatbot)
 * Context-aware disaster management assistant equipped with geotechnical knowledge,
 * live dashboard state querying, and emergency response guidelines.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MonitoredLocation } from '../types/landslide';
import { generateAiResponse, DEFAULT_SUGGESTED_PROMPTS } from '../services/aiChatService';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  MapPin, 
  ShieldAlert, 
  RotateCcw, 
  AlertTriangle, 
  HelpCircle,
  Cpu
} from 'lucide-react';

interface AiChatbotProps {
  locations: MonitoredLocation[];
  onSelectLocationById?: (locationId: string) => void;
}

export const AiChatbot: React.FC<AiChatbotProps> = ({
  locations,
  onSelectLocationById
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello, I am the **BhooSuraksha AI Assistant**. I continuously monitor telemetry across all 8 North Eastern Region states and can provide real-time risk assessments, geotechnical factor breakdowns, road vulnerability status, and disaster management response protocols.\n\nHow can I assist your operational team right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    // Call modular service (can switch to live Gemini API or local domain engine)
    try {
      const reply = await generateAiResponse(query, locations);
      const assistantMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: 'An error occurred querying the AI response engine. Please retry.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversation cleared. Ready for your queries regarding North East India slope hazards, rainfall triggers, or geofence perimeters.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div id="ai-chatbot-container" class="h-[650px] flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur overflow-hidden">
      {/* Chat Header */}
      <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div class="flex items-center gap-3">
          <div class="relative flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-lg">
            <Bot class="w-5 h-5" />
            <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-bold text-slate-50">AI Landslide Risk Assistant</h3>
              <span class="px-2 py-0.2 rounded text-xs font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                CONTEXT-AWARE
              </span>
            </div>
            <p class="text-xs text-slate-400">
              Answers geospatial, geotechnical, and disaster preparedness questions
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            onClick={clearChat}
            class="p-1.5 text-slate-400 hover:text-slate-50 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div class="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span class="text-slate-400 whitespace-nowrap flex items-center gap-1">
          <Sparkles class="w-3 h-3 text-indigo-400" />
          Suggested:
        </span>
        {DEFAULT_SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            class="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-50 border border-slate-700/60 whitespace-nowrap transition cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              class={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                class={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-700 text-white'
                    : 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300'
                }`}
              >
                {isUser ? <User class="w-4 h-4" /> : <Bot class="w-4 h-4" />}
              </div>

              <div
                class={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-700 text-white rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                <div class="whitespace-pre-line prose prose-invert max-w-none text-xs">
                  {msg.content}
                </div>
                <span
                  class={`text-xs font-mono block mt-1.5 ${
                    isUser ? 'text-blue-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 flex items-center justify-center shrink-0">
              <Bot class="w-4 h-4" />
            </div>
            <div class="bg-slate-950/80 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              <span class="text-xs text-slate-400 font-mono ml-1">Analyzing telemetry state...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Safety Notice Footer Banner */}
      <div class="px-4 py-1 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-400 text-center">
        *Advisory: AI responses provide operational decision support, not certified disaster evacuation directives.
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        class="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          id="chat-input-query"
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about Northeast India risks, rainfall thresholds, evacuation protocols..."
          class="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-200 text-xs rounded-xl px-4 py-2.5 outline-none transition"
        />
        <button
          id="btn-submit-chat-query"
          type="submit"
          disabled={!inputQuery.trim() || isTyping}
          class="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition shadow-lg cursor-pointer"
        >
          <Send class="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
