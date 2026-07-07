import React, { useState } from 'react';
import { Message } from '../store/chatStore';
import { cn } from '../lib/utils';
import { Bot, User, Copy, RefreshCw, Volume2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  isLast?: boolean;
}

export function ChatMessage({ message, onRegenerate, isLast }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex w-full py-8 px-4 md:px-6 lg:px-8 group transition-colors hover:bg-zinc-900/20">
      <div className="max-w-4xl mx-auto w-full flex gap-4 md:gap-6">
        <div className="flex-shrink-0 mt-1">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ring-1 ring-white/10",
            isUser ? "bg-zinc-800" : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-purple-500/20"
          )}>
            {isUser ? <User size={18} /> : <Bot size={18} />}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="font-semibold text-[13px] tracking-wide text-zinc-400">
            {isUser ? 'YOU' : 'KNOWLEDGE GPT'}
          </div>
          
          <div className="prose prose-sm md:prose-base prose-zinc dark:prose-invert max-w-none break-words leading-relaxed text-zinc-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="relative rounded-xl overflow-hidden my-6 border border-zinc-800 shadow-2xl">
                      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 text-zinc-400 text-xs font-mono">
                        <span>{match[1]}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                          className="hover:text-zinc-100 transition-colors flex items-center gap-1.5"
                        >
                          <Copy size={12} /> Copy code
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        className="!m-0 !bg-[#0d0d0d] !p-4 !text-[13px]"
                        {...props}
                      >
                        {String(children).replace(/\\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className={cn("bg-zinc-800/60 text-zinc-200 rounded-md px-1.5 py-0.5 text-[13px] border border-zinc-700/50", className)} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content || '...'}
            </ReactMarkdown>
          </div>

          <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
              title="Copy"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleSpeak}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                speaking 
                  ? "text-purple-400 bg-purple-500/10" 
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
              )}
              title={speaking ? "Stop speaking" : "Speak"}
            >
              <Volume2 size={14} />
            </button>
            {!isUser && isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
                title="Regenerate"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
