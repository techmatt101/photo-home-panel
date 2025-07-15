import {MediaPlayerEntity} from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from "../intergrations/home-assistant/home-assistant-api";

export class MediaPlayerService {
    private _mediaStatus: MediaPlayerEntity | null = null;
    private _mediaSubscribers: ((mediaPlayer: MediaPlayerEntity | null) => void)[] = [];

    private _homeAssistantApi: HomeAssistantApi;

    constructor(homeAssistantApi: HomeAssistantApi) {
        this._homeAssistantApi = homeAssistantApi;
    }

    public async initialize(): Promise<void> {
        this._homeAssistantApi.subscribeMediaPlayer((mediaPlayer) => {
            this._mediaStatus = mediaPlayer;
            this.notifySubscribers();
        });
    }

    public getMediaStatus(): MediaPlayerEntity | null {
        return this._mediaStatus;
    }

    public subscribeMediaPlayer(callback: (mediaPlayer: MediaPlayerEntity | null) => void): void {
        this._mediaSubscribers.push(callback);

        // Immediately notify with current data if available
        if (this._mediaStatus) {
            callback(this._mediaStatus);
        }
    }

    public unsubscribeMediaPlayer(callback: (mediaPlayer: MediaPlayerEntity | null) => void): void {
        this._mediaSubscribers = this._mediaSubscribers.filter(cb => cb !== callback);
    }

    public async mediaCommand(command: 'play' | 'pause' | 'next' | 'previous'): Promise<boolean> {
        if (!this._mediaStatus) return false;

        try {
            await this._homeAssistantApi.mediaPlayerCommand(
                'media_player.spotify',
                command
            );
            return true;
        } catch (error) {
            console.error(`Failed to send ${command} command to media player:`, error);
            return false;
        }
    }

    public hasMedia(): boolean {
        return this._mediaStatus !== null &&
            this._mediaStatus.state !== 'off' &&
            this._mediaStatus.state !== 'idle';
    }

    public isPlaying(): boolean {
        return this._mediaStatus?.state === 'playing';
    }

    public dispose(): void {
        this._mediaSubscribers = [];
    }

    private notifySubscribers(): void {
        for (const callback of this._mediaSubscribers) {
            callback(this._mediaStatus);
        }
    }
}