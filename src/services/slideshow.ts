import { PhotoInfo } from "./photo-service";
import { interval, Observable, Subject, switchMap } from "rxjs";

export class Slideshow {

    public image = new Subject<PhotoInfo>();
    private _imageGenerator: AsyncGenerator<PhotoInfo>;

    constructor(imageGenerator: AsyncGenerator<PhotoInfo>) {
        this._imageGenerator = imageGenerator;
    }

    public autoPlay(duration: number): Observable<void> {
        return interval(duration)
            .pipe(switchMap(() => this.nextImage()));
    }

    public async nextImage(): Promise<void> {
        const image = await this._imageGenerator.next();
        await this.preLoadImage(image.value);
        this.image.next(image.value);
    }

    public async prevImage(): Promise<void> {
        const image = await this._imageGenerator.next();
        this.image.next(image.value);
    }

    private preLoadImage(photo: PhotoInfo): Promise<HTMLImageElement> {
        const img = new Image();
        return new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            img.src = photo.url;
        });
    }
}