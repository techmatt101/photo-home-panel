import photoPrismService from './photoprism-service';
import {PhotoPrismPhoto} from '../types/photoprism.types';

// Simple interface for photo display information
interface PhotoDisplayInfo {
    url: string;
    location: string;
    date: string;
}

// Interface for preloaded image
interface PreloadedImage {
    photo: PhotoPrismPhoto;
    imageElement: HTMLImageElement;
    loaded: boolean;
}

export class SlideshowService {
    private currentImage: PhotoPrismPhoto | null = null;
    private nextImage: PhotoPrismPhoto | null = null;
    private currentImageElement: HTMLImageElement | null = null;
    private nextImageElement: HTMLImageElement | null = null;
    private orientation: 'landscape' | 'portrait' = 'landscape';
    private autoPlayTimer: number | null = null;
    private autoPlay: boolean = false;
    private slideDuration: number = 10000; // 10 seconds default
    private isPreloading: boolean = false;

    async initialize(): Promise<void> {
        this.detectOrientation();

        window.addEventListener('resize', () => {
            this.detectOrientation();
        });

        await photoPrismService.initialize();
        await this.loadRandomPhoto();

        // Preload the next image after the current one is loaded
        await this.preloadNextImage();
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
        return this.nextImage;
    }

    // Get the current image element
    getCurrentImageElement(): HTMLImageElement | null {
        return this.currentImageElement;
    }

    // Get the next image element
    getNextImageElement(): HTMLImageElement | null {
        return this.nextImageElement;
    }

    // Get the URL for the current image
    getCurrentImageUrl(): string | null {
        return this.currentImage ? photoPrismService.getPhotoUrl(this.currentImage.Hash) : null;
    }

    // Get the URL for the next image
    getNextImageUrl(): string | null {
        return this.nextImage ? photoPrismService.getPhotoUrl(this.nextImage.Hash) : null;
    }

    // Get display information for the current photo
    getCurrentPhotoInfo(): PhotoDisplayInfo | null {
        if (!this.currentImage) return null;

        return {
            url: photoPrismService.getPhotoUrl(this.currentImage.Hash),
            location: this.getPhotoLocation(this.currentImage),
            date: this.getPhotoDate(this.currentImage)
        };
    }

    // Get display information for the next photo
    getNextPhotoInfo(): PhotoDisplayInfo | null {
        if (!this.nextImage) return null;

        return {
            url: photoPrismService.getPhotoUrl(this.nextImage.Hash),
            location: this.getPhotoLocation(this.nextImage),
            date: this.getPhotoDate(this.nextImage)
        };
    }

    // Move to the next image
    async advanceImage(): Promise<PhotoPrismPhoto | null> {
        // If we have a preloaded next image, use it
        if (this.nextImage && this.nextImageElement) {
            // Current becomes previous
            this.currentImage = this.nextImage;
            this.currentImageElement = this.nextImageElement;

            // Clear next image references
            this.nextImage = null;
            this.nextImageElement = null;

            // Start preloading the next image
            this.preloadNextImage();

            return this.currentImage;
        } else {
            // Fallback to loading a new random photo
            await this.loadRandomPhoto();
            this.preloadNextImage();
            return this.currentImage;
        }
    }

    // Move to the previous image (same as next in simplified version)
    async previousImage(): Promise<PhotoPrismPhoto | null> {
        // In this simplified version, previous is the same as next
        return this.advanceImage();
    }

    // Detect device orientation
    private detectOrientation() {
        // Determine if the device is in landscape or portrait mode
        this.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    // Get a random photo and create an Image object for it
    private async loadRandomPhoto(): Promise<void> {
        try {
            const photos = await this.getRandomPhoto();

            if (photos.length === 0) {
                console.error('No photos found');
                return;
            }

            this.currentImage = photos[0];

            // Create and load the image element
            if (this.currentImage) {
                const imageUrl = photoPrismService.getPhotoUrl(this.currentImage.Hash);
                this.currentImageElement = new Image();

                // Create a promise to wait for the image to load
                await new Promise<void>((resolve, reject) => {
                    if (this.currentImageElement) {
                        this.currentImageElement.onload = () => resolve();
                        this.currentImageElement.onerror = () => {
                            console.error('Error loading image');
                            reject(new Error('Failed to load image'));
                        };
                        this.currentImageElement.src = imageUrl;
                    } else {
                        reject(new Error('Image element is null'));
                    }
                });
            }
        } catch (error) {
            console.error('Error loading photo:', error);
        }
    }

    // Preload the next image
    private async preloadNextImage(): Promise<void> {
        if (this.isPreloading) return;

        this.isPreloading = true;

        try {
            const photos = await this.getRandomPhoto();

            if (photos.length === 0) {
                console.error('No photos found for preloading');
                this.isPreloading = false;
                return;
            }

            this.nextImage = photos[0];

            // Create and preload the next image element
            if (this.nextImage) {
                const imageUrl = photoPrismService.getPhotoUrl(this.nextImage.Hash);
                this.nextImageElement = new Image();

                // Create a promise to wait for the image to load
                await new Promise<void>((resolve) => {
                    if (this.nextImageElement) {
                        this.nextImageElement.onload = () => resolve();
                        this.nextImageElement.onerror = () => {
                            console.error('Error preloading next image');
                            resolve(); // Resolve anyway to continue
                        };
                        this.nextImageElement.src = imageUrl;
                    } else {
                        resolve(); // Resolve anyway to continue
                    }
                });
            }
        } catch (error) {
            console.error('Error preloading next photo:', error);
        } finally {
            this.isPreloading = false;
        }
    }

    // Get a random photo from the service
    private async getRandomPhoto(): Promise<PhotoPrismPhoto[]> {
        return await photoPrismService.getRandomPhotos(1, this.orientation);
    }

    // Extract location information from a photo
    private getPhotoLocation(photo: PhotoPrismPhoto): string {
        if (photo.PlaceID) {
            return photo.PlaceID;
        } else if (photo.Path) {
            // Extract location from path if available
            const pathParts = photo.Path.split('/');
            return pathParts[pathParts.length - 2] || 'Unknown location';
        }
        return 'Unknown location';
    }

    // Format the photo date
    private getPhotoDate(photo: PhotoPrismPhoto): string {
        if (photo.TakenAtLocal) {
            const date = new Date(photo.TakenAtLocal);
            return date.toLocaleDateString();
        }
        return 'Unknown date';
    }

    // Start auto-play
    startAutoPlay(): void {
        // Clear any existing timer
        this.stopAutoPlay();

        // Set a timer to advance to the next slide
        this.autoPlayTimer = window.setTimeout(async () => {
            await this.advanceImage();

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

        // Clear image references to allow garbage collection
        this.currentImage = null;
        this.nextImage = null;
        this.currentImageElement = null;
        this.nextImageElement = null;
    }
}
