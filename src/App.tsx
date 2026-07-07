/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { useEffect } from 'react';

export default function App() {
  // Apply dark mode based on system preference initially if wanted, or default to dark.
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-purple-500/30">
      <Sidebar />
      <ChatArea />
    </div>
  );
}
