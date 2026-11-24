/**
 * React hook managing microphone recording, live FFT waveform bars, and file upload fallback.
 */

'use client';

/**
 * Module architecture and API reference for `src/hooks/use-audio-recorder.ts`.
 *
 * Exported symbols:
 * - `AudioRecorderStatus` (TypeAlias): audio recorder status definition.
 * - `UseAudioRecorderOptions` (Interface): use audio recorder options definition.
 * - `UseAudioRecorderReturn` (Interface): use audio recorder return definition.
 * - `useAudioRecorder` (Function): use audio recorder definition.
 *
 * Internal dependencies:
 * - `./audio/wav-encoder`
 *
 * @module hooks/use-audio-recorder
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import {
  convertBlobToPlayableDataUrl,
  describeMicrophoneError,
  formatSecondsToTime,
  negotiateAudioMimeType,
} from './audio/wav-encoder';

export {
  convertBlobToPlayableDataUrl,
  formatSecondsToTime,
  negotiateAudioMimeType,
};

/**
 * Type alias representing audio recorder status.
 */
export type AudioRecorderStatus = 'idle' | 'recording' | 'recorded' | 'error';

/**
 * Type contract defining use audio recorder options.
 * Includes fields/members: maxDurationSeconds, fftSize, smoothingTimeConstant.
 */
export interface UseAudioRecorderOptions {
  maxDurationSeconds?: number;
  fftSize?: number;
  smoothingTimeConstant?: number;
}

/**
 * Type contract defining use audio recorder return.
 */
export interface UseAudioRecorderReturn {
  /** status property. */
  status: AudioRecorderStatus;
  /** recording time property. */
  recordingTime: number;
  /** formatted time property. */
  formattedTime: string;
  /** waveform bars property. */
  waveformBars: number[];
  /** audio blob property. */
  audioBlob: Blob | null;
  /** audio url property. */
  audioUrl: string | null;
  /** audio base64 property. */
  audioBase64: string | null;
  /** mime type property. */
  mimeType: string;
  /** is mic available property. */
  isMicAvailable: boolean;
  /** error message property. */
  errorMessage: string | null;
  /** fallback active property. */
  fallbackActive: boolean;
  /** start recording property. */
  startRecording: () => Promise<void>;
  /** stop recording property. */
  stopRecording: () => void;
  /** reset recording property. */
  resetRecording: () => void;
  /** handle file upload property. */
  handleFileUpload: (file: File) => Promise<boolean>;
  /** set sample audio property. */
  setSampleAudio: (url: string, durationSeconds?: number) => void;
}

/**
 * Renders the idle bars interface component.
 */
const IDLE_BARS = () => new Array(32).fill(0.08);
/**
 * Constant definition for audio ext regex.
 */
const AUDIO_EXT_REGEX = /\.(webm|mp4|aac|wav|m4a|ogg|mp3)$/i;
/**
 * Constant definition for max upload bytes.
 */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Attaches a Web Audio AnalyserNode to update 32-bar waveform amplitudes per frame. */
function attachWaveformAnalyser(
  stream: MediaStream,
  fftSize: number,
  smoothingTimeConstant: number,
  isRecordingRef: React.MutableRefObject<boolean>,
  refs: {
    audioContextRef: React.MutableRefObject<AudioContext | null>;
    analyserRef: React.MutableRefObject<AnalyserNode | null>;
    animationFrameRef: React.MutableRefObject<number | null>;
  },
  onBars: (bars: number[]) => void
) {
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtxClass) return;

    const audioCtx = new AudioCtxClass();
    refs.audioContextRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    source.connect(analyser);
    refs.analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    isRecordingRef.current = true;

    /**
     * Executes tick logic.
     */
    const tick = () => {
      if (!isRecordingRef.current || !refs.analyserRef.current) return;
      refs.analyserRef.current.getByteFrequencyData(dataArray);
      const bars = Array.from(dataArray.slice(0, 32)).map((v) =>
        Math.max(0.08, Math.min(1.0, v / 255))
      );
      while (bars.length < 32) bars.push(0.08);
      onBars(bars);
      refs.animationFrameRef.current = requestAnimationFrame(tick);
    };
    refs.animationFrameRef.current = requestAnimationFrame(tick);
  } catch {
    // Analyser visualization is optional
  }
}

