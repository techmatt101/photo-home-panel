import slideshowService from './slideshow-service';

class TouchHandlerService {
    private xDown: number | null = null;
    private yDown: number | null = null;
    private element: HTMLElement | null = null;

    // Initialize the touch handler service
    initialize(element: HTMLElement): void {
        this.element = element;

        // Set up touch event listeners
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    // Clean up resources
    dispose(): void {
        if (this.element) {
            this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
            this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
            this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
            this.element = null;
        }
    }

    // Handle touch start event
    private handleTouchStart(evt: TouchEvent): void {
        const firstTouch = evt.touches[0];
        this.xDown = firstTouch.clientX;
        this.yDown = firstTouch.clientY;
    }

    // Handle touch move event
    private handleTouchMove(_evt: TouchEvent): void {
        if (!this.xDown || !this.yDown) {
            return;
        }
    }

    // Handle touch end event
    private handleTouchEnd(evt: TouchEvent): void {
        if (!this.xDown || !this.yDown) {
            return;
        }

        const xUp = evt.changedTouches[0].clientX;
        const yUp = evt.changedTouches[0].clientY;

        const xDiff = this.xDown - xUp;
        const yDiff = this.yDown - yUp;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (slideshowService) {
                if (xDiff > 0) {
                    // Swipe left - next image
                    slideshowService.nextImage();
                } else {
                    // Swipe right - previous image
                    slideshowService.previousImage();
                }
            }
        }

        this.xDown = null;
        this.yDown = null;
    }
}

// Create a singleton instance
export const touchHandlerService = new TouchHandlerService();

// Export the service
export default touchHandlerService;
