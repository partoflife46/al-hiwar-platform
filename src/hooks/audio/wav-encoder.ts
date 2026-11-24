/**
 * Module architecture and API reference for `src/hooks/audio/wav-encoder.ts`.
 *
 * Exported symbols:
 * - `negotiateAudioMimeType` (Function): negotiate audio mime type definition.
 * - `readBlobAsDataUrl` (Function): read blob as data url definition.
 * - `encodeAudioBufferToWav` (Function): encode audio buffer to wav definition.
 * - `convertBlobToPlayableDataUrl` (Function): convert blob to playable data url
 *   definition.
 * - `formatSecondsToTime` (Function): format seconds to time definition.
 * - `describeMicrophoneError` (Function): describe microphone error definition.
 *
 * @module hooks/audio/wav-encoder
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Pure Web Audio WAV encoding, MIME negotiation, and microphone error helpers.
 */

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/aac',
  'audio/ogg;codecs=opus',
] as const;

/** Selects the highest-priority audio MIME type supported by MediaRecorder. */
export function negotiateAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm;codecs=opus';
  }
  const canCheck = typeof MediaRecorder.isTypeSupported === 'function';
  if (!canCheck) return 'audio/webm';
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? 'audio/webm';
}

/** Reads a Blob as a base64 Data URL via FileReader, resolving null on failure. */
export function readBlobAsDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/** Writes an ASCII header string into a WAV DataView starting at `offset`. */
function writeAscii(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Resamples a decoded AudioBuffer into a standard 16-bit mono RIFF WAV buffer. */
export function encodeAudioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const sampleRate = Math.min(audioBuffer.sampleRate || 22050, 22050);
  const length = Math.max(1, Math.floor(audioBuffer.duration * sampleRate));
  const channelData = audioBuffer.getChannelData(0);
  const samples = new Int16Array(length);
  const ratio = channelData.length / length;

  for (let i = 0; i < length; i++) {
    const srcIdx = Math.min(channelData.length - 1, Math.floor(i * ratio));
    const clamped = Math.max(-1, Math.min(1, channelData[srcIdx] || 0));
    samples[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  const dataBytes = samples.length * 2;
  const wavBuffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(wavBuffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }
  return wavBuffer;
}

/** Safely closes a Web Audio API context ignoring already-closed errors. */
async function safeCloseAudioContext(ctx: AudioContext) {
  try {
    await ctx.close();
  } catch {
    // ignore close failure
  }
}

/** Decodes an audio Blob to universal 16-bit WAV Data URL, falling back to raw FileReader. */
export async function convertBlobToPlayableDataUrl(
  blob: Blob
): Promise<{ dataUrl: string; mimeType: string } | null> {
  if (typeof window === 'undefined') return null;

  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtxClass && typeof blob.arrayBuffer === 'function') {
      const ctx = new AudioCtxClass();
      try {
        if (typeof ctx.decodeAudioData === 'function') {
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          const wavBlob = new Blob([encodeAudioBufferToWav(audioBuffer)], {
            type: 'audio/wav',
          });
          const wavDataUrl = await readBlobAsDataUrl(wavBlob);
          if (wavDataUrl) return { dataUrl: wavDataUrl, mimeType: 'audio/wav' };
        }
      } finally {
        await safeCloseAudioContext(ctx);
      }
    }
  } catch {
    // Fall back to raw Data URL below
  }

  try {
    const rawDataUrl = await readBlobAsDataUrl(blob);
    if (rawDataUrl) {
      return { dataUrl: rawDataUrl, mimeType: blob.type || 'audio/webm' };
    }
  } catch {
    // ignore fallback error
  }
  return null;
}

/** Formats an integer second count as zero-padded MM:SS. */
export function formatSecondsToTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Constant definition for mic error messages.
 */
const MIC_ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError:
    'Microphone access was denied. Please use the file upload option.',
  PermissionDeniedError:
    'Microphone access was denied. Please use the file upload option.',
  NotFoundError:
    'No microphone detected on your device. Please upload an audio file.',
  DevicesNotFoundError:
    'No microphone detected on your device. Please upload an audio file.',
};

/** Maps browser getUserMedia DOMException names to actionable user guidance. */
export function describeMicrophoneError(err: any): string {
  return (
    MIC_ERROR_MESSAGES[err?.name] ||
    'Could not access microphone. Please upload an audio file.'
  );
}
