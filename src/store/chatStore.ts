import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  model: string;
  systemPrompt?: string;
}

export const MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B' },
  { id: 'qwen-qwq-32b', name: 'Qwen QwQ 32B' },
];

export const SYSTEM_PROMPTS = [
  { id: 'general', name: 'General Assistant', prompt: 'You are a helpful, respectful and honest assistant.' },
  { id: 'coding', name: 'Coding Assistant', prompt: 'You are an expert software engineer. Provide clear, concise, and efficient code solutions. Explain complex logic briefly.' },
  { id: 'research', name: 'Research Assistant', prompt: 'You are a meticulous research assistant. Provide well-structured, accurate, and comprehensive information. Cite sources when possible.' },
  { id: 'teacher', name: 'Teacher', prompt: 'You are an encouraging and insightful teacher. Explain concepts clearly and adapt to the user\'s learning level.' },
  { id: 'interview', name: 'Interview Coach', prompt: 'You are an experienced technical and behavioral interview coach. Conduct mock interviews and provide constructive feedback.' },
  { id: 'study', name: 'Study Buddy', prompt: 'You are a supportive study buddy. Help the user quiz themselves, summarize topics, and stay focused.' },
];

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  activeModel: string;
  activeSystemPrompt: string;
  isSidebarOpen: boolean;
  createChat: () => void;
  setActiveChat: (id: string) => void;
  updateChatTitle: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'> & { id?: string }) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  setActiveModel: (modelId: string) => void;
  setActiveSystemPrompt: (promptId: string) => void;
  toggleSidebar: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      activeModel: MODELS[0].id,
      activeSystemPrompt: SYSTEM_PROMPTS[0].id,
      isSidebarOpen: true,

      createChat: () => {
        const { activeModel, activeSystemPrompt } = get();
        const newChat: Chat = {
          id: uuidv4(),
          title: 'New Chat',
          messages: [],
          updatedAt: Date.now(),
          model: activeModel,
          systemPrompt: activeSystemPrompt,
        };
        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChatId: newChat.id,
        }));
      },

      setActiveChat: (id) => set({ activeChatId: id }),

      updateChatTitle: (id, title) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, title } : c)),
        })),

      deleteChat: (id) =>
        set((state) => {
          const remainingChats = state.chats.filter((c) => c.id !== id);
          return {
            chats: remainingChats,
            activeChatId: state.activeChatId === id ? remainingChats[0]?.id || null : state.activeChatId,
          };
        }),

      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((c) => {
            if (c.id === chatId) {
              const newMessage: Message = {
                role: message.role,
                content: message.content,
                id: message.id || uuidv4(),
                timestamp: Date.now(),
              };
              // Update title for first user message
              const newTitle = c.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
                : c.title;

              return {
                ...c,
                title: newTitle,
                messages: [...c.messages, newMessage],
                updatedAt: Date.now(),
              };
            }
            return c;
          }),
        })),

      updateMessage: (chatId, messageId, content) =>
        set((state) => ({
          chats: state.chats.map((c) => {
            if (c.id === chatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, content } : m
                ),
                updatedAt: Date.now(),
              };
            }
            return c;
          }),
        })),

      deleteMessage: (chatId, messageId) =>
        set((state) => ({
          chats: state.chats.map((c) => {
            if (c.id === chatId) {
              return {
                ...c,
                messages: c.messages.filter((m) => m.id !== messageId),
                updatedAt: Date.now(),
              };
            }
            return c;
          }),
        })),

      setActiveModel: (modelId) => set({ activeModel: modelId }),
      
      setActiveSystemPrompt: (promptId) => set({ activeSystemPrompt: promptId }),

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: 'groq-chat-storage',
      partialize: (state) => ({ 
        chats: state.chats, 
        activeChatId: state.activeChatId,
        activeModel: state.activeModel,
        activeSystemPrompt: state.activeSystemPrompt,
        isSidebarOpen: state.isSidebarOpen
      }),
    }
  )
);
