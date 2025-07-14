import homeAssistantService from './home-assistant-service';
import {MediaPlayerEntity} from '../types/home-assistant.types';

class MediaPlayerService {
    private mediaStatus: MediaPlayerEntity | null = null;
    private mediaSubscribers: ((mediaPlayer: MediaPlayerEntity | null) => void)[] = [];

    // Initialize the media player service
    async initialize(): Promise<boolean> {
        try {
            // Initialize the Home Assistant service
            const initialized = await homeAssistantService.initialize();

            if (initialized) {
                // Subscribe to media player updates from Home Assistant
                homeAssistantService.subscribeMediaPlayer((mediaPlayer) => {
                    this.mediaStatus = mediaPlayer;
                    // Notify all subscribers
                    this.notifySubscribers();
                });
                return true;
            } else {
                console.error('Failed to initialize Home Assistant service for media player');
                return false;
            }
        } catch (error) {
            console.error('Error initializing media player service:', error);
            return false;
        }
    }

    // Get current media player status
    getMediaStatus(): MediaPlayerEntity | null {
        return this.mediaStatus;
    }

    // Subscribe to media player updates
    subscribeMediaPlayer(callback: (mediaPlayer: MediaPlayerEntity | null) => void): void {
        this.mediaSubscribers.push(callback);

        // Immediately notify with current data if available
        if (this.mediaStatus) {
            callback(this.mediaStatus);
        }
    }

    // Unsubscribe from media player updates
    unsubscribeMediaPlayer(callback: (mediaPlayer: MediaPlayerEntity | null) => void): void {
        this.mediaSubscribers = this.mediaSubscribers.filter(cb => cb !== callback);
    }

    // Control media player
    async mediaCommand(command: 'play' | 'pause' | 'next' | 'previous'): Promise<boolean> {
        if (!this.mediaStatus) return false;

        try {
            await homeAssistantService.mediaPlayerCommand(
                'media_player.spotify',
                command
            );
            return true;
        } catch (error) {
            console.error(`Failed to send ${command} command to media player:`, error);
            return false;
        }
    }

    // Check if media is available
    hasMedia(): boolean {
        return this.mediaStatus !== null &&
            this.mediaStatus.state !== 'off' &&
            this.mediaStatus.state !== 'idle';
    }

    // Check if media is playing
    isPlaying(): boolean {
        return this.mediaStatus?.state === 'playing';
    }

    // Clean up resources
    dispose(): void {
        this.mediaSubscribers = [];
    }

    // Notify all subscribers of media player updates
    private notifySubscribers(): void {
        for (const callback of this.mediaSubscribers) {
            callback(this.mediaStatus);
        }
    }
}

// Create a singleton instance
export const mediaPlayerService = new MediaPlayerService();

// Export the service
export default mediaPlayerService;