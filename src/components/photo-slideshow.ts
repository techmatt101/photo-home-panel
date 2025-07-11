import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { PhotoPrismPhoto } from '../types/photoprism.types';

// Import sub-components
import './photo-slideshow-core';
import './info-overlay';
import './time-weather';
import './media-player';
import './calendar-events';
import './control-buttons';
import './side-panel';

@customElement('photo-slideshow')
export class PhotoSlideshow extends LitElement {
  @state() private currentImage: PhotoPrismPhoto | null = null;
  @state() private hasCalendarEvents: boolean = false;
  @state() private hasMediaPlayer: boolean = false;

  // Configuration properties
  @property({ type: String }) albumUid: string = '';
  @property({ type: Number }) cacheSize: number = 10;
  @property({ type: Number }) transitionDuration: number = 1000;
  @property({ type: Boolean }) autoPlay: boolean = true;
  @property({ type: Number }) slideDuration: number = 10000; // 10 seconds

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      background-color: #000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      --primary-color: #ffffff;
      --secondary-color: rgba(255, 255, 255, 0.8);
      --background-overlay: rgba(0, 0, 0, 0.5);
      --accent-color: #4285f4;
      --transition-duration: 1s;
    }
  `;

  constructor() {
    super();
    // Hide the loading spinner when the component is fully loaded
    window.addEventListener('load', () => {
      const loadingElement = document.querySelector('.loading');
      if (loadingElement) {
        loadingElement.remove();
      }
    });
  }

  // Handle image change events from the slideshow core
  private handleImageChange(e: CustomEvent) {
    this.currentImage = e.detail.image;
    this.requestUpdate();
  }

  // Check if calendar events or media player should be shown
  private handleCalendarEventsChange(e: CustomEvent) {
    this.hasCalendarEvents = e.detail.hasEvents;
    this.requestUpdate();
  }

  private handleMediaPlayerChange(e: CustomEvent) {
    this.hasMediaPlayer = e.detail.hasMedia;
    this.requestUpdate();
  }

  render() {
    return html`
      <photo-slideshow-core
        albumUid="${this.albumUid}"
        cacheSize="${this.cacheSize}"
        transitionDuration="${this.transitionDuration}"
        ?autoPlay="${this.autoPlay}"
        slideDuration="${this.slideDuration}"
        ?emitEvents="${true}"
        @image-changed="${this.handleImageChange}"
      >
        <!-- Info overlay with time and weather -->
        <info-overlay .photo="${this.currentImage}">
          <time-weather></time-weather>
        </info-overlay>

        <!-- Side panel with calendar events and media player -->
        <side-panel ?hasContent="${this.hasCalendarEvents || this.hasMediaPlayer}">
          <calendar-events @has-events="${this.handleCalendarEventsChange}"></calendar-events>
          <media-player @has-media="${this.handleMediaPlayerChange}"></media-player>
        </side-panel>

        <!-- Control buttons -->
        <control-buttons></control-buttons>
      </photo-slideshow-core>
    `;
  }
}
