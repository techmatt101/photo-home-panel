import { MediaPlayerEntity, SpotcastStartOptions } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantFacade } from "../intergrations/home-assistant/home-assistant.facade";
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
    private _ha: HomeAssistantFacade;

    private static readonly SPOTCAST_DEFAULTS: SpotcastStartOptions = {
        entity_id: 'media_player.kitchen_speaker',
        shuffle: true,
        random_song: true,
        force_playback: true
    };

    constructor(homeAssistant: HomeAssistantFacade) {
        this._ha = homeAssistant;
        this.viewModel$ = this._ha
            .entity$<MediaPlayerEntity | null>(MEDIA_PLAYER_ENTITY_ID)
            .pipe(map((entity) => this._mapToViewModel(entity)));
    }

    public async togglePlay(isPlaying: boolean): Promise<void> {
        await this._ha.mediaTogglePlay(MEDIA_PLAYER_ENTITY_ID, isPlaying);
    }

    public async previousTrack(): Promise<void> {
        await this._ha.mediaPrevious(MEDIA_PLAYER_ENTITY_ID);
    }

    public async nextTrack(): Promise<void> {
        await this._ha.mediaNext(MEDIA_PLAYER_ENTITY_ID);
    }

    public async setShuffleState(shuffle: boolean): Promise<void> {
        await this._ha.mediaSetShuffle(MEDIA_PLAYER_ENTITY_ID, shuffle);
    }

    public async setVolumePercent(volumePercent: number): Promise<void> {
        await this._ha.mediaSetVolumePercent(MEDIA_PLAYER_ENTITY_ID, volumePercent);
    }

    public async startKitchenMusic(): Promise<void> {
        await this._ha.spotcastStart(MediaService.SPOTCAST_DEFAULTS);
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
            return new URL(picture, this._ha.getBaseUrl()).toString();
        } catch (error) {
            console.warn('Unable to resolve media artwork URL', error);
            return picture;
        }
    }
}

