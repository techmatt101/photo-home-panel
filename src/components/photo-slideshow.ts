import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { photoPrismApi } from "../state";
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
            transition: opacity 1s ease-in-out;
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

        /* Photo info */

        .photo-info {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 3;
            font-size: 14px;
            max-width: 80%;
        }

        .photo-info p {
            margin: 5px 0;
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


    @state() private _isLoading = true;
    @state() private _nextImageUrl: string | null = null;
    @state() private _image: SlideshowImage | null = null;
    @state() private _isTransitioning = false;

    private _transitioning = false;
    private _transitionDuration: number = 1000;
    private _slideshow: Slideshow;
    
    constructor() {
        super();
        const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        this._slideshow = new Slideshow(nextImage(photoPrismApi, orientation));
        
        // window.addEventListener('resize', this._handleResize.bind(this));
    }

    public async connectedCallback() {
        super.connectedCallback();

        this._slideshow.image.subscribe((photoInfo) => {
            this._image = photoInfo;
        })

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
    }

    public nextSlide() {
        this.transitionToNextImage(() => this._slideshow.nextImage());
    }

    public previousSlide() {
        this.transitionToNextImage(() => this._slideshow.prevImage());
    }

    private async transitionToNextImage(callback: () => Promise<unknown>) {
        if (this._transitioning) return;
        this._transitioning = true;
        this._isTransitioning = true;

        setTimeout(async () => {
            await callback();

            setTimeout(() => {
                this._isTransitioning = false;
                this._transitioning = false;
            }, 50);
        }, this._transitionDuration);
    }

    public render() {
        return html`
            ${this._isLoading ? html`
                <loading-spinner></loading-spinner>` : ``}
            ${this._image ? html`
                <div class="photo-info">
                    <p>📍 ${this._image.meta.location}</p>
                    <p>📅 ${this._image.meta.date}</p>
                </div>
            ` : ''}
            ${this._image ? html`
                <div class="image-container ${this._isTransitioning ? 'previous' : 'current'}">
                    <div class="image-background" style="background-image: url(${this._image.meta.url})"></div>
                    <img class="image" src="${this._image.meta.url}" alt="Current photo"/>
                </div>
            ` : ''}

            ${this._nextImageUrl ? html`
                <div class="image-container ${this._isTransitioning ? 'current' : 'next'}">
                    <div class="image-background" style="background-image: url(${this._nextImageUrl})"></div>
                    <img class="image" src="${this._nextImageUrl}" alt="Next photo"/>
                </div>
            ` : ''}

            <div class="nav-buttons">
                <button class="nav-button" @click=${this.previousSlide}>❮</button>
                <button class="nav-button" @click=${this.nextSlide}>❯</button>
            </div>
        `;
    }
}
