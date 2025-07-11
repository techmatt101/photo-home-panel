import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MediaPlayerEntity } from '../types/home-assistant.types';
import homeAssistantService from '../services/home-assistant-service';

@customElement('media-player')
export class MediaPlayer extends LitElement {
  @state() private mediaStatus: MediaPlayerEntity | null = null;

  static styles = css`
    :host {
      display: block;
      color: var(--primary-color, #ffffff);
    }

    .media-status {
      padding: 15px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin-top: auto;
    }

    .media-info {
      margin-bottom: 10px;
    }

    .media-title {
      font-weight: bold;
      margin-bottom: 5px;
    }

    .media-artist {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .media-controls {
      display: flex;
      justify-content: center;
      gap: 15px;
    }

    .media-button {
      background: rgba(0, 0, 0, 0.3);
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
      transition: background-color 0.2s ease;
    }

    .media-button:hover {
      background: rgba(0, 0, 0, 0.5);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.initializeMediaPlayer();
  }

  private async initializeMediaPlayer() {
    try {
      // Initialize the Home Assistant service
      const initialized = await homeAssistantService.initialize();

      if (initialized) {
        // Subscribe to media player updates
        homeAssistantService.subscribeMediaPlayer((mediaPlayer) => {
          this.mediaStatus = mediaPlayer;
          this.requestUpdate();
        });
      } else {
        console.error('Failed to initialize Home Assistant service for media player');
      }
    } catch (error) {
      console.error('Error initializing media player service:', error);
    }
  }

  // Control media player
  private async mediaCommand(command: 'play' | 'pause' | 'next' | 'previous') {
    if (!this.mediaStatus) return;

    try {
      await homeAssistantService.mediaPlayerCommand(
        'media_player.spotify',
        command
      );
    } catch (error) {
      console.error(`Failed to send ${command} command to media player:`, error);
    }
  }

  render() {
    if (!this.mediaStatus || this.mediaStatus.state === 'off' || this.mediaStatus.state === 'idle') {
      this.dispatchEvent(new CustomEvent('has-media', { detail: { hasMedia: false } }));
      return null;
    }

    this.dispatchEvent(new CustomEvent('has-media', { detail: { hasMedia: true } }));

    const { state, attributes } = this.mediaStatus;
    const isPlaying = state === 'playing';

    return html`
      <div class="media-status">
        <div class="media-info">
          ${attributes.media_title ? html`<div class="media-title">${attributes.media_title}</div>` : ''}
          ${attributes.media_artist ? html`<div class="media-artist">${attributes.media_artist}</div>` : ''}
        </div>
        <div class="media-controls">
          <button class="media-button" @click=${() => this.mediaCommand('previous')}>⏮</button>
          <button class="media-button" @click=${() => this.mediaCommand(isPlaying ? 'pause' : 'play')}>
            ${isPlaying ? '⏸' : '▶'}
          </button>
          <button class="media-button" @click=${() => this.mediaCommand('next')}>⏭</button>
        </div>
      </div>
    `;
  }
}
