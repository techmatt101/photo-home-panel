import {css, html, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import Hammer from 'hammerjs';
import {SlideshowService} from "../services/slideshow-service";

@customElement('photo-slideshow')
export class PhotoSlideshow extends LitElement {
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

    transitionDuration: number = 1000;

    @state() private isLoading = true;
    @state() private imageUrl: string | null = null;
    @state() private nextImageUrl: string | null = null;
    @state() private photoLocation: string | null = null;
    @state() private photoDate: string | null = null;
    @state() private isTransitioning = false;

    private transitioning = false;

    private hammer: HammerManager | null = null;
    private slideshowService: SlideshowService = new SlideshowService();

    async connectedCallback() {
        super.connectedCallback();

        try {
            // Initialize the slideshow service which will load the current image
            // and preload the next image
            await this.slideshowService.initialize();

            // Set up swipe gestures
            this.hammer = new Hammer(this);
            this.hammer.on('swipeleft', () => {
                this.nextSlide();
            });
            this.hammer.on('swiperight', () => {
                this.previousSlide();
            });

            // Update the component with both current and next image info
            this.updatePhotoInfo();
        } catch (error) {
            console.error('Error initializing services:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // Update photo information from the service
    private updatePhotoInfo() {
        // Get current photo info
        const photoInfo = this.slideshowService.getCurrentPhotoInfo();
        if (photoInfo) {
            this.imageUrl = photoInfo.url;
            this.photoLocation = photoInfo.location;
            this.photoDate = photoInfo.date;
        } else {
            this.imageUrl = this.slideshowService.getCurrentImageUrl();
            this.photoLocation = null;
            this.photoDate = null;
        }

        // Get next photo info
        const nextPhotoInfo = this.slideshowService.getNextPhotoInfo();
        if (nextPhotoInfo) {
            this.nextImageUrl = nextPhotoInfo.url;
        } else {
            this.nextImageUrl = this.slideshowService.getNextImageUrl();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        this.slideshowService.dispose();
        if (this.hammer) {
            this.hammer.destroy();
            this.hammer = null;
        }
    }

    nextSlide() {
        this.transitionToNextImage(() => this.slideshowService.advanceImage());
    }

    previousSlide() {
        this.transitionToNextImage(() => this.slideshowService.previousImage());
    }

    private async transitionToNextImage(callback: () => Promise<unknown>) {
        if (this.transitioning) return;
        this.transitioning = true;
        this.isTransitioning = true;

        // Start the cross-fade animation
        // The CSS will handle the actual animation based on the isTransitioning state

        // Wait for the transition duration
        setTimeout(async () => {
            // After the fade out, load the next image
            await callback();
            this.updatePhotoInfo();

            // Wait a bit for the DOM to update
            setTimeout(() => {
                // End the transition
                this.isTransitioning = false;
                this.transitioning = false;
            }, 50);
        }, this.transitionDuration);
    }

    render() {
        return html`
            ${this.isLoading ? html`<loading-spinner></loading-spinner>` : ``}
            ${(this.photoLocation || this.photoDate) ? html`
                <div class="photo-info">
                    ${this.photoLocation ? html`<p>📍 ${this.photoLocation}</p>` : ''}
                    ${this.photoDate ? html`<p>📅 ${this.photoDate}</p>` : ''}
                </div>
            ` : ''}
            ${this.imageUrl ? html`
                <div class="image-container ${this.isTransitioning ? 'previous' : 'current'}">
                    <div class="image-background" style="background-image: url(${this.imageUrl})"></div>
                    <img class="image" src="${this.imageUrl}" alt="Current photo"/>
                </div>
            ` : ''}

            ${this.nextImageUrl ? html`
                <div class="image-container ${this.isTransitioning ? 'current' : 'next'}">
                    <div class="image-background" style="background-image: url(${this.nextImageUrl})"></div>
                    <img class="image" src="${this.nextImageUrl}" alt="Next photo"/>
                </div>
            ` : ''}

            <div class="nav-buttons">
                <button class="nav-button" @click=${this.previousSlide}>❮</button>
                <button class="nav-button" @click=${this.nextSlide}>❯</button>
            </div>
        `;
    }
}
