import React, { useState, useRef, useEffect } from 'react';
import { useChatStore, SYSTEM_PROMPTS } from '../store/chatStore';
import { ChatMessage } from './ChatMessage';
import { Send, Square, Mic, MicOff, AlertCircle, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function ChatArea() {
  const { chats, activeChatId, activeModel, activeSystemPrompt, addMessage, updateMessage, toggleSidebar, isSidebarOpen } = useChatStore();
  
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // STT Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
           setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
       if (recognitionRef.current && isListening) {
         recognitionRef.current.stop();
       }
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition not supported in this browser.");
      }
    }
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || !activeChatId) return;

    const userMessageContent = textToSend.trim();
    setInput('');
    setError(null);
    setIsGenerating(true);

    // Add user message
    addMessage(activeChatId, { role: 'user', content: userMessageContent });
    
    // Create placeholder for assistant message with a static unique ID
    const tempAssistantId = crypto.randomUUID();
    addMessage(activeChatId, { role: 'assistant', content: '', id: tempAssistantId });
    
    let fullContent = '';

    abortControllerRef.current = new AbortController();

    try {
      const systemPrmptObj = SYSTEM_PROMPTS.find(p => p.id === (activeChat?.systemPrompt || activeSystemPrompt));
      const sysMsg = { role: 'system', content: systemPrmptObj?.prompt || SYSTEM_PROMPTS[0].prompt };
      
      const apiMessages = [sysMsg, ...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMessageContent }];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeChat?.model || activeModel,
          messages: apiMessages,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No reader");

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.content) {
                fullContent += data.content;
                updateMessage(activeChatId, tempAssistantId, fullContent);
              }
            } catch (e) {
              // Ignore partial parse failures
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Chat error:", err);
        setError(err.message || "An error occurred while generating the response.");
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRegenerate = () => {
    if (!activeChatId || messages.length < 2) return;
    const lastUserMsg = messages.slice().reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
       handleSend(lastUserMsg.content);
    }
  };

  if (!activeChatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-500">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/20">
            <Bot size={32} />
          </div>
          <h2 className="font-display text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-3 tracking-tight">Knowledge GPT</h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-[260px] mx-auto leading-relaxed">
            Experience lightning-fast AI capabilities. Select a model and start a conversation.
          </p>
          <button 
            onClick={() => useChatStore.getState().createChat()}
            className="px-8 py-3.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-full font-medium transition-all shadow-md shadow-zinc-100/10 active:scale-95"
          >
            Create New Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
      
      {/* Header for mobile */}
      {!isSidebarOpen && (
        <div className="h-14 border-b border-zinc-800/50 flex items-center px-4 md:hidden">
            <span className="font-semibold text-zinc-200 truncate">{activeChat?.title}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <Bot size={48} className="mb-4 opacity-20" />
            <p>Send a message to start the conversation.</p>
          </div>
        ) : (
          <div className="pb-32 flex flex-col">
            {messages.map((msg, idx) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                isLast={idx === messages.length - 1}
                onRegenerate={handleRegenerate}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 text-red-400 p-3 flex items-center justify-center gap-2 text-sm border-t border-red-500/20">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline hover:text-red-300">Dismiss</button>
        </div>
      )}

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 lg:left-80 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent p-4 md:p-6 transition-all duration-300" style={{ left: isSidebarOpen ? '320px' : '0' }}>
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-zinc-900/50 backdrop-blur-2xl border border-zinc-800/50 rounded-2xl p-2 shadow-2xl focus-within:ring-1 focus-within:ring-purple-500/30 focus-within:border-purple-500/50 transition-all">
          
          <button
            onClick={toggleListen}
            className={cn(
              "p-3 rounded-xl transition-all flex-shrink-0",
              isListening ? "bg-red-500/20 text-red-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
            title={isListening ? "Stop listening" : "Start speaking"}
          >
            {isListening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Knowledge GPT..."
            className="flex-1 max-h-48 min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-zinc-100 placeholder-zinc-500 text-[15px]"
            rows={1}
            disabled={isGenerating}
          />

          {isGenerating ? (
            <button
              onClick={handleStop}
              className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all flex-shrink-0 shadow-sm active:scale-95 border border-zinc-700"
              title="Stop generating"
            >
              <Square size={20} className="fill-current" />
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-3 bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-zinc-100 disabled:cursor-not-allowed rounded-xl transition-all flex-shrink-0 shadow-sm active:scale-95"
              title="Send message"
            >
              <Send size={20} />
            </button>
          )}
        </div>
        <div className="text-center text-[11px] text-zinc-500 mt-3 font-medium tracking-wide">
          Knowledge GPT can make mistakes. Consider verifying important information.
        </div>
      </div>
    </div>
  );
}
