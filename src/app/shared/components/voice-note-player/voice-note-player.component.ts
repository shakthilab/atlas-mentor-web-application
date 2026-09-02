import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { VoiceRecorderService } from '../../../core/services/voice-recorder.service';

@Component({
  selector: 'app-voice-note-player',
  templateUrl: './voice-note-player.component.html',
  styleUrls: ['./voice-note-player.component.scss']
})
export class VoiceNotePlayerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() audioUrl: string = '';
  @Input() duration: number = 0;
  @Input() isMyMessage: boolean = false;
  @Input() authorName: string = '';

  @ViewChild('waveformTrack', { static: false }) waveformTrack!: ElementRef<HTMLDivElement>;

  public isPlaying: boolean = false;
  public currentTime: number = 0;
  public totalDuration: number = 0;
  public playbackSpeed: number = 1;
  public progressPercent: number = 0;
  public waveformBars: number[] = [];

  private audio: HTMLAudioElement | null = null;
  private isSeeking: boolean = false;

  constructor(
    private voiceService: VoiceRecorderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.totalDuration = this.duration || 0;
    this.generateWaveformBars();
    this.initAudio();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['audioUrl'] && !changes['audioUrl'].isFirstChange()) {
      this.cleanupAudio();
      this.initAudio();
    }
    if (changes['duration'] && changes['duration'].currentValue) {
      this.totalDuration = changes['duration'].currentValue;
    }
  }

  ngOnDestroy(): void {
    this.cleanupAudio();
  }

  private generateWaveformBars(): void {
    // Generate 26 aesthetic bar heights (between 25% and 100%) seeded pseudo-randomly based on audioUrl
    const count = 26;
    const bars: number[] = [];
    let seed = 0;
    if (this.audioUrl) {
      for (let i = 0; i < this.audioUrl.length; i++) {
        seed = (seed + this.audioUrl.charCodeAt(i)) % 1000;
      }
    }
    for (let i = 0; i < count; i++) {
      const sinVal = Math.sin((i + seed) * 0.85);
      const cosVal = Math.cos((i + seed) * 0.45);
      const heightPercent = Math.min(100, Math.max(22, Math.round(55 + (sinVal + cosVal) * 28)));
      bars.push(heightPercent);
    }
    this.waveformBars = bars;
  }

  private initAudio(): void {
    if (!this.audioUrl) return;

    try {
      this.audio = new Audio(this.audioUrl);
      this.audio.preload = 'metadata';

      this.audio.onloadedmetadata = () => {
        if (this.audio && !this.duration && this.audio.duration && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
          this.totalDuration = Math.round(this.audio.duration);
        }
        this.cdr.markForCheck();
      };

      this.audio.ontimeupdate = () => {
        if (this.audio && !this.isSeeking) {
          this.currentTime = this.audio.currentTime;
          const dur = this.totalDuration || this.audio.duration || 1;
          this.progressPercent = Math.min(100, (this.currentTime / dur) * 100);
          this.cdr.markForCheck();
        }
      };

      this.audio.onended = () => {
        this.isPlaying = false;
        this.currentTime = 0;
        this.progressPercent = 0;
        this.voiceService.unregisterAudio(this.audio!);
        this.cdr.markForCheck();
      };

      this.audio.onpause = () => {
        this.isPlaying = false;
        this.cdr.markForCheck();
      };

      this.audio.onplay = () => {
        this.isPlaying = true;
        if (this.audio) {
          this.voiceService.registerActiveAudio(this.audio);
        }
        this.cdr.markForCheck();
      };
    } catch (err) {
      console.warn('Audio initialization error:', err);
    }
  }

  private cleanupAudio(): void {
    if (this.audio) {
      this.voiceService.unregisterAudio(this.audio);
      try {
        this.audio.pause();
        this.audio.src = '';
        this.audio.load();
      } catch (e) {}
      this.audio = null;
    }
    this.isPlaying = false;
    this.currentTime = 0;
    this.progressPercent = 0;
  }

  public togglePlay(): void {
    if (!this.audio) {
      this.initAudio();
    }
    if (!this.audio) return;

    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.playbackRate = this.playbackSpeed;
      this.audio.play().catch(err => {
        console.warn('Playback failed:', err);
      });
    }
  }

  public toggleSpeed(): void {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(this.playbackSpeed) + 1) % speeds.length;
    this.playbackSpeed = speeds[nextIdx];
    if (this.audio) {
      this.audio.playbackRate = this.playbackSpeed;
    }
  }

  public onWaveformClick(event: MouseEvent): void {
    if (!this.waveformTrack || !this.audio) return;
    const rect = this.waveformTrack.nativeElement.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const clickRatio = clickX / rect.width;
    const dur = this.totalDuration || (this.audio.duration && !isNaN(this.audio.duration) ? this.audio.duration : 0);

    if (dur > 0) {
      this.currentTime = clickRatio * dur;
      this.progressPercent = clickRatio * 100;
      this.audio.currentTime = this.currentTime;
      this.cdr.markForCheck();
    }
  }

  public formatDisplayTime(): string {
    if (this.isPlaying || this.currentTime > 0) {
      return `${this.voiceService.formatTime(Math.round(this.currentTime))} / ${this.voiceService.formatTime(Math.round(this.totalDuration))}`;
    }
    return this.voiceService.formatTime(Math.round(this.totalDuration));
  }
}
