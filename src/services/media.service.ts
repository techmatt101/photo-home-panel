import { MediaPlayerEntity, SpotcastStartOptions } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from "../intergrations/home-assistant/home-assistant-api";
import { map, Observable } from "rxjs";

const MEDIA_PLAYER_ENTITY_ID = 'media_player.spotify_matthew';
const MUSIC_PLAYER_URI = 'spotify://';
const MUSIC_PLAYER_FALLBACK_URL = 'https://open.spotify.com/';

export interface MediaPlayerViewModel {
    hasEntity: boolean;
    isPlaying: boolean;
    isPaused: boolean;
    isIdle: boolean;
    mediaTitle: string | null;
    mediaArtist: string | null;
    deviceName: string;
    shuffleOn: boolean;
    volumePercent: number;
    artworkUrl: string | null;
}

export class MediaService {
    public readonly viewModel$: Observable<MediaPlayerViewModel>;
    private _homeAssistantApi: HomeAssistantApi;

    private static readonly SPOTCAST_DEFAULTS: SpotcastStartOptions = {
        entity_id: 'media_player.kitchen_speaker',
        shuffle: true,
        random_song: true,
        force_playback: true
    };

    constructor(homeAssistantApi: HomeAssistantApi) {
        this._homeAssistantApi = homeAssistantApi;
        this.viewModel$ = this._homeAssistantApi
            .entity$<MediaPlayerEntity | null>(MEDIA_PLAYER_ENTITY_ID)
            .pipe(map((entity) => this._mapToViewModel(entity)));
    }

    public async togglePlay(isPlaying: boolean): Promise<void> {
        await this._mediaCommand(isPlaying ? 'pause' : 'play');
    }

    public async previousTrack(): Promise<void> {
        await this._mediaCommand('previous');
    }

    public async nextTrack(): Promise<void> {
        await this._mediaCommand('next');
    }

    public async setShuffleState(shuffle: boolean): Promise<void> {
        await this._homeAssistantApi.setMediaPlayerShuffle(
            MEDIA_PLAYER_ENTITY_ID,
            shuffle
        );
    }

    public async setVolumePercent(volumePercent: number): Promise<void> {
        const clampedPercent = Math.max(0, Math.min(100, volumePercent));
        await this._homeAssistantApi.setMediaPlayerVolume(
            MEDIA_PLAYER_ENTITY_ID,
            clampedPercent / 100
        );
    }

    public async startKitchenMusic(): Promise<void> {
        await this._homeAssistantApi.startSpotcast(MediaService.SPOTCAST_DEFAULTS);
    }

    public openMusicPlayer(): void {
        if (typeof window === 'undefined') {
            return;
        }

        const spotifyWindow = window.open(MUSIC_PLAYER_URI, '_blank');
        if (!spotifyWindow) {
            window.open(MUSIC_PLAYER_FALLBACK_URL, '_blank');
        }
    }

    private async _mediaCommand(command: 'play' | 'pause' | 'next' | 'previous'): Promise<void> {
        await this._homeAssistantApi.mediaPlayerCommand(
            MEDIA_PLAYER_ENTITY_ID,
            command
        );
    }

    private _mapToViewModel(entity: MediaPlayerEntity | null): MediaPlayerViewModel {
        if (!entity) {
            return {
                hasEntity: false,
                isPlaying: false,
                isPaused: false,
                isIdle: true,
                mediaTitle: null,
                mediaArtist: null,
                deviceName: 'Spotify',
                shuffleOn: false,
                volumePercent: 0,
                artworkUrl: null
            };
        }

        const isPlaying = entity.state === 'playing';
        const isPaused = entity.state === 'paused';
        const volumePercent = Math.round((entity.attributes.volume_level ?? 0) * 100);

        return {
            hasEntity: true,
            isPlaying,
            isPaused,
            isIdle: !isPlaying && !isPaused,
            mediaTitle: entity.attributes.media_title ?? null,
            mediaArtist: entity.attributes.media_artist ?? null,
            deviceName: entity.attributes.source ?? entity.attributes.friendly_name ?? 'Spotify',
            shuffleOn: Boolean(entity.attributes.shuffle),
            volumePercent,
            artworkUrl: this._resolveArtworkUrl(entity)
        };
    }

    private _resolveArtworkUrl(entity: MediaPlayerEntity | null): string | null {
        const picture = entity?.attributes?.entity_picture;

        if (!picture) {
            return null;
        }

        if (/^https?:\/\//i.test(picture)) {
            return picture;
        }

        try {
            return new URL(picture, this._homeAssistantApi.getBaseUrl()).toString();
        } catch (error) {
            console.warn('Unable to resolve media artwork URL', error);
            return picture;
        }
    }
}
