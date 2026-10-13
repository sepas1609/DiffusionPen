export interface A11yConfig {
  dysgraphiaMode: boolean;
  strokeStabilizer: boolean;
  switchControlEnabled: boolean;
  highContrast: boolean;
  scanIntervalMs: number;
}

export class AccessibilityEngine {
  private config: A11yConfig = {
    dysgraphiaMode: false,
    strokeStabilizer: false,
    switchControlEnabled: false,
    highContrast: false,
    scanIntervalMs: 1500, // 1.5s interval per Chapter 23.2
  };

  private switchTimer: number | null = null;
  private focusableElements: HTMLElement[] = [];
  private currentFocusIndex: number = 0;

  constructor() {}

  getConfig(): A11yConfig {
    return { ...this.config };
  }

  setDysgraphiaMode(enabled: boolean) {
    this.config.dysgraphiaMode = enabled;
    if (enabled) {
      this.config.strokeStabilizer = true;
      this.announceLive('Dysgraphia mode activated: stroke stabilization and enhanced line spacing enabled.');
    }
  }

  setHighContrast(enabled: boolean) {
    this.config.highContrast = enabled;
    if (enabled) {
      document.documentElement.classList.add('a11y-high-contrast');
      this.announceLive('High contrast mode activated.');
    } else {
      document.documentElement.classList.remove('a11y-high-contrast');
    }
  }

  setSwitchControl(enabled: boolean) {
    this.config.switchControlEnabled = enabled;
    if (enabled) {
      this.startSwitchScanner();
      this.announceLive('Single-switch scanning control enabled. Press Space or click to select.');
    } else {
      this.stopSwitchScanner();
    }
  }

  /** Start automatic 1.5s interval scanning over interactive elements (WCAG 2.2 AA / Switch-control) */
  private startSwitchScanner() {
    this.stopSwitchScanner();
    this.updateFocusableElements();

    if (this.focusableElements.length === 0) return;

    this.currentFocusIndex = 0;
    this.highlightCurrentElement();

    this.switchTimer = window.setInterval(() => {
      this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
      this.highlightCurrentElement();
    }, this.config.scanIntervalMs);
  }

  private stopSwitchScanner() {
    if (this.switchTimer !== null) {
      clearInterval(this.switchTimer);
      this.switchTimer = null;
    }
    this.clearHighlights();
  }

  /** Trigger current focused item on switch press */
  triggerSwitchSelection() {
    if (this.focusableElements[this.currentFocusIndex]) {
      this.focusableElements[this.currentFocusIndex].click();
      this.announceLive(`Selected: ${this.focusableElements[this.currentFocusIndex].getAttribute('aria-label') || 'control'}`);
    }
  }

  private updateFocusableElements() {
    this.focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [role="slider"], [tabindex="0"]'
      )
    );
  }

  private highlightCurrentElement() {
    this.clearHighlights();
    const el = this.focusableElements[this.currentFocusIndex];
    if (el) {
      el.classList.add('a11y-switch-focused');
      el.focus();
    }
  }

  private clearHighlights() {
    this.focusableElements.forEach((el) => el.classList.remove('a11y-switch-focused'));
  }

  /** Announce screen-reader update via ARIA live region (WCAG 4.1.3) */
  announceLive(message: string) {
    let announcer = document.getElementById('a11y-live-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'a11y-live-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('role', 'status');
      announcer.style.position = 'absolute';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.padding = '0';
      announcer.style.overflow = 'hidden';
      announcer.style.clip = 'rect(0, 0, 0, 0)';
      announcer.style.whiteSpace = 'nowrap';
      announcer.style.border = '0';
      document.body.appendChild(announcer);
    }
    announcer.textContent = message;
  }
}
