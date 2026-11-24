import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatWindow } from '@/components/chat/chat-window';
import type { Conversation, Message, PredefinedMessage, UserSession } from '@/lib/db/types';

// Mock EventSource class
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, ((event: any) => void)[]> = {};
  readyState = 1;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, callback: (event: any) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(callback);
  }

  removeEventListener(type: string, callback: (event: any) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((cb) => cb !== callback);
    }
  }

  emit(type: string, data: any) {
    const event = { data: JSON.stringify(data) };
    this.listeners[type]?.forEach((cb) => cb(event));
  }

  close() {
    this.readyState = 2;
  }
}

describe('ChatWindow Component (Task 2.3)', () => {
  const originalEventSource = (globalThis as any).EventSource;

  beforeEach(() => {
    MockEventSource.instances = [];
    (globalThis as any).EventSource = MockEventSource;
    (window as any).EventSource = MockEventSource;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    (globalThis as any).EventSource = originalEventSource;
    (window as any).EventSource = originalEventSource;
    vi.restoreAllMocks();
  });

  const baseConversation: Conversation = {
    id: 'conv-demo-1',
    nonMuslimId: 'user-seeker-1',
    dialogistId: 'user-dialogist-1',
    language: 'en',
    intent: 'LEARN_ABOUT_ISLAM',
    status: 'ACTIVE',
    isAssigned: true,
    inactivityNoticeSent: false,
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const dialogistUser: UserSession = {
    userId: 'user-dialogist-1',
    email: 'dialogist@iu.edu.sa',
    firstName: 'Sheikh Ahmad',
    surname: 'Al-Madani',
    role: 'DIALOGIST',
    preferredLanguage: 'en',
    token: 'token-dialogist',
  };

  const seekerUser: UserSession = {
    userId: 'user-seeker-1',
    email: 'seeker@example.com',
    firstName: 'Jean-Luc',
    surname: 'Dubois',
    role: 'NON_MUSLIM',
    preferredLanguage: 'fr',
    token: 'token-seeker',
  };

  const seekerProfile = {
    firstName: 'Jean-Luc',
    surname: 'Dubois',
    email: 'seeker@example.com',
    phoneNumber: '+33 6 12 34 56 78',
    nationality: 'France',
    dateOfBirth: '1999-05-14',
    preferredLanguage: 'fr' as const,
  };

  const sampleApprovedReplies: PredefinedMessage[] = [
    {
      id: 'pm-1',
      shortcut: '/greeting-welcome',
      category: 'GREETING',
      bodyEn: 'Peace be upon you! Welcome to the Al Hiwar Center.',
      bodyFr: 'Que la paix soit sur vous! Bienvenue au centre Al Hiwar.',
      authorId: 'user-instructor-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'pm-2',
      shortcut: '/theology-tawhid',
      category: 'THEOLOGY',
      bodyEn: 'At the heart of Islam is Tawhid—the pure belief in One God.',
      bodyFr: 'Au cœur de l’Islam se trouve le Tawhid—la croyance en un Dieu Unique.',
      authorId: 'user-instructor-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      createdAt: new Date().toISOString(),
    },
  ];

  it('subscribes to SSE stream on mount and closes connection on unmount', () => {
    const { unmount } = render(
      <ChatWindow conversation={baseConversation} currentUser={dialogistUser} />
    );

    expect(MockEventSource.instances.length).toBe(1);
    expect(MockEventSource.instances[0].url).toBe('/api/chat/stream?conversationId=conv-demo-1');

    unmount();
    expect(MockEventSource.instances[0].readyState).toBe(2);
  });

  it('renders distinctive bubble styling for Seeker vs Dialogist', () => {
    const messages: Message[] = [
      {
        id: 'msg-1',
        conversationId: 'conv-demo-1',
        senderId: 'user-seeker-1',
        content: 'Seeker test message',
        predefinedReplyId: null,
        hasVoiceNote: false,
        sentAt: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        conversationId: 'conv-demo-1',
        senderId: 'user-dialogist-1',
        content: 'Dialogist test message',
        predefinedReplyId: null,
        hasVoiceNote: false,
        sentAt: new Date().toISOString(),
      },
    ];

    render(
      <ChatWindow
        conversation={baseConversation}
        currentUser={dialogistUser}
        initialMessages={messages}
      />
    );

    const seekerMsg = screen.getByText('Seeker test message');
    expect(seekerMsg.closest('div')).toHaveClass('bg-[#006C9C]');
    expect(seekerMsg.closest('div')).toHaveClass('text-white');

    const dialogistMsg = screen.getByText('Dialogist test message');
    expect(dialogistMsg.closest('div')).toHaveClass('bg-[#F8FAFC]');
    expect(dialogistMsg.closest('div')).toHaveClass('text-[#082233]');
  });

  it('renders 120-second inactivity watchdog reassurance banner in warm amber (#D97706)', () => {
    render(
      <ChatWindow
        conversation={{ ...baseConversation, inactivityNoticeSent: true }}
        currentUser={seekerUser}
      />
    );

    const banner = screen.getByText(
      /All specialists are currently engaged\. Your chat remains open and a specialist will join shortly\./i
    );
    expect(banner).toBeInTheDocument();
    expect(banner.closest('div')).toHaveClass('text-[#D97706]');
  });

  it('renders quick reply category tabs and dispatches canned reply in 1 click', async () => {
    const handleSend = vi.fn().mockResolvedValue(undefined);

    render(
      <ChatWindow
        conversation={baseConversation}
        currentUser={dialogistUser}
        approvedQuickReplies={sampleApprovedReplies}
        onSendMessage={handleSend}
      />
    );

    expect(screen.getByRole('button', { name: '/greeting' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '/theology' })).toBeInTheDocument();

    const pill = screen.getByTitle('Peace be upon you! Welcome to the Al Hiwar Center.');
    await act(async () => {
      fireEvent.click(pill);
    });

    expect(handleSend).toHaveBeenCalledWith(
      'Peace be upon you! Welcome to the Al Hiwar Center.',
      'pm-1'
    );
  });

  it('dispatches custom typed message through emergency direct typing seam', async () => {
    const handleSend = vi.fn().mockResolvedValue(undefined);

    render(
      <ChatWindow
        conversation={baseConversation}
        currentUser={dialogistUser}
        onSendMessage={handleSend}
      />
    );

    const textarea = screen.getByPlaceholderText('Type custom theological response…');
    fireEvent.change(textarea, { target: { value: 'Direct theological clarification' } });

    const sendBtn = screen.getByRole('button', { name: /send message/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    expect(handleSend).toHaveBeenCalledWith('Direct theological clarification');
  });

  it('enforces PII masking in Dialogist view, hiding email, phone, DOB, and nationality', () => {
    render(
      <ChatWindow
        conversation={baseConversation}
        currentUser={dialogistUser}
        seekerProfile={seekerProfile}
      />
    );

    // First name visible
    expect(screen.getByText('Jean-Luc')).toBeInTheDocument();

    // Sensitive PII redacted from document
    expect(screen.queryByText('seeker@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('+33 6 12 34 56 78')).not.toBeInTheDocument();
    expect(screen.queryByText('1999-05-14')).not.toBeInTheDocument();
    expect(screen.queryByText('France')).not.toBeInTheDocument();

    // Scrim indicator visible
    expect(screen.getByText(/Verified Adult Inquirer \(PII Scrim Active\)/i)).toBeInTheDocument();
  });

  it('unmasks PII in Supervisor Audit mode and disables messaging controls', () => {
    const supervisorUser: UserSession = {
      userId: 'user-supervisor-1',
      email: 'supervisor@iu.edu.sa',
      firstName: 'Prof. Khalid',
      surname: 'Al-Qasim',
      role: 'SUPERVISOR',
      preferredLanguage: 'en',
      token: 'token-supervisor',
    };

    render(
      <ChatWindow
        conversation={baseConversation}
        currentUser={supervisorUser}
        seekerProfile={seekerProfile}
        auditMode={true}
      />
    );

    // Unmasked full name and PII visible
    expect(screen.getByText('Jean-Luc Dubois')).toBeInTheDocument();
    expect(screen.getByText(/seeker@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/1999-05-14/)).toBeInTheDocument();
    expect(screen.getByText(/France/)).toBeInTheDocument();

    // Inputs disabled
    expect(screen.getByText(/Messaging controls are disabled in audit mode/i)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Type custom theological response...')
    ).not.toBeInTheDocument();
  });

  it('renders audio voice note card with HTML5 audio player and status badge', () => {
    const voiceMessage: Message = {
      id: 'msg-voice-1',
      conversationId: 'conv-demo-1',
      senderId: 'user-seeker-1',
      content: 'Shahadah voice note',
      hasVoiceNote: true,
      audioUrl: '/audio/sample-shahadah-jean-luc.webm',
      sentAt: new Date().toISOString(),
    };

    render(
      <ChatWindow
        conversation={baseConversation}
        currentUser={dialogistUser}
        initialMessages={[voiceMessage]}
      />
    );

    expect(screen.getByText('Shahadah Audio Declaration')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('renders automated two-option consultation prompt in chat and dispatches seeker choice to history', async () => {
    const handleSend = vi.fn().mockResolvedValue(undefined);
    const promptMsg: Message = {
      id: 'msg-intent-prompt-conv-demo-1',
      conversationId: 'conv-demo-1',
      senderId: 'system',
      messageType: 'INTENT_PROMPT',
      content: 'Choose your consultation purpose',
      hasVoiceNote: false,
      sentAt: new Date().toISOString(),
    };

    render(
      <ChatWindow
        conversation={baseConversation}
        currentUser={seekerUser}
        initialMessages={[promptMsg]}
        onSendMessage={handleSend}
      />
    );

    const learnBtn = screen.getByRole('button', { name: /I want to know more about Islam/i });
    const embraceBtn = screen.getByRole('button', { name: /I want to embrace Islam \(Declare Shahadah\)/i });

    expect(learnBtn).toBeInTheDocument();
    expect(embraceBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(embraceBtn);
    });
    expect(handleSend).toHaveBeenCalledWith('I want to embrace Islam (Declare Shahadah)');
  });
});
