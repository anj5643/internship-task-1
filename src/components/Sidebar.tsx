import React, { useState } from 'react';
import { useChatStore, MODELS, SYSTEM_PROMPTS } from '../store/chatStore';
import { Plus, MessageSquare, Trash2, Edit2, Settings, ChevronLeft, ChevronRight, Check, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function Sidebar() {
  const { 
    chats, 
    activeChatId, 
    setActiveChat, 
    createChat, 
    deleteChat, 
    updateChatTitle,
    activeModel,
    setActiveModel,
    activeSystemPrompt,
    setActiveSystemPrompt,
    isSidebarOpen,
    toggleSidebar
  } = useChatStore();

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleEditSubmit = (id: string) => {
    if (editTitle.trim()) {
      updateChatTitle(id, editTitle.trim());
    }
    setEditingChatId(null);
  };

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-zinc-950/50 backdrop-blur-3xl text-zinc-300 flex flex-col border-r border-zinc-800/50 flex-shrink-0"
          >
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Bot size={20} className="text-white" />
                </div>
                <span className="font-display font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500">
                  Knowledge GPT
                </span>
              </div>
              <button
                onClick={createChat}
                className="flex items-center gap-2 w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-xl transition-all font-medium shadow-sm active:scale-95 border border-zinc-800/50 hover:border-zinc-700/50"
              >
                <Plus size={20} />
                New Chat
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center justify-between w-full px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800/80 rounded-lg transition-colors text-sm text-zinc-400 hover:text-zinc-200"
              >
                <span className="flex items-center gap-2"><Settings size={16} /> Configuration</span>
                <ChevronRight size={16} className={cn("transition-transform", showSettings && "rotate-90")} />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden flex flex-col gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500 uppercase font-semibold px-1 tracking-wider">Model</label>
                      <select 
                        value={activeModel}
                        onChange={(e) => setActiveModel(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                      >
                        {MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500 uppercase font-semibold px-1 tracking-wider">AI Mode</label>
                      <select 
                        value={activeSystemPrompt}
                        onChange={(e) => setActiveSystemPrompt(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                      >
                        {SYSTEM_PROMPTS.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mb-3 px-2">Recent Chats</div>
              <div className="flex flex-col gap-1">
                {chats.length === 0 && (
                  <div className="text-sm text-zinc-600 text-center py-8">No chats yet</div>
                )}
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    className={cn(
                      "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                      activeChatId === chat.id ? "bg-zinc-900/80 text-zinc-100 shadow-sm border border-zinc-800/50" : "hover:bg-zinc-900/50 text-zinc-400 border border-transparent"
                    )}
                  >
                    <MessageSquare size={18} className={cn("flex-shrink-0 transition-colors", activeChatId === chat.id ? "text-purple-400" : "text-zinc-600")} />
                    
                    <div className="flex-1 min-w-0">
                      {editingChatId === chat.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleEditSubmit(chat.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit(chat.id)}
                          className="w-full bg-zinc-950 border border-purple-500/50 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="truncate text-sm font-medium">{chat.title}</div>
                      )}
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                      </div>
                    </div>

                    <div className={cn(
                      "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                      activeChatId === chat.id && "opacity-100"
                    )}>
                      {editingChatId === chat.id ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditSubmit(chat.id); }}
                          className="p-1 hover:text-green-400 text-zinc-500 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChatId(chat.id);
                            setEditTitle(chat.title);
                          }}
                          className="p-1 hover:text-purple-400 text-zinc-500 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                        className="p-1 hover:text-red-400 text-zinc-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-10 p-2 bg-zinc-900/80 backdrop-blur-md text-zinc-300 rounded-xl hover:bg-zinc-800 hover:text-zinc-100 shadow-md border border-zinc-800/50 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </>
  );
}
