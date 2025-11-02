import { css, html, LitElement } from 'lit';
import { Subject, takeUntil } from 'rxjs';
import { customElement, state } from 'lit/decorators.js';
import { photoPrismApi, settingsService } from "../state";
import { Slideshow, SlideshowImage } from "../services/slideshow";
import { nextImage } from "../services/photo-service";

@customElement('photo-slideshow')
export class PhotoSlideshow extends LitElement {
    public static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            background-color: #000;
            --a: 0%;
        }

        /* Image containers and transitions */

        .image-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .image-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            filter: blur(40px) brightness(0.7);
            transform: scale(1.1);
        }

        .image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            z-index: 1;
            position: relative;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        //
        //img {
        //    mask: radial-gradient(#000 70%, #0000 71%) content-box 50% / var(--_s, 150% 150%) no-repeat, linear-gradient(#000 0 0);
        //    mask-composite: exclude;
        //    transition: .5s;
        //}
        //
        //img:hover {
        //    --_s: 0% 0%;
        //}

        .next-image {
            mask: linear-gradient(90deg, #0000 calc(var(--a) - 5%), #000 var(--a));
            mask-composite: exclude;
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
            transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.5s ease;
            opacity: 0;
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
        
        @keyframes fadeIn2 {
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        }

        :host(:hover) {
            .nav-button {
                opacity: 1;
            }
        }

    `;


    @state() private _isLoading = true;
    @state() private _nextImage: SlideshowImage | null = null;
    @state() private _image: SlideshowImage | null = null;

    private _slideshow: Slideshow;
    private _destroy$ = new Subject<void>();
    private _autoPlayCancel$ = new Subject<void>();

    constructor() {
        super();
        const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        this._slideshow = new Slideshow(nextImage(photoPrismApi, orientation));

        // window.addEventListener('resize', this._handleResize.bind(this));
    }

    public async connectedCallback() {
        super.connectedCallback();

        this._slideshow.image.pipe(takeUntil(this._destroy$)).subscribe((photoInfo) => {
            this.transitionToNextImage(photoInfo);
        });

        // Start autoplay using current settings (app reload applies changes)
        try {
            const s = settingsService.get();
            this._startAutoPlay(Number(s.slideshow.autoPlaySeconds) || 30);
        } catch {}

        try {
            await this._slideshow.nextImage();

            // this._hammer = new Hammer(this);
            // this._hammer.on('swipeleft', () => {
            //     this.nextSlide();
            // });
            // this._hammer.on('swiperight', () => {
            //     this.previousSlide();
            // });

        } catch (error) {
            console.error('Error initializing services:', error);
        } finally {
            this._isLoading = false;
        }
    }

    public disconnectedCallback() {
        super.disconnectedCallback();
        this._destroy$.next();
        this._destroy$.complete();
        this._autoPlayCancel$.next();
        this._autoPlayCancel$.complete();
    }

    private _startAutoPlay(seconds: number): void {
        this._autoPlayCancel$.next();
        this._slideshow
            .autoPlay(seconds * 1000)
            .pipe(
                takeUntil(this._destroy$),
                takeUntil(this._autoPlayCancel$)
            )
            .subscribe();
    }

    // settings updates are handled via subscription above

    public nextSlide() {
        this._slideshow.nextImage();
    }

    public previousSlide() {
        this._slideshow.prevImage();
    }

    private async transitionToNextImage(photoInfo: SlideshowImage) {
        // if (this._transitioning) return;
        if(!this._image) {
            this._image = photoInfo;
            return;
        }
        this._nextImage = photoInfo;

        await this.animateWipe(this, 500);

        this._image = this._nextImage;
        this._nextImage = null;
    }

    private animateWipe(img: any, duration: number): Promise<void> {
        return new Promise<void>((resolve) => {
            let start: number;
            function step(timestamp: number) {
                if (!start) start = timestamp;
                const elapsed = timestamp - start;
                // progress is 0 to 1
                const progress = Math.min(elapsed / duration, 1);
                // Set --a from 0% to 100%
                img.style.setProperty('--a', (Math.abs(progress - 1) * 110) + '%');
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            }
            requestAnimationFrame(step);
        });

    }

    public render() {
        return html`
            ${this._isLoading ? html`
                <loading-spinner></loading-spinner>` : ``}
            ${this._image ? html`
                <div class="image-container">
                    <div class="image-background" style="background-image: url(${this._image.meta.url})"></div>
                    <img class="image" src="${this._image.meta.url}" alt="Current photo"/>
                </div>
            ` : ''}
            ${this._nextImage ? html`
                <div class="image-container next-image">
                    <div class="image-background" style="background-image: url(${this._nextImage.meta.url})"></div>
                    <img class="image" src="${this._nextImage.meta.url}" alt="Current photo"/>
                </div>
            ` : ''}
            
            <div class="nav-buttons">
                <button class="nav-button" @click=${this.previousSlide}>❮</button>
                <button class="nav-button" @click=${this.nextSlide}>❯</button>
            </div>
        `;
    }
}
