import { PhotoInfo } from "./photo.service";
import { interval, Observable, Subject, switchMap } from "rxjs";

export interface SlideshowImage {
    meta: PhotoInfo;
    image: HTMLImageElement;
}

export class SlideshowService {

    public image = new Subject<SlideshowImage>();

    private _imageGenerator: AsyncGenerator<PhotoInfo>;
    private _imageHistory: SlideshowImage[] = [];
    private _historyIndex: number = -1;
    private _preLoadedNextImage: Promise<SlideshowImage> | null = null;

    constructor(imageGenerator: AsyncGenerator<PhotoInfo>) {
        this._imageGenerator = imageGenerator;
    }

    public autoPlay(duration: number): Observable<void> {
        return interval(duration)
            .pipe(switchMap(() => this.nextImage()));
    }

    public async nextImage(): Promise<void> {
        let nextImage: SlideshowImage | null = null;

        this._historyIndex++;

        if (this._historyIndex < this._imageHistory.length) {
            nextImage = this._imageHistory[this._historyIndex];
        } else {
            if (this._preLoadedNextImage) {
                nextImage = await this._preLoadedNextImage;
                this._preLoadedNextImage = null;
            } else {
                nextImage = await this.preloadNextImage();
            }

            this._imageHistory.push(nextImage);
        }

        this.image.next(nextImage);

        if(this._historyIndex + 1 === this._imageHistory.length && !this._preLoadedNextImage)
            this._preLoadedNextImage = this.preloadNextImage();
    }

    public async prevImage(): Promise<void> {
        if (this._historyIndex <= 0 || this._imageHistory.length === 0) {
            return;
        }

        this._historyIndex--;
        const previousImage = this._imageHistory[this._historyIndex];

        this.image.next(previousImage);
    }

    private async preloadNextImage(): Promise<SlideshowImage> {
        const nextPhoto = await this._imageGenerator.next();
        // if (nextImageResult.done) {
        //     return;
        // }
        const img = await preLoadImage(nextPhoto.value);

        return {
            meta: nextPhoto.value,
            image: img
        };
    }
}

function preLoadImage(photo: PhotoInfo): Promise<HTMLImageElement> {
    const img = new Image();
    return new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        img.src = photo.url;
    });
}