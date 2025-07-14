import photoPrismService from './photoprism-service';
import {PhotoPrismPhoto} from '../types/photoprism.types';

class SlideshowService {
    private cachedPhotos: PhotoPrismPhoto[] = [];
    private currentImage: PhotoPrismPhoto | null = null;
    private nextImageObj: PhotoPrismPhoto | null = null;
    private previousImageObj: PhotoPrismPhoto | null = null;
    private orientation: 'landscape' | 'portrait' = 'landscape';
    private albumUid: string = '';
    private cacheSize: number = 10;
    private transitioning: boolean = false;

    // Auto-play properties
    private autoPlayTimer: number | null = null;
    private autoPlay: boolean = true;
    private slideDuration: number = 10000; // 10 seconds default

    // Initialize the slideshow service
    async initialize(albumUid: string = '', cacheSize: number = 10, autoPlay: boolean = true, slideDuration: number = 10000): Promise<boolean> {
        this.albumUid = albumUid;
        this.cacheSize = cacheSize;
        this.autoPlay = autoPlay;
        this.slideDuration = slideDuration;
        this.detectOrientation();

        // Set up orientation change listener
        window.addEventListener('resize', () => {
            this.detectOrientation();
        });

        // Start auto-play if enabled
        if (this.autoPlay) {
            this.startAutoPlay();
        }

        try {
            // Initialize the PhotoPrism service
            const initialized = await photoPrismService.initialize();

            if (initialized) {
                // Load initial photos
                await this.loadPhotos();
                return true;
            } else {
                console.error('Failed to initialize PhotoPrism service');
                this.usePlaceholderImages();
                return false;
            }
        } catch (error) {
            console.error('Error initializing PhotoPrism service:', error);
            this.usePlaceholderImages();
            return false;
        }
    }

    // Get the current orientation
    getOrientation(): 'landscape' | 'portrait' {
        return this.orientation;
    }

    // Get the current image
    getCurrentImage(): PhotoPrismPhoto | null {
        return this.currentImage;
    }

    // Get the next image
    getNextImage(): PhotoPrismPhoto | null {
        return this.nextImageObj;
    }

    // Get the previous image
    getPreviousImage(): PhotoPrismPhoto | null {
        return this.previousImageObj;
    }

    // Get the URL for the current image
    getCurrentImageUrl(): string | null {
        return this.currentImage ? photoPrismService.getPhotoUrl(this.currentImage.Hash) : null;
    }

    // Get the URL for the next image
    getNextImageUrl(): string | null {
        return this.nextImageObj ? photoPrismService.getPhotoUrl(this.nextImageObj.Hash) : null;
    }

    // Get the URL for the previous image
    getPreviousImageUrl(): string | null {
        return this.previousImageObj ? photoPrismService.getPhotoUrl(this.previousImageObj.Hash) : null;
    }

    // Move to the next image
    public async nextImage(): Promise<PhotoPrismPhoto | null> {
        if (this.transitioning) return this.currentImage;

        this.transitioning = true;

        // If we're using the PhotoPrism service
        if (this.cachedPhotos.length > 0) {
            // Find the index of the current image in the cache
            const currentIndex = this.cachedPhotos.findIndex(photo => photo.UID === this.currentImage?.UID);

            if (currentIndex !== -1) {
                // Calculate the next index (with wrap-around)
                const nextIndex = (currentIndex + 1) % this.cachedPhotos.length;

                // Update the previous, current, and next images
                this.previousImageObj = this.currentImage;
                this.currentImage = this.nextImageObj;

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
                this.nextImageObj = this.cachedPhotos[nextIndex];
            }
        } else {
            // Fallback to placeholder behavior
            const tempImage = this.nextImageObj;
            this.previousImageObj = this.currentImage;
            this.currentImage = tempImage;
            this.nextImageObj = {...this.currentImage!, UID: `placeholder-${Date.now()}`};
        }

        // After a short delay, mark as not transitioning
        setTimeout(() => {
            this.transitioning = false;
        }, 100);

        return this.currentImage;
    }

    // Move to the previous image
    public async previousImage(): Promise<PhotoPrismPhoto | null> {
        if (this.transitioning) return this.currentImage;

        this.transitioning = true;

        // If we're using the PhotoPrism service
        if (this.cachedPhotos.length > 0) {
            // Find the index of the current image in the cache
            const currentIndex = this.cachedPhotos.findIndex(photo => photo.UID === this.currentImage?.UID);

            if (currentIndex !== -1) {
                // Calculate the previous index (with wrap-around)
                const prevIndex = (currentIndex - 1 + this.cachedPhotos.length) % this.cachedPhotos.length;

                // Update the previous, current, and next images
                this.nextImageObj = this.currentImage;
                this.currentImage = this.previousImageObj;

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
                this.previousImageObj = this.cachedPhotos[prevIndex];
            }
        } else {
            // Fallback to placeholder behavior
            const tempImage = this.previousImageObj;
            this.nextImageObj = this.currentImage;
            this.currentImage = tempImage;
            this.previousImageObj = {...this.currentImage!, UID: `placeholder-${Date.now()}`};
        }

        // After a short delay, mark as not transitioning
        setTimeout(() => {
            this.transitioning = false;
        }, 100);

        return this.currentImage;
    }

    // Detect device orientation
    private detectOrientation() {
        // Determine if the device is in landscape or portrait mode
        this.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    // Use placeholder images if PhotoPrism is not available
    private usePlaceholderImages() {
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

        this.nextImageObj = {...this.currentImage, UID: 'placeholder-next'};
        this.previousImageObj = {...this.currentImage, UID: 'placeholder-prev'};
    }

    // Load photos from PhotoPrism
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
            this.nextImageObj = photos.length > 1 ? photos[1] : photos[0];
            this.previousImageObj = photos.length > 2 ? photos[2] : photos[0];
        } catch (error) {
            console.error('Error loading photos:', error);
            this.usePlaceholderImages();
        }
    }

    // Start auto-play
    startAutoPlay(): void {
        // Clear any existing timer
        this.stopAutoPlay();

        // Set a timer to advance to the next slide
        this.autoPlayTimer = window.setTimeout(async () => {
            await this.nextImage();

            // Restart the timer after advancing
            if (this.autoPlay) {
                this.startAutoPlay();
            }
        }, this.slideDuration);
    }

    // Stop auto-play
    stopAutoPlay(): void {
        if (this.autoPlayTimer) {
            window.clearTimeout(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }

    // Toggle auto-play
    toggleAutoPlay(): boolean {
        this.autoPlay = !this.autoPlay;

        if (this.autoPlay) {
            this.startAutoPlay();
        } else {
            this.stopAutoPlay();
        }

        return this.autoPlay;
    }

    // Set slide duration
    setSlideDuration(duration: number): void {
        this.slideDuration = duration;

        // Restart auto-play with new duration if it's currently active
        if (this.autoPlay && this.autoPlayTimer) {
            this.startAutoPlay();
        }
    }

    // Get current auto-play status
    isAutoPlayEnabled(): boolean {
        return this.autoPlay;
    }

    // Get current slide duration
    getSlideDuration(): number {
        return this.slideDuration;
    }

    // Clean up resources
    dispose(): void {
        this.stopAutoPlay();
    }
}

// Create a singleton instance
export const slideshowService = new SlideshowService();

// Export the service
export default slideshowService;