/** Manages browser microphone capture, WAV transcoding, and audio file upload fallback. */
export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const {
    maxDurationSeconds = 120,
    fftSize = 64,
    smoothingTimeConstant = 0.8,
  } = options;

  const [status, setStatus] = React.useState<AudioRecorderStatus>('idle');
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [waveformBars, setWaveformBars] = React.useState<number[]>(IDLE_BARS);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [audioBase64, setAudioBase64] = React.useState<string | null>(null);
  const [mimeType, setMimeType] = React.useState('audio/webm;codecs=opus');
  const [isMicAvailable, setIsMicAvailable] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fallbackActive, setFallbackActive] = React.useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const isRecordingRef = React.useRef(false);

  /**
   * Memoized handler/selector for release hardware.
   */
  const releaseHardware = React.useCallback(() => {
    isRecordingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // ignore track stop errors
      }
    });
    streamRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore close errors
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => () => releaseHardware(), [releaseHardware]);

  /**
   * Memoized handler/selector for stop recording.
   */
  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore stop race
      }
      return;
    }
    releaseHardware();
    setStatus('idle');
  }, [releaseHardware]);

  /**
   * Memoized handler/selector for start recording.
   */
  const startRecording = React.useCallback(async () => {
    releaseHardware();
    setErrorMessage(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    chunksRef.current = [];

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setIsMicAvailable(false);
      setFallbackActive(true);
      setErrorMessage(
        'Audio recording is not supported in this environment. Please upload an audio file.'
      );
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const negotiated = negotiateAudioMimeType();
      setMimeType(negotiated);

      const recorder = new MediaRecorder(
        stream,
        negotiated ? { mimeType: negotiated } : undefined
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, {
          type: negotiated || 'audio/webm',
        });
        setAudioBlob(finalBlob);
        setAudioUrl(URL.createObjectURL(finalBlob));
        setStatus('recorded');
        releaseHardware();

        convertBlobToPlayableDataUrl(finalBlob)
          .then((res) => {
            if (!res) return;
            setAudioBase64(res.dataUrl);
            setMimeType(res.mimeType);
            if (
              res.mimeType === 'audio/wav' &&
              res.dataUrl.startsWith('data:audio/wav')
            ) {
              setAudioUrl(res.dataUrl);
            }
          })
          .catch(() => {});
      };

      attachWaveformAnalyser(
        stream,
        fftSize,
        smoothingTimeConstant,
        isRecordingRef,
        { audioContextRef, analyserRef, animationFrameRef },
        setWaveformBars
      );

      recorder.start(100);
      setStatus('recording');

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      releaseHardware();
      setIsMicAvailable(false);
      setFallbackActive(true);
      setErrorMessage(describeMicrophoneError(err));
      setStatus('error');
    }
  }, [maxDurationSeconds, fftSize, smoothingTimeConstant, releaseHardware, stopRecording]);

  /**
   * Memoized handler/selector for reset recording.
   */
  const resetRecording = React.useCallback(() => {
    releaseHardware();
    setStatus('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setErrorMessage(null);
    setWaveformBars(IDLE_BARS());
  }, [releaseHardware]);

  /**
   * Memoized handler/selector for handle file upload.
   */
  const handleFileUpload = React.useCallback(
    async (file: File): Promise<boolean> => {
      resetRecording();
      if (!file) return false;

      const isAudio =
        file.type.startsWith('audio/') || AUDIO_EXT_REGEX.test(file.name);
      if (!isAudio) {
        setErrorMessage(
          'Invalid file format. Please upload an audio file (e.g. .webm, .wav, .mp3, .m4a).'
        );
        setStatus('error');
        return false;
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        setErrorMessage('Audio file size exceeds 25MB limit.');
        setStatus('error');
        return false;
      }

      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));

      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') setAudioBase64(reader.result);
        };
        reader.readAsDataURL(file);
      } catch {
        // ignore reader errors
      }

      setMimeType(file.type || 'audio/webm');
      setRecordingTime(18);
      setStatus('recorded');
      setFallbackActive(true);
      return true;
    },
    [resetRecording]
  );

  /**
   * Memoized handler/selector for set sample audio.
   */
  const setSampleAudio = React.useCallback(
    (url: string, durationSeconds = 18) => {
      resetRecording();
      setAudioUrl(url);
      setAudioBase64(url);
      setRecordingTime(durationSeconds);
      setMimeType('audio/webm;codecs=opus');
      setStatus('recorded');
    },
    [resetRecording]
  );

  return {
    status,
    recordingTime,
    formattedTime: formatSecondsToTime(recordingTime),
    waveformBars,
    audioBlob,
    audioUrl,
    audioBase64,
    mimeType,
    isMicAvailable,
    errorMessage,
    fallbackActive,
    startRecording,
    stopRecording,
    resetRecording,
    handleFileUpload,
    setSampleAudio,
  };
}
