import { PhotoPrismPhoto } from "../intergrations/photoprism/photoprism.types";
import { PhotoDisplayInfo, PhotoService } from "./photo-service";

export class SlideshowService {
    private _currentImage: PhotoPrismPhoto | null = null;
    private _nextImage: PhotoPrismPhoto | null = null;
    private _currentImageElement: HTMLImageElement | null = null;
    private _nextImageElement: HTMLImageElement | null = null;
    private _orientation: 'landscape' | 'portrait' = 'landscape';
    private _autoPlayTimer: number | null = null;
    private _autoPlay: boolean = false;
    private _slideDuration: number = 10000; // 10 seconds default
    private _isPreloading: boolean = false;
    private _photoService: PhotoService;

    constructor(photoService: PhotoService) {
        this._photoService = photoService;
    }

    public async initialize(): Promise<void> {
        this.detectOrientation();

        window.addEventListener('resize', () => {
            this.detectOrientation();
        });

        await this._photoService.initialize();
        await this.loadRandomPhoto();

        // Preload the next image after the current one is loaded
        await this.preloadNextImage();
    }

    // // Get the current orientation
    // getOrientation(): 'landscape' | 'portrait' {
    //     return this._orientation;
    // }
    //
    // // Get the current image
    // getCurrentImage(): PhotoPrismPhoto | null {
    //     return this._currentImage;
    // }
    //
    // // Get the next image
    // getNextImage(): PhotoPrismPhoto | null {
    //     return this._nextImage;
    // }
    //
    // // Get the current image element
    // getCurrentImageElement(): HTMLImageElement | null {
    //     return this._currentImageElement;
    // }
    //
    // // Get the next image element
    // getNextImageElement(): HTMLImageElement | null {
    //     return this._nextImageElement;
    // }

    public getCurrentImageUrl(): string | null {
        return this._currentImage ? this._photoService.getPhotoUrl(this._currentImage.Hash) : null;
    }

    public getNextImageUrl(): string | null {
        return this._nextImage ? this._photoService.getPhotoUrl(this._nextImage.Hash) : null;
    }

    public getCurrentPhotoInfo(): PhotoDisplayInfo | null {
        if (!this._currentImage) return null;

        return {
            url: this._photoService.getPhotoUrl(this._currentImage.Hash),
            location: this.getPhotoLocation(this._currentImage),
            date: this.getPhotoDate(this._currentImage)
        };
    }

    public getNextPhotoInfo(): PhotoDisplayInfo | null {
        if (!this._nextImage) return null;

        return {
            url: this._photoService.getPhotoUrl(this._nextImage.Hash),
            location: this.getPhotoLocation(this._nextImage),
            date: this.getPhotoDate(this._nextImage)
        };
    }

    public async advanceImage(): Promise<PhotoPrismPhoto | null> {
        // If we have a preloaded next image, use it
        if (this._nextImage && this._nextImageElement) {
            // Current becomes previous
            this._currentImage = this._nextImage;
            this._currentImageElement = this._nextImageElement;

            // Clear next image references
            this._nextImage = null;
            this._nextImageElement = null;

            // Start preloading the next image
            this.preloadNextImage();

            return this._currentImage;
        } else {
            // Fallback to loading a new random photo
            await this.loadRandomPhoto();
            this.preloadNextImage();
            return this._currentImage;
        }
    }

    public async previousImage(): Promise<PhotoPrismPhoto | null> {
        // In this simplified version, previous is the same as next
        return this.advanceImage();
    }

    private detectOrientation() {
        this._orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    private async loadRandomPhoto(): Promise<void> {
        try {
            const photos = await this.getRandomPhoto();

            if (photos.length === 0) {
                console.error('No photos found');
                return;
            }

            this._currentImage = photos[0];

            // Create and load the image element
            if (this._currentImage) {
                const imageUrl = this._photoService.getPhotoUrl(this._currentImage.Hash);
                this._currentImageElement = new Image();

                // Create a promise to wait for the image to load
                await new Promise<void>((resolve, reject) => {
                    if (this._currentImageElement) {
                        this._currentImageElement.onload = () => resolve();
                        this._currentImageElement.onerror = () => {
                            console.error('Error loading image');
                            reject(new Error('Failed to load image'));
                        };
                        this._currentImageElement.src = imageUrl;
                    } else {
                        reject(new Error('Image element is null'));
                    }
                });
            }
        } catch (error) {
            console.error('Error loading photo:', error);
        }
    }

    private async preloadNextImage(): Promise<void> {
        if (this._isPreloading) return;

        this._isPreloading = true;

        try {
            const photos = await this.getRandomPhoto();

            if (photos.length === 0) {
                console.error('No photos found for preloading');
                this._isPreloading = false;
                return;
            }

            this._nextImage = photos[0];

            // Create and preload the next image element
            if (this._nextImage) {
                const imageUrl = this._photoService.getPhotoUrl(this._nextImage.Hash);
                this._nextImageElement = new Image();

                // Create a promise to wait for the image to load
                await new Promise<void>((resolve) => {
                    if (this._nextImageElement) {
                        this._nextImageElement.onload = () => resolve();
                        this._nextImageElement.onerror = () => {
                            console.error('Error preloading next image');
                            resolve(); // Resolve anyway to continue
                        };
                        this._nextImageElement.src = imageUrl;
                    } else {
                        resolve(); // Resolve anyway to continue
                    }
                });
            }
        } catch (error) {
            console.error('Error preloading next photo:', error);
        } finally {
            this._isPreloading = false;
        }
    }

    private async getRandomPhoto(): Promise<PhotoPrismPhoto[]> {
        return await this._photoService.getRandomPhotos(1, this._orientation);
    }

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

    private getPhotoDate(photo: PhotoPrismPhoto): string {
        if (photo.TakenAtLocal) {
            const date = new Date(photo.TakenAtLocal);
            return date.toLocaleDateString();
        }
        return 'Unknown date';
    }

    public startAutoPlay(): void {
        // Clear any existing timer
        this.stopAutoPlay();

        // Set a timer to advance to the next slide
        this._autoPlayTimer = window.setTimeout(async () => {
            await this.advanceImage();

            // Restart the timer after advancing
            if (this._autoPlay) {
                this.startAutoPlay();
            }
        }, this._slideDuration);
    }

    public stopAutoPlay(): void {
        if (this._autoPlayTimer) {
            window.clearTimeout(this._autoPlayTimer);
            this._autoPlayTimer = null;
        }
    }

    // // Toggle auto-play
    // toggleAutoPlay(): boolean {
    //     this._autoPlay = !this._autoPlay;
    //
    //     if (this._autoPlay) {
    //         this.startAutoPlay();
    //     } else {
    //         this.stopAutoPlay();
    //     }
    //
    //     return this._autoPlay;
    // }
    //
    // // Set slide duration
    // setSlideDuration(duration: number): void {
    //     this._slideDuration = duration;
    //
    //     // Restart auto-play with new duration if it's currently active
    //     if (this._autoPlay && this._autoPlayTimer) {
    //         this.startAutoPlay();
    //     }
    // }
    //
    // // Get current auto-play status
    // isAutoPlayEnabled(): boolean {
    //     return this._autoPlay;
    // }
    //
    // // Get current slide duration
    // getSlideDuration(): number {
    //     return this._slideDuration;
    // }

    public dispose(): void {
        this.stopAutoPlay();

        this._currentImage = null;
        this._nextImage = null;
        this._currentImageElement = null;
        this._nextImageElement = null;
    }
}
