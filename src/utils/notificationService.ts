/**
 * Web Push & Mobile Alert Notification Service
 * Fully optimized for Chrome, Safari, Firefox, Android, & iOS WebViews
 */

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private isAudioUnlocked = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Auto-unlock audio context on first user interaction
      const unlockAudio = () => {
        this.initAudio();
        if (this.audioCtx && this.audioCtx.state === "suspended") {
          this.audioCtx.resume();
        }
        this.isAudioUnlocked = true;
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
      window.addEventListener("click", unlockAudio, { passive: true });
      window.addEventListener("touchstart", unlockAudio, { passive: true });
      window.addEventListener("keydown", unlockAudio, { passive: true });
    }
  }

  // Initialize Web Audio context safely
  private initAudio() {
    if (typeof window === "undefined") return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  // Play high-frequency clean VIP signal chime
  playSignalAlertChime() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Note 1 (E5 - 659.25 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 (A5 - 880.0 Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);

      // Note 3 (C#6 - 1108.73 Hz)
      const osc3 = this.audioCtx.createOscillator();
      const gain3 = this.audioCtx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(1108.73, now + 0.25);
      gain3.gain.setValueAtTime(0.4, now + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc3.connect(gain3);
      gain3.connect(this.audioCtx.destination);
      osc3.start(now + 0.25);
      osc3.stop(now + 0.85);

      // Mobile Device Vibration
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([150, 80, 200]);
      }
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  }

  // Play Break Even ding (+30 pips secure alert)
  playBeTriggeredSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      // Dual harmonious tone
      [784, 1046.5].forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.3, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 60, 100]);
      }
    } catch (e) {}
  }

  // Play victorious double-bell for Take Profit
  playTpHitSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [880, 1174.66, 1760].forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.35, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.5);
      });

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    } catch (e) {}
  }

  // Play caution tone for Stop Loss
  playSlHitSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [440, 349.23].forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.2);
        gain.gain.setValueAtTime(0.2, now + idx * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.4);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + idx * 0.2);
        osc.stop(now + idx * 0.2 + 0.4);
      });

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([300]);
      }
    } catch (e) {}
  }

  // Play subtle ding for Breakeven Closed
  playBeHitSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // Request browser push permission
  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (e) {
      console.warn("Permission request error:", e);
      return false;
    }
  }

  // Send native mobile / browser push notification
  sendMobilePush(title: string, options: { body: string; icon?: string; tag?: string }) {
    this.playSignalAlertChime();

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, {
            body: options.body,
            icon: options.icon || "/favicon.ico",
            tag: options.tag || "gold-signal-alert",
            silent: false,
          });
        } catch (e) {
          console.warn("Notification trigger error:", e);
        }
      }
    }
  }

  playSignalSound() {
    this.playSignalAlertChime();
  }

  // 1. New Entry Signal Notification
  sendSignalNotification(signal: any) {
    const isBuy = signal.signalType?.includes("BUY");
    const slPips = signal.pipsSl || 50;
    const tp1Pips = signal.pipsTp1 || 50;
    const tp2Pips = signal.pipsTp2 || 100;
    const title = `🚨 SINYAL BARU: ${signal.signalType} ${signal.symbol || "XAUUSD"}`;
    const body = `Entry: $${Number(signal.entryPrice).toFixed(2)} | SL: $${Number(signal.stopLoss).toFixed(2)} (${slPips}p) | TP1: $${Number(signal.takeProfit1).toFixed(2)} (+${tp1Pips}p) | TP2: $${Number(signal.takeProfit2).toFixed(2)} (+${tp2Pips}p)`;
    this.sendMobilePush(title, { body, tag: `signal-${signal.id}-${Date.now()}` });
  }

  // 2. Break Even Trigger Notification (+30 Pips)
  sendBeTriggeredNotification(signal: any, currentPrice: number, runningPips: number) {
    this.playBeTriggeredSound();
    const sym = signal.symbol || "XAUUSD";
    const sigType = signal.signalType || "BUY";
    const title = `🛡️ PASANG BE (BREAK EVEN): ${sigType} ${sym} (+${runningPips} Pips)`;
    const body = `Harga mencapai $${currentPrice.toFixed(2)} (+${runningPips} pips). Stop Loss otomatis digeser ke Entry ($${Number(signal.entryPrice).toFixed(2)}) untuk mengunci posisi tanpa risiko!`;

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          tag: `be-trigger-${signal.id}`,
          silent: false,
        });
      } catch (e) {}
    }
  }

  // 3. Target Hit Notification (TP1-4, SL, BE Hit)
  sendTargetHitNotification(
    targetType: "TP1" | "TP2" | "TP3" | "TP4" | "SL" | "BE",
    signal: any,
    triggerPrice: number,
    pips: number
  ) {
    const sym = signal.symbol || "XAU/USD";
    const sigType = signal.signalType || "BUY";
    let title = "";
    let body = "";

    if (targetType === "TP1") {
      this.playTpHitSound();
      title = `🎯 TP1 HIT! ${sigType} ${sym} (+${pips} pips)`;
      body = `Harga mencapai $${triggerPrice.toFixed(2)}. Amankan profit TP1 (+50 pips), SL digeser ke Entry (BE). Posisi tetap RUNNING menuju TP2/TP3/TP4!`;
    } else if (targetType === "TP2" || targetType === "TP3") {
      this.playTpHitSound();
      title = `🎯 ${targetType} HIT! ${sigType} ${sym} (+${pips} pips)`;
      body = `Harga mencapai $${triggerPrice.toFixed(2)}. Target profit lanjutan tercapai. Posisi masih RUNNING!`;
    } else if (targetType === "TP4") {
      this.playTpHitSound();
      title = `🏆 TP4 HIT (FULL TARGET)! ${sigType} ${sym} (+${pips} pips)`;
      body = `Harga mencapai $${triggerPrice.toFixed(2)}. Seluruh target tercapai sukses. Sinyal resmi CLOSED WIN.`;
    } else if (targetType === "SL") {
      this.playSlHitSound();
      title = `🛑 STOP LOSS HIT! ${sigType} ${sym} (${pips} pips)`;
      body = `Harga menyentuh $${triggerPrice.toFixed(2)}. Posisi ditutup sesuai batas risiko SL 50 pips.`;
    } else {
      this.playBeHitSound();
      title = `⚖️ BREAK EVEN HIT (0 PIPS)! ${sigType} ${sym}`;
      body = `Harga kembali ke titik Entry $${triggerPrice.toFixed(2)}. Posisi ditutup impas tanpa risiko kerugian.`;
    }

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          tag: `hit-${signal.id}-${targetType}`,
          silent: false,
        });
      } catch (e) {}
    }
  }
}

export const notificationService = new NotificationService();
