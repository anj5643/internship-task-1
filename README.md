# Premium AI Chat Application

A modern, high-performance, and feature-rich AI chat interface powered by large language models. The application features a glassmorphic dark-theme UI, instant response streaming, interactive persona/system prompts, and persistent chat histories.

## Features

- **⚡ Real-Time Streaming:** Instant streaming responses utilizing Server-Sent Events (SSE).
- **🤖 Model Selection:** Seamlessly switch between multiple state-of-the-art models:
  - Llama 3.3 70B
  - Llama 3.1 8B
  - DeepSeek R1 Distill 70B
  - Qwen QwQ 32B
- **🎭 Customizable Personas:** Choose from built-in system prompts tailored for different use cases:
  - **General Assistant:** All-purpose helpful conversationalist.
  - **Coding Assistant:** Detailed and efficient programming logic.
  - **Research Assistant:** Comprehensive and structured summaries.
  - **Teacher:** Step-by-step explanations and learning support.
  - **Interview Coach:** Conducting mock interviews with feedback.
  - **Study Buddy:** Quiz builder and conceptual study aide.
- **💾 Local Persistence:** Automatic client-side state caching using Zustand (persisted across reloads).
- **🎨 Modern UI/UX:** A sleek dark-themed interface built with Tailwind CSS, utilizing `framer-motion` for fluid micro-animations.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion
- **Backend:** Express, Node.js, TSX, ESBuild
- **Integration:** Server-Sent Events (SSE) for seamless stream-handling

---

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory and define the required API credential:
   ```env
   GROQ_API_KEY=your_api_key_here
   ```

3. **Start the Development Server:**
   This starts both the Vite dev server and the backend proxy server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## Production Build

To build and run the optimized production application:

```bash
# Clean and bundle frontend and backend
npm run build

# Start the application in production mode
npm run start
```
