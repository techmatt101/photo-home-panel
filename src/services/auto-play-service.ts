import slideshowService from './slideshow-service';

class AutoPlayService {
  private autoPlayTimer: number | null = null;
  private autoPlay: boolean = true;
  private slideDuration: number = 10000; // 10 seconds default

  // Initialize the auto-play service
  initialize(autoPlay: boolean = true, slideDuration: number = 10000): void {
    this.autoPlay = autoPlay;
    this.slideDuration = slideDuration;

    if (this.autoPlay) {
      this.startAutoPlay();
    }
  }

  // Start auto-play
  startAutoPlay(): void {
    // Clear any existing timer
    this.stopAutoPlay();

    // Set a timer to advance to the next slide
    this.autoPlayTimer = window.setTimeout(async () => {
      await slideshowService.nextImage();
      
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
export const autoPlayService = new AutoPlayService();

// Export the service
export default autoPlayService;