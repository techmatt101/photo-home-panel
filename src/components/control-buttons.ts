import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MediaPlayerEntity } from '../types/home-assistant.types';
import homeAssistantService from '../services/home-assistant-service';

@customElement('control-buttons')
export class ControlButtons extends LitElement {
  @state() private tvStatus: MediaPlayerEntity | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .controls {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 3;
      display: flex;
      gap: 10px;
    }

    .control-button {
      background: var(--background-overlay, rgba(0, 0, 0, 0.5));
      color: var(--primary-color, #ffffff);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      font-size: 18px;
      transition: background-color 0.2s ease, transform 0.2s ease;
    }

    .control-button:hover {
      background: rgba(0, 0, 0, 0.7);
      transform: scale(1.1);
    }

    @media (max-width: 768px) {
      .controls {
        top: 10px;
        right: 10px;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.initializeTVStatus();
  }

  private async initializeTVStatus() {
    try {
      // Initialize the Home Assistant service
      const initialized = await homeAssistantService.initialize();

      if (initialized) {
        // Subscribe to TV updates
        homeAssistantService.subscribeTV((tv) => {
          this.tvStatus = tv;
          this.requestUpdate();
        });
      } else {
        console.error('Failed to initialize Home Assistant service for TV status');
      }
    } catch (error) {
      console.error('Error initializing TV status:', error);
    }
  }

  // Toggle a light
  private async toggleLight(entityId: string) {
    try {
      await homeAssistantService.toggleLight(entityId);
    } catch (error) {
      console.error(`Failed to toggle light ${entityId}:`, error);
    }
  }

  // Start vacuum cleaner
  private async startVacuum() {
    try {
      await homeAssistantService.startVacuum();
    } catch (error) {
      console.error('Failed to start vacuum:', error);
    }
  }

  render() {
    return html`
      <div class="controls">
        <button class="control-button" title="Toggle living room lights" @click=${() => this.toggleLight('light.living_room')}>💡</button>
        <button class="control-button" title="Start vacuum cleaner" @click=${this.startVacuum}>🧹</button>
        ${this.tvStatus && this.tvStatus.state !== 'off' ? html`
          <button class="control-button" title="TV is on">📺</button>
        ` : ''}
        <button class="control-button" title="Settings">⚙️</button>
      </div>
    `;
  }
}