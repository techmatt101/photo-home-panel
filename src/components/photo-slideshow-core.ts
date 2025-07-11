import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import photoPrismService from '../services/photoprism-service';
import { PhotoPrismPhoto } from '../types/photoprism.types';

@customElement('photo-slideshow-core')
export class PhotoSlideshowCore extends LitElement {
  @state() private loading = true;
  @state() private currentImage: PhotoPrismPhoto | null = null;
  @state() private nextImage: PhotoPrismPhoto | null = null;
  @state() private previousImage: PhotoPrismPhoto | null = null;
  @state() private currentImageUrl: string | null = null;
  @state() private nextImageUrl: string | null = null;
  @state() private previousImageUrl: string | null = null;
  @state() private transitioning = false;
  @state() private cachedPhotos: PhotoPrismPhoto[] = [];
  @state() private orientation: 'landscape' | 'portrait' = 'landscape';

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

  // Timer for auto-advancing slides
  private autoPlayTimer: number | null = null;
  private xDown: number | null = null;
  private yDown: number | null = null;

  constructor() {
    super();
    // Detect initial orientation
    this.detectOrientation();

    // Listen for orientation changes
    window.addEventListener('resize', () => {
      this.detectOrientation();
    });
  }

  connectedCallback() {
    super.connectedCallback();

    // Set up touch events for swipe navigation
    this.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Initialize PhotoPrism service
    this.initializePhotoService();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clear auto-play timer if it exists
    if (this.autoPlayTimer) {
      window.clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  private detectOrientation() {
    // Determine if the device is in landscape or portrait mode
    this.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  private async initializePhotoService() {
    try {
      // Initialize the PhotoPrism service
      const initialized = await photoPrismService.initialize();

      if (initialized) {
        // Load initial photos
        await this.loadPhotos();

        // Start auto-play if enabled
        if (this.autoPlay) {
          this.startAutoPlay();
        }
      } else {
        console.error('Failed to initialize PhotoPrism service');
        // Fall back to placeholder images
        this.usePlaceholderImages();
      }
    } catch (error) {
      console.error('Error initializing PhotoPrism service:', error);
      // Fall back to placeholder images
      this.usePlaceholderImages();
    } finally {
      this.loading = false;
      this.dispatchEvent(new CustomEvent('loading-changed', { detail: { loading: this.loading } }));
    }
  }

  private usePlaceholderImages() {
    // Use placeholder images if PhotoPrism is not available
    this.currentImageUrl = 'https://picsum.photos/1200/800';
    this.nextImageUrl = 'https://picsum.photos/1200/801';
    this.previousImageUrl = 'https://picsum.photos/1200/799';

    // Mock metadata
    this.currentImage = {
      UID: 'placeholder',
      Title: 'Sample Photo',
      Description: 'Placeholder image',
      TakenAt: new Date().toISOString(),
      TakenAtLocal: new Date().toISOString(),
      TakenSrc: 'local',
      TimeZone: 'UTC',
      Path: '',
      Name: 'placeholder.jpg',
      OriginalName: 'placeholder.jpg',
      Type: 'image',
      Favorite: false,
      Private: false,
      Lat: 52.8056,  // Stafford, UK latitude
      Lng: -2.1163,  // Stafford, UK longitude
      Altitude: 0,
      Width: 1200,
      Height: 800,
      Hash: '',
      StackUID: '',
      PlaceID: '',
      PlaceSrc: '',
      CellID: '',
      CellAccuracy: 0
    } as PhotoPrismPhoto;
    
    if (this.emitEvents) {
      this.dispatchEvent(new CustomEvent('image-changed', { detail: { image: this.currentImage } }));
    }
  }

  private async loadPhotos() {
    try {
      // Determine how many photos to load
      const photosToLoad = Math.max(this.cacheSize, 3); // At least 3 photos (current, next, previous)

      let photos: PhotoPrismPhoto[];

      // If an album is specified, load photos from that album
      if (this.albumUid) {
        photos = await photoPrismService.getAlbumPhotos(this.albumUid);
      } else {
        // Otherwise, get random photos with preference for the current orientation
        photos = await photoPrismService.getRandomPhotos(photosToLoad, this.orientation);
      }

      if (photos.length === 0) {
        console.error('No photos found');
        this.usePlaceholderImages();
        return;
      }

      // Store the photos in the cache
      this.cachedPhotos = photos;

      // Set the current, next, and previous photos
      this.currentImage = photos[0];
      this.nextImage = photos.length > 1 ? photos[1] : photos[0];
      this.previousImage = photos.length > 2 ? photos[2] : photos[0];

      // Set the image URLs
      this.updateImageUrls();
      
      if (this.emitEvents) {
        this.dispatchEvent(new CustomEvent('image-changed', { detail: { image: this.currentImage } }));
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      this.usePlaceholderImages();
    }
  }

  private updateImageUrls() {
    // Update the image URLs based on the current, next, and previous photos
    if (this.currentImage) {
      this.currentImageUrl = photoPrismService.getPhotoUrl(this.currentImage.Hash);
    }

    if (this.nextImage) {
      this.nextImageUrl = photoPrismService.getPhotoUrl(this.nextImage.Hash);
    }

    if (this.previousImage) {
      this.previousImageUrl = photoPrismService.getPhotoUrl(this.previousImage.Hash);
    }
  }

  private startAutoPlay() {
    // Clear any existing timer
    if (this.autoPlayTimer) {
      window.clearTimeout(this.autoPlayTimer);
    }

    // Set a timer to advance to the next slide
    this.autoPlayTimer = window.setTimeout(() => {
      this.nextSlide();
      // Restart the timer after advancing
      if (this.autoPlay) {
        this.startAutoPlay();
      }
    }, this.slideDuration);
  }

  private handleTouchStart(evt: TouchEvent) {
    const firstTouch = evt.touches[0];
    this.xDown = firstTouch.clientX;
    this.yDown = firstTouch.clientY;
  }

  private handleTouchMove(evt: TouchEvent) {
    if (!this.xDown || !this.yDown) {
      return;
    }
  }

  private handleTouchEnd(evt: TouchEvent) {
    if (!this.xDown || !this.yDown) {
      return;
    }

    const xUp = evt.changedTouches[0].clientX;
    const yUp = evt.changedTouches[0].clientY;

    const xDiff = this.xDown - xUp;
    const yDiff = this.yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff > 0) {
        // Swipe left - next image
        this.nextSlide();
      } else {
        // Swipe right - previous image
        this.previousSlide();
      }
    }

    this.xDown = null;
    this.yDown = null;
  }

  // Public methods that can be called from outside
  public nextSlide() {
    this.nextImage();
  }

  public previousSlide() {
    this.previousImage();
  }

  public getCurrentImage(): PhotoPrismPhoto | null {
    return this.currentImage;
  }

  private async nextImage() {
    if (this.transitioning) return;

    this.transitioning = true;

    // If we're using the PhotoPrism service
    if (this.cachedPhotos.length > 0) {
      // Find the index of the current image in the cache
      const currentIndex = this.cachedPhotos.findIndex(photo => photo.UID === this.currentImage?.UID);

      if (currentIndex !== -1) {
        // Calculate the next index (with wrap-around)
        const nextIndex = (currentIndex + 1) % this.cachedPhotos.length;

        // Update the previous, current, and next images
        this.previousImage = this.currentImage;
        this.currentImage = this.nextImage;

        // If we're near the end of our cache, load more photos
        if (nextIndex >= this.cachedPhotos.length - 2) {
          try {
            const newPhotos = await photoPrismService.getRandomPhotos(
              Math.max(5, this.cacheSize - this.cachedPhotos.length),
              this.orientation
            );

            // Add new photos to the cache, avoiding duplicates
            for (const photo of newPhotos) {
              if (!this.cachedPhotos.some(p => p.UID === photo.UID)) {
                this.cachedPhotos.push(photo);
              }
            }
          } catch (error) {
            console.error('Failed to load more photos:', error);
          }
        }

        // Set the next image
        this.nextImage = this.cachedPhotos[nextIndex];

        // Update the image URLs
        this.updateImageUrls();
        
        if (this.emitEvents) {
          this.dispatchEvent(new CustomEvent('image-changed', { detail: { image: this.currentImage } }));
        }
      }
    } else {
      // Fallback to placeholder behavior
      const tempUrl = this.nextImageUrl;
      this.currentImageUrl = tempUrl;
      this.nextImageUrl = `https://picsum.photos/1200/${800 + Math.floor(Math.random() * 10)}`;
    }

    // After the transition duration, mark as not transitioning
    setTimeout(() => {
      this.transitioning = false;
      this.requestUpdate();
    }, this.transitionDuration);
  }

  private async previousImage() {
    if (this.transitioning) return;

    this.transitioning = true;

    // If we're using the PhotoPrism service
    if (this.cachedPhotos.length > 0) {
      // Find the index of the current image in the cache
      const currentIndex = this.cachedPhotos.findIndex(photo => photo.UID === this.currentImage?.UID);

      if (currentIndex !== -1) {
        // Calculate the previous index (with wrap-around)
        const prevIndex = (currentIndex - 1 + this.cachedPhotos.length) % this.cachedPhotos.length;

        // Update the previous, current, and next images
        this.nextImage = this.currentImage;
        this.currentImage = this.previousImage;

        // If we're near the beginning of our cache, load more photos
        if (prevIndex <= 1) {
          try {
            const newPhotos = await photoPrismService.getRandomPhotos(
              Math.max(5, this.cacheSize - this.cachedPhotos.length),
              this.orientation
            );

            // Add new photos to the beginning of the cache, avoiding duplicates
            for (const photo of newPhotos) {
              if (!this.cachedPhotos.some(p => p.UID === photo.UID)) {
                this.cachedPhotos.unshift(photo);
              }
            }
          } catch (error) {
            console.error('Failed to load more photos:', error);
          }
        }

        // Set the previous image
        this.previousImage = this.cachedPhotos[prevIndex];

        // Update the image URLs
        this.updateImageUrls();
        
        if (this.emitEvents) {
          this.dispatchEvent(new CustomEvent('image-changed', { detail: { image: this.currentImage } }));
        }
      }
    } else {
      // Fallback to placeholder behavior
      const tempUrl = this.previousImageUrl;
      this.currentImageUrl = tempUrl;
      this.previousImageUrl = `https://picsum.photos/1200/${800 - Math.floor(Math.random() * 10)}`;
    }

    // After the transition duration, mark as not transitioning
    setTimeout(() => {
      this.transitioning = false;
      this.requestUpdate();
    }, this.transitionDuration);
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