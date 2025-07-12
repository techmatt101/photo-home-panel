import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { PhotoPrismPhoto } from '../types/photoprism.types';
import slideshowService from '../services/slideshow-service';
import autoPlayService from '../services/auto-play-service';
import touchHandlerService from '../services/touch-handler-service';

@customElement('photo-slideshow-core')
export class PhotoSlideshow extends LitElement {
  @state() private loading = true;
  @state() private currentImageUrl: string | null = null;
  @state() private nextImageUrl: string | null = null;
  @state() private previousImageUrl: string | null = null;
  @state() private transitioning = false;

  // Configuration properties
  @property({ type: String }) albumUid: string = '';
  @property({ type: Number }) cacheSize: number = 10;
  @property({ type: Number }) transitionDuration: number = 1000;
  @property({ type: Boolean }) autoPlay: boolean = true;
  @property({ type: Number }) slideDuration: number = 10000; // 10 seconds

  // Events
  @property({ type: Boolean }) emitEvents: boolean = false;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      background-color: #000;
      --transition-duration: 1s;
    }

    .slideshow-container {
      width: 100%;
      height: 100%;
      position: relative;
    }

    /* Image containers and transitions */
    .image-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: opacity var(--transition-duration) ease-in-out;
    }

    .image-container.current {
      opacity: 1;
      z-index: 2;
    }

    .image-container.next,
    .image-container.previous {
      opacity: 0;
      z-index: 1;
    }

    .image-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      filter: blur(20px);
      transform: scale(1.1);
      opacity: 0.5;
    }

    .image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      z-index: 1;
      position: relative;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    /* Navigation buttons */
    .nav-buttons {
      position: absolute;
      top: 50%;
      width: 100%;
      display: flex;
      justify-content: space-between;
      z-index: 3;
      transform: translateY(-50%);
    }

    .nav-button {
      background: rgba(0, 0, 0, 0.5);
      color: #ffffff;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      margin: 0 20px;
      font-size: 24px;
      transition: background-color 0.2s ease, transform 0.2s ease;
    }

    .nav-button:hover {
      background: rgba(0, 0, 0, 0.7);
      transform: scale(1.1);
    }

    @media (max-width: 768px) {
      .nav-button {
        width: 40px;
        height: 40px;
        font-size: 20px;
        margin: 0 10px;
      }
    }
  `;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();

    // Initialize services
    this.initializeServices();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up auto-play service
    autoPlayService.dispose();

    // Clean up touch handler service
    touchHandlerService.dispose();
  }

  private async initializeServices() {
    try {
      // Initialize the slideshow service
      const initialized = await slideshowService.initialize(this.albumUid, this.cacheSize);

      // Initialize the auto-play service
      autoPlayService.initialize(this.autoPlay, this.slideDuration);

      // Initialize the touch handler service
      touchHandlerService.initialize(this);

      if (initialized) {
        // Update image URLs from the slideshow service
        this.updateImageUrls();
      } else {
        console.error('Failed to initialize slideshow service');
      }
    } catch (error) {
      console.error('Error initializing services:', error);
    } finally {
      this.loading = false;
      this.dispatchEvent(new CustomEvent('loading-changed', { detail: { loading: this.loading } }));
    }
  }

  private updateImageUrls() {
    // Get image URLs from the slideshow service
    this.currentImageUrl = slideshowService.getCurrentImageUrl();
    this.nextImageUrl = slideshowService.getNextImageUrl();
    this.previousImageUrl = slideshowService.getPreviousImageUrl();

    // Emit event if needed
    if (this.emitEvents) {
      this.dispatchEvent(new CustomEvent('image-changed', { 
        detail: { image: slideshowService.getCurrentImage() } 
      }));
    }
  }



  // Public methods that can be called from outside
  public async nextSlide() {
    if (this.transitioning) return;

    this.transitioning = true;

    // Use the slideshow service to move to the next image
    if (slideshowService) {
      await slideshowService.nextImage();
    }

    // Update the image URLs
    this.updateImageUrls();

    // After the transition duration, mark as not transitioning
    setTimeout(() => {
      this.transitioning = false;
      this.requestUpdate();
    }, this.transitionDuration);
  }

  public async previousSlide() {
    if (this.transitioning) return;

    this.transitioning = true;

    // Use the slideshow service to move to the previous image
    if (slideshowService) {
      await slideshowService.previousImage();
    }

    // Update the image URLs
    this.updateImageUrls();

    // After the transition duration, mark as not transitioning
    setTimeout(() => {
      this.transitioning = false;
      this.requestUpdate();
    }, this.transitionDuration);
  }

  public getCurrentImage(): PhotoPrismPhoto | null {
    return slideshowService.getCurrentImage();
  }

  render() {
    return html`
      <div class="slideshow-container">
        ${this.currentImageUrl ? html`
          <div class="image-container current">
            <div class="image-background" style="background-image: url(${this.currentImageUrl})"></div>
            <img class="image" src="${this.currentImageUrl}" alt="Current photo" />
          </div>
        ` : ''}

        ${this.nextImageUrl ? html`
          <div class="image-container next">
            <div class="image-background" style="background-image: url(${this.nextImageUrl})"></div>
            <img class="image" src="${this.nextImageUrl}" alt="Next photo" />
          </div>
        ` : ''}

        ${this.previousImageUrl ? html`
          <div class="image-container previous">
            <div class="image-background" style="background-image: url(${this.previousImageUrl})"></div>
            <img class="image" src="${this.previousImageUrl}" alt="Previous photo" />
          </div>
        ` : ''}

        <div class="nav-buttons">
          <button class="nav-button" @click=${this.previousSlide}>❮</button>
          <button class="nav-button" @click=${this.nextSlide}>❯</button>
        </div>

        <slot></slot>
      </div>
    `;
  }
}
