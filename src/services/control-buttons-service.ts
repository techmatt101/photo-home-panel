import homeAssistantService from './home-assistant-service';
import {MediaPlayerEntity} from '../types/home-assistant.types';

class ControlButtonsService {
    private tvStatus: MediaPlayerEntity | null = null;
    private tvSubscribers: ((tv: MediaPlayerEntity | null) => void)[] = [];

    // Initialize the control buttons service
    async initialize(): Promise<boolean> {
        try {
            // Initialize the Home Assistant service
            const initialized = await homeAssistantService.initialize();

            if (initialized) {
                // Subscribe to TV updates from Home Assistant
                homeAssistantService.subscribeTV((tv) => {
                    this.tvStatus = tv;
                    // Notify all subscribers
                    this.notifySubscribers();
                });
                return true;
            } else {
                console.error('Failed to initialize Home Assistant service for TV status');
                return false;
            }
        } catch (error) {
            console.error('Error initializing control buttons service:', error);
            return false;
        }
    }

    // Get current TV status
    getTVStatus(): MediaPlayerEntity | null {
        return this.tvStatus;
    }

    // Check if TV is on
    isTVOn(): boolean {
        return this.tvStatus !== null && this.tvStatus.state !== 'off';
    }

    // Subscribe to TV status updates
    subscribeTV(callback: (tv: MediaPlayerEntity | null) => void): void {
        this.tvSubscribers.push(callback);

        // Immediately notify with current data if available
        if (this.tvStatus) {
            callback(this.tvStatus);
        }
    }

    // Unsubscribe from TV status updates
    unsubscribeTV(callback: (tv: MediaPlayerEntity | null) => void): void {
        this.tvSubscribers = this.tvSubscribers.filter(cb => cb !== callback);
    }

    // Toggle a light
    async toggleLight(entityId: string): Promise<boolean> {
        try {
            await homeAssistantService.toggleLight(entityId);
            return true;
        } catch (error) {
            console.error(`Failed to toggle light ${entityId}:`, error);
            return false;
        }
    }

    // Start vacuum cleaner
    async startVacuum(): Promise<boolean> {
        try {
            await homeAssistantService.startVacuum();
            return true;
        } catch (error) {
            console.error('Failed to start vacuum:', error);
            return false;
        }
    }

    // Clean up resources
    dispose(): void {
        this.tvSubscribers = [];
    }

    // Notify all subscribers of TV status updates
    private notifySubscribers(): void {
        for (const callback of this.tvSubscribers) {
            callback(this.tvStatus);
        }
    }
}

// Create a singleton instance
export const controlButtonsService = new ControlButtonsService();

// Export the service
export default controlButtonsService;