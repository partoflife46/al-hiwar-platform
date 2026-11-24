'use client';

/**
 * UI presentation module for chat window within the chat workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/chat/chat-window
 * @exports ChatWindow
 */

import * as React from "react";
import { useChatWindow, type ChatWindowProps } from "@/hooks/use-chat-window";
import { ChatHeader } from "./chat-header";
import { ChatTimeline } from "./chat-timeline";
import { ChatComposer } from "./chat-composer";

export type { ChatWindowProps };

/**
 * Private consultation chat window composed of header, live message timeline, and composer.
 */
export function ChatWindow(props: ChatWindowProps) {
  const ctx = useChatWindow(props);

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-7.5rem)] min-h-[420px] max-w-5xl mx-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      <ChatHeader ctx={ctx} />
      <ChatTimeline ctx={ctx} />
      <ChatComposer ctx={ctx} />
    </div>
  );
}
