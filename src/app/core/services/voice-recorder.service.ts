import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface VoiceRecordingResult {
  blob: Blob;
  dataUrl: string;
  duration: number; // in seconds
}

@Injectable({
  providedIn: 'root'
})
export class VoiceRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private timerInterval: any = null;
  private startTime: number = 0;

  private isRecordingSubject = new BehaviorSubject<boolean>(false);
  public isRecording$: Observable<boolean> = this.isRecordingSubject.asObservable();

  private recordingDurationSubject = new BehaviorSubject<number>(0);
  public recordingDuration$: Observable<number> = this.recordingDurationSubject.asObservable();

  private currentPlayingAudio: HTMLAudioElement | null = null;

  constructor(private ngZone: NgZone) {}

  public get isRecording(): boolean {
    return this.isRecordingSubject.value;
  }

  public get currentDuration(): number {
    return this.recordingDurationSubject.value;
  }

  /**
   * Check if audio recording is supported in the current browser.
   */
  public isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window !== 'undefined' &&
      typeof window.MediaRecorder !== 'undefined'
    );
  }

  /**
   * Starts recording audio from the user's microphone.
   * Resolves to true if recording started successfully, or throws an error.
   */
  public async startRecording(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('NOT_SUPPORTED');
    }

    if (this.isRecording) {
      this.cancelRecording();
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioChunks = [];
      const options = this.getSupportedMimeType();
      this.mediaRecorder = options ? new MediaRecorder(this.mediaStream, options) : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect chunk every 100ms
      this.startTime = Date.now();

      this.ngZone.run(() => {
        this.isRecordingSubject.next(true);
        this.recordingDurationSubject.next(0);
      });

      this.startDurationTimer();
      return true;
    } catch (err: any) {
      this.cleanupStream();
      this.ngZone.run(() => {
        this.isRecordingSubject.next(false);
      });
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('PERMISSION_DENIED');
      }
      throw err;
    }
  }

  /**
   * Stops recording and returns the recorded audio Blob, Base64 Data URL, and duration.
   */
  public stopRecording(): Promise<VoiceRecordingResult | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve(null);
        return;
      }

      const calculatedDuration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        try {
          const dataUrl = await this.blobToDataUrl(audioBlob);
          this.cleanup();
          resolve({
            blob: audioBlob,
            dataUrl,
            duration: calculatedDuration
          });
        } catch (e) {
          this.cleanup();
          resolve(null);
        }
      };

      this.mediaRecorder.stop();
      this.cleanupStream();
    });
  }

  /**
   * Cancels and discards the current recording without saving.
   */
  public cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    this.cleanup();
  }

  private startDurationTimer(): void {
    this.stopDurationTimer();
    this.timerInterval = setInterval(() => {
      const durationSec = Math.floor((Date.now() - this.startTime) / 1000);
      this.ngZone.run(() => {
        this.recordingDurationSubject.next(durationSec);
      });
    }, 500);
  }

  private stopDurationTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private cleanupStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.mediaStream = null;
    }
  }

  private cleanup(): void {
    this.stopDurationTimer();
    this.cleanupStream();
    this.audioChunks = [];
    this.mediaRecorder = null;
    this.ngZone.run(() => {
      this.isRecordingSubject.next(false);
      this.recordingDurationSubject.next(0);
    });
  }

  private getSupportedMimeType(): MediaRecorderOptions | undefined {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac'
    ];

    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return { mimeType: type };
      }
    }
    return undefined;
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Formats a duration in seconds into mm:ss format (e.g. 0:05, 1:23).
   */
  public formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Playback coordinator: Registers an active audio element to stop any other playing audio.
   */
  public registerActiveAudio(audio: HTMLAudioElement): void {
    if (this.currentPlayingAudio && this.currentPlayingAudio !== audio) {
      try {
        this.currentPlayingAudio.pause();
      } catch (e) {}
    }
    this.currentPlayingAudio = audio;
  }

  public unregisterAudio(audio: HTMLAudioElement): void {
    if (this.currentPlayingAudio === audio) {
      this.currentPlayingAudio = null;
    }
  }
}
