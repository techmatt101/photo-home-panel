import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import photoPrismService from '../services/photoprism-service';
import homeAssistantService from '../services/home-assistant-service';
import { PhotoPrismPhoto } from '../types/photoprism.types';
import { 
  WeatherEntity, 
  CalendarEntity, 
  MediaPlayerEntity 
} from '../types/home-assistant.types';

@customElement('photo-slideshow')
export class PhotoSlideshow extends LitElement {
  @state() private loading = true;
  @state() private currentImage: PhotoPrismPhoto | null = null;
  @state() private nextImage: PhotoPrismPhoto | null = null;
  @state() private previousImage: PhotoPrismPhoto | null = null;
  @state() private currentImageUrl: string | null = null;
  @state() private nextImageUrl: string | null = null;
  @state() private previousImageUrl: string | null = null;
  @state() private transitioning = false;
  @state() private weatherData: WeatherEntity | null = null;
  @state() private calendarEvents: CalendarEntity[] = [];
  @state() private mediaStatus: MediaPlayerEntity | null = null;
  @state() private tvStatus: MediaPlayerEntity | null = null;
  @state() private cachedPhotos: PhotoPrismPhoto[] = [];
  @state() private orientation: 'landscape' | 'portrait' = 'landscape';

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

    /* Bottom info overlay */
    .info-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      color: var(--primary-color);
      padding: 20px;
      z-index: 3;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      backdrop-filter: blur(5px);
    }

    .photo-info {
      flex: 1;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    .photo-location {
      font-size: 1.2rem;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .photo-date {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-bottom: 3px;
    }

    .photo-title {
      font-size: 1rem;
      font-style: italic;
    }

    .current-time {
      font-size: 1.5rem;
      font-weight: bold;
      text-align: center;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      margin: 0 20px;
    }

    /* Weather widget */
    .weather-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      margin-left: 20px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      transition: transform 0.2s ease;
    }

    .weather-widget:hover {
      transform: scale(1.05);
    }

    .weather-condition {
      font-size: 0.9rem;
      margin-bottom: 5px;
      text-transform: capitalize;
    }

    .weather-temp {
      font-size: 1.2rem;
      font-weight: bold;
    }

    /* Side panel for calendar and media */
    .side-panel {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 300px;
      background: var(--background-overlay);
      backdrop-filter: blur(10px);
      z-index: 3;
      padding: 20px;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
      display: flex;
      flex-direction: column;
      color: var(--primary-color);
      overflow-y: auto;
    }

    .side-panel.has-content {
      transform: translateX(0);
    }

    /* Calendar events */
    .calendar-events {
      margin-bottom: 20px;
    }

    .calendar-events h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 1.2rem;
      border-bottom: 1px solid var(--secondary-color);
      padding-bottom: 5px;
    }

    .calendar-events ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .calendar-events li {
      margin-bottom: 10px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    }

    .event-time {
      font-weight: bold;
      margin-bottom: 5px;
    }

    .event-title {
      font-size: 0.9rem;
    }

    /* Media player */
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
      color: var(--primary-color);
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
      background: var(--background-overlay);
      color: var(--primary-color);
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

    /* Control buttons */
    .controls {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 3;
      display: flex;
      gap: 10px;
    }

    .control-button {
      background: var(--background-overlay);
      color: var(--primary-color);
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

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .side-panel {
        width: 250px;
      }

      .info-overlay {
        flex-direction: column;
        align-items: flex-start;
      }

      .current-time {
        margin: 10px 0;
      }

      .weather-widget {
        margin-left: 0;
        flex-direction: row;
        gap: 10px;
      }

      .controls {
        top: 10px;
        right: 10px;
      }

      .nav-button {
        width: 40px;
        height: 40px;
        font-size: 20px;
        margin: 0 10px;
      }
    }

    @media (max-width: 480px) {
      .side-panel {
        width: 100%;
        transform: translateY(100%);
      }

      .side-panel.has-content {
        transform: translateY(0);
        height: 50%;
        top: auto;
      }

      .photo-location {
        font-size: 1rem;
      }

      .current-time {
        font-size: 1.2rem;
      }

      .weather-temp {
        font-size: 1rem;
      }
    }
  `;

  // Timer for auto-advancing slides
  private autoPlayTimer: number | null = null;

  constructor() {
    super();
    // Hide the loading spinner when the component is fully loaded
    window.addEventListener('load', () => {
      const loadingElement = document.querySelector('.loading');
      if (loadingElement) {
        loadingElement.remove();
      }
    });

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

    // Update the clock every minute
    this.updateClock();
    setInterval(() => this.updateClock(), 60000);

    // Initialize PhotoPrism service
    this.initializePhotoService();

    // Initialize Home Assistant service
    this.initializeHomeAssistant();
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
    }
  }

  private async initializeHomeAssistant() {
    try {
      // Initialize the Home Assistant service
      const initialized = await homeAssistantService.initialize();

      if (initialized) {
        // Subscribe to weather updates
        homeAssistantService.subscribeWeather((weather) => {
          this.weatherData = weather;
          this.requestUpdate();
        });

        // Get calendar events
        this.calendarEvents = await homeAssistantService.getCalendarEvents();

        // Subscribe to media player updates
        homeAssistantService.subscribeMediaPlayer((mediaPlayer) => {
          this.mediaStatus = mediaPlayer;
          this.requestUpdate();
        });

        // Subscribe to TV updates
        homeAssistantService.subscribeTV((tv) => {
          this.tvStatus = tv;
          this.requestUpdate();
        });
      } else {
        console.error('Failed to initialize Home Assistant service');
      }
    } catch (error) {
      console.error('Error initializing Home Assistant service:', error);
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
      this.nextImage();
      // Restart the timer after advancing
      if (this.autoPlay) {
        this.startAutoPlay();
      }
    }, this.slideDuration);
  }

  private xDown: number | null = null;
  private yDown: number | null = null;

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
        this.nextImage();
      } else {
        // Swipe right - previous image
        this.previousImage();
      }
    }

    this.xDown = null;
    this.yDown = null;
  }

  private updateClock() {
    // Force a re-render to update the clock
    this.requestUpdate();
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

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  }

  // Format a date from ISO string
  private formatPhotoDate(isoDate: string): string {
    if (!isoDate) return '';

    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  // Get location string from photo
  private getPhotoLocation(photo: PhotoPrismPhoto | null): string {
    if (!photo) return '';

    // In a real app, you would use a reverse geocoding service
    // to get the location name from the coordinates
    if (photo.Lat && photo.Lng) {
      return `${photo.Lat.toFixed(4)}, ${photo.Lng.toFixed(4)}`;
    }

    return photo.PlaceID || 'Unknown Location';
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

  // Render weather widget
  private renderWeather() {
    if (!this.weatherData) {
      return html`<div class="weather-temp">--°C</div>`;
    }

    const { state, attributes } = this.weatherData;

    return html`
      <div class="weather-widget" @click=${() => window.open('weather://stafford', '_blank')}>
        <div class="weather-condition">${state}</div>
        <div class="weather-temp">${attributes.temperature}°C</div>
      </div>
    `;
  }

  // Render media status
  private renderMediaStatus() {
    if (!this.mediaStatus || this.mediaStatus.state === 'off' || this.mediaStatus.state === 'idle') {
      return null;
    }

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

  // Render calendar events
  private renderCalendarEvents() {
    if (this.calendarEvents.length === 0) {
      return null;
    }

    // Sort events by start time
    const sortedEvents = [...this.calendarEvents].sort((a, b) => {
      return new Date(a.attributes.start_time).getTime() - new Date(b.attributes.start_time).getTime();
    });

    // Only show events for today and tomorrow
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const upcomingEvents = sortedEvents.filter(event => {
      const eventEnd = new Date(event.attributes.end_time);
      return eventEnd >= now && eventEnd <= tomorrow;
    });

    if (upcomingEvents.length === 0) {
      return null;
    }

    return html`
      <div class="calendar-events">
        <h3>Upcoming Events</h3>
        <ul>
          ${upcomingEvents.map(event => {
            const startTime = new Date(event.attributes.start_time);
            return html`
              <li>
                <div class="event-time">${startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="event-title">${event.attributes.friendly_name}</div>
              </li>
            `;
          })}
        </ul>
      </div>
    `;
  }

  render() {
    const currentTime = new Date();

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
          <button class="nav-button" @click=${this.previousImage}>❮</button>
          <button class="nav-button" @click=${this.nextImage}>❯</button>
        </div>

        <div class="info-overlay">
          <div class="photo-info">
            ${this.currentImage ? html`
              <div class="photo-location">${this.getPhotoLocation(this.currentImage)}</div>
              <div class="photo-date">${this.formatPhotoDate(this.currentImage.TakenAtLocal)}</div>
              ${this.currentImage.Title ? html`<div class="photo-title">${this.currentImage.Title}</div>` : ''}
            ` : ''}
          </div>

          <div class="current-time">
            ${this.formatDate(currentTime)}
          </div>

          ${this.renderWeather()}
        </div>

        <div class="side-panel ${this.calendarEvents.length > 0 || this.mediaStatus ? 'has-content' : ''}">
          ${this.renderCalendarEvents()}
          ${this.renderMediaStatus()}
        </div>

        <div class="controls">
          <button class="control-button" title="Toggle living room lights" @click=${() => this.toggleLight('light.living_room')}>💡</button>
          <button class="control-button" title="Start vacuum cleaner" @click=${this.startVacuum}>🧹</button>
          ${this.tvStatus && this.tvStatus.state !== 'off' ? html`
            <button class="control-button" title="TV is on">📺</button>
          ` : ''}
          <button class="control-button" title="Settings">⚙️</button>
        </div>
      </div>
    `;
  }
}
