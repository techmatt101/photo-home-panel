import photoPrismService from './photoprism-service';
import {PhotoPrismPhoto} from '../types/photoprism.types';

// Simple interface for photo display information
interface PhotoDisplayInfo {
    url: string;
    location: string;
    date: string;
}

export class SlideshowService {
    private currentImage: PhotoPrismPhoto | null = null;
    private orientation: 'landscape' | 'portrait' = 'landscape';
    private autoPlayTimer: number | null = null;
    private autoPlay: boolean = false;
    private slideDuration: number = 10000; // 10 seconds default

    async initialize(): Promise<void> {
        this.detectOrientation();

        window.addEventListener('resize', () => {
            this.detectOrientation();
        });

        await photoPrismService.initialize();
        await this.loadRandomPhoto();
    }

    // Get the current orientation
    getOrientation(): 'landscape' | 'portrait' {
        return this.orientation;
    }

    // Get the current image
    getCurrentImage(): PhotoPrismPhoto | null {
        return this.currentImage;
    }

    // Get the URL for the current image
    getCurrentImageUrl(): string | null {
        return this.currentImage ? photoPrismService.getPhotoUrl(this.currentImage.Hash) : null;
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

    // Move to the next image
    async nextImage(): Promise<PhotoPrismPhoto | null> {
        await this.loadRandomPhoto();
        return this.currentImage;
    }

    // Move to the previous image (same as next in simplified version)
    async previousImage(): Promise<PhotoPrismPhoto | null> {
        return this.nextImage();
    }

    // Detect device orientation
    private detectOrientation() {
        // Determine if the device is in landscape or portrait mode
        this.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    // Get a random photo
    private async loadRandomPhoto() {
        try {
            const photos = await this.getRandomPhoto();

            if (photos.length === 0) {
                console.error('No photos found');
                return;
            }

            this.currentImage = photos[0];
        } catch (error) {
            console.error('Error loading photo:', error);
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
