import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShahadahRecorder } from '@/components/audio/shahadah-recorder';
import type { ModelReferenceAudio } from '@/lib/services/shahadah-service';

describe('ShahadahRecorder Component (Task 3.1 & 3.2)', () => {
  const mockTrackStop = vi.fn();
  const mockAudioContextClose = vi.fn();
  let originalMediaDevices: any;
  let originalMediaRecorder: any;
  let originalAudioContext: any;
  let originalCreateObjectURL: any;

  beforeEach(() => {
    vi.clearAllMocks();

    originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost:3000/mock-audio');

    originalMediaDevices = navigator.mediaDevices;
    (navigator as any).mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [
          {
            stop: mockTrackStop,
          },
        ],
      }),
    };

    // Mock MediaRecorder
    class MockMediaRecorder {
      state = 'inactive';
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      static isTypeSupported = vi.fn().mockReturnValue(true);

      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['audio-data'], { type: 'audio/webm' }) });
        }
        if (this.onstop) {
          this.onstop();
        }
      }
    }
    originalMediaRecorder = (window as any).MediaRecorder;
    (window as any).MediaRecorder = MockMediaRecorder;

    // Mock AudioContext
    class MockAudioContext {
      state = 'running';
      createMediaStreamSource() {
        return {
          connect: vi.fn(),
        };
      }
      createAnalyser() {
        return {
          fftSize: 64,
          frequencyBinCount: 32,
          smoothingTimeConstant: 0.8,
          getByteFrequencyData: (arr: Uint8Array) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = 128;
            }
          },
        };
      }
      close = mockAudioContextClose;
    }
    originalAudioContext = (window as any).AudioContext;
    (window as any).AudioContext = MockAudioContext;
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    (navigator as any).mediaDevices = originalMediaDevices;
    (window as any).MediaRecorder = originalMediaRecorder;
    (window as any).AudioContext = originalAudioContext;
    vi.restoreAllMocks();
  });

  it('renders authentic Arabic Shahadah text, transliteration, and 32-bar visualizer', () => {
    render(
      <ShahadahRecorder
        conversationId="conv-demo-1"
        seekerId="user-seeker-1"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText(/أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ/)).toBeInTheDocument();
    expect(
      screen.getByText(/Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan Rasulullah/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /real-time voice amplitude visualizer/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
  });

  it('handles recording lifecycle: start recording, stop recording, and displays preview', async () => {
    render(
      <ShahadahRecorder
        conversationId="conv-demo-1"
        seekerId="user-seeker-1"
        onSubmit={vi.fn()}
      />
    );

    const startBtn = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });

    const stopBtn = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /re-record/i })).toBeInTheDocument();
      expect(screen.getByText(/ready for review/i)).toBeInTheDocument();
    });

    expect(mockTrackStop).toHaveBeenCalled();
  });

  it('cleans up hardware tracks when component unmounts', async () => {
    const { unmount } = render(
      <ShahadahRecorder
        conversationId="conv-demo-1"
        seekerId="user-seeker-1"
        onSubmit={vi.fn()}
      />
    );

    const startBtn = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });

    unmount();
    expect(mockTrackStop).toHaveBeenCalled();
  });

  it('displays retake guidance banner and reference audio player when retakeFeedback is present', () => {
    const modelRef: ModelReferenceAudio = {
      language: 'en',
      audioUrl: '/audio/reference-shahadah-ar.webm',
      durationSeconds: 24,
      arabicScript: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
      phoneticGuide: 'Ash-hadu an la ilaha illa Allah',
      englishTranslation: 'I bear witness that there is no deity worthy of worship except Allah',
    };

    render(
      <ShahadahRecorder
        conversationId="conv-demo-1"
        seekerId="user-seeker-1"
        retakeFeedback="Please articulate the letter H clearly in Allah."
        modelReference={modelRef}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Pronunciation Guidance from Dialogist/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please articulate the letter H clearly in Allah./)
    ).toBeInTheDocument();
  });

  it('handles microphone permission denial gracefully and falls back to upload mode', async () => {
    const permissionError = new Error('Permission denied');
    permissionError.name = 'NotAllowedError';
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(permissionError);

    render(
      <ShahadahRecorder
        conversationId="conv-demo-1"
        seekerId="user-seeker-1"
        onSubmit={vi.fn()}
      />
    );

    const startBtn = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Microphone access was denied. Please use the file upload option./)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Click to choose an audio file or drag and drop/)
      ).toBeInTheDocument();
    });
  });

  it('demo shortcut button sets sample audio and enables submission', async () => {
    const mockSubmit = vi.fn();
    render(
      <ShahadahRecorder
        conversationId="conv-demo-1"
        seekerId="user-seeker-1"
        onSubmit={mockSubmit}
      />
    );

    const demoBtn = screen.getByRole('button', { name: /Demo: Use Jean-Luc Sample Voice/i });
    fireEvent.click(demoBtn);

    const submitBtn = screen.getByRole('button', { name: /submit shahadah declaration/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-demo-1',
        seekerId: 'user-seeker-1',
        audioDataUrl: '/audio/sample-shahadah-jean-luc.webm',
        durationSeconds: 18,
      })
    );
  });
});
