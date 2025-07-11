import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import mediaPlayerService from '../services/media-player-service';

@customElement('media-player')
export class MediaPlayer extends LitElement {

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

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up service
    mediaPlayerService.dispose();
  }

  private async initializeMediaPlayer() {
    try {
      // Initialize the media player service
      const initialized = await mediaPlayerService.initialize();

      if (initialized) {
        // Subscribe to media player updates to trigger re-renders
        mediaPlayerService.subscribeMediaPlayer(() => {
          this.requestUpdate();
        });
      } else {
        console.error('Failed to initialize media player service');
      }
    } catch (error) {
      console.error('Error initializing media player service:', error);
    }
  }

  // Control media player
  private async mediaCommand(command: 'play' | 'pause' | 'next' | 'previous') {
    await mediaPlayerService.mediaCommand(command);
  }

  render() {
    const hasMedia = mediaPlayerService.hasMedia();

    // Dispatch event to notify parent components about media availability
    this.dispatchEvent(new CustomEvent('has-media', { detail: { hasMedia } }));

    if (!hasMedia) {
      return null;
    }

    const mediaStatus = mediaPlayerService.getMediaStatus();
    const isPlaying = mediaPlayerService.isPlaying();

    if (!mediaStatus) {
      return null;
    }

    const { attributes } = mediaStatus;

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
