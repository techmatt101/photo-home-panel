import { Observable } from 'rxjs';
import { HomeAssistantApi } from './home-assistant-api';
import { SpotcastStartOptions } from './home-assistant.types';

export class HomeAssistantFacade {
    private _api: HomeAssistantApi;

    constructor(api: HomeAssistantApi) {
        this._api = api;
    }

    // Entity streams (per-entity subscription)
    public entity$<T>(entityId: string): Observable<T> {
        return this._api.entity$<T>(entityId);
    }

    public getBaseUrl(): string {
        return this._api.getBaseUrl();
    }

    // Media controls
    public async mediaTogglePlay(entityId: string, isPlaying: boolean): Promise<void> {
        await this._mediaCommand(entityId, isPlaying ? 'pause' : 'play');
    }

    public async mediaPrevious(entityId: string): Promise<void> {
        await this._mediaCommand(entityId, 'previous');
    }

    public async mediaNext(entityId: string): Promise<void> {
        await this._mediaCommand(entityId, 'next');
    }

    public async mediaSetShuffle(entityId: string, shuffle: boolean): Promise<void> {
        await this._api.callService('media_player', 'shuffle_set', { entity_id: entityId, shuffle });
    }

    public async mediaSetVolumePercent(entityId: string, volumePercent: number): Promise<void> {
        const clampedPercent = Math.max(0, Math.min(100, volumePercent));
        await this._api.callService('media_player', 'volume_set', {
            entity_id: entityId,
            volume_level: clampedPercent / 100
        });
    }

    public async spotcastStart(options: SpotcastStartOptions): Promise<void> {
        await this._api.callService('spotcast', 'start', options);
    }

    // Lights
    public async lightToggle(entityId: string): Promise<void> {
        await this._api.callService('light', 'toggle', { entity_id: entityId });
    }

    // Vacuum
    public async vacuumStart(entityId: string): Promise<void> {
        await this._api.callService('vacuum', 'start', { entity_id: entityId });
    }

    // Timer controls
    public async timerControl(
        entityId: string,
        command: 'start' | 'pause' | 'cancel' | 'finish',
        payload: Record<string, unknown> = {}
    ): Promise<void> {
        await this._api.callService('timer', command, { entity_id: entityId, ...payload });
    }

    // Discovery helpers
    public async listEntityIdsByDomain(_domain: string): Promise<string[]> {
        return [];
        // const states = await this._api.getStates();
        // return states
        //     .map((s: any) => s.entity_id as string)
        //     .filter((id: string) => id && id.startsWith(`${domain}.`));
    }

    // public async getStates(): Promise<any[]> {
    //     return this._api.getStates();
    // }

    private async _mediaCommand(
        entityId: string,
        command: 'play' | 'pause' | 'next' | 'previous' | 'volume_mute'
    ): Promise<void> {
        const serviceMap: Record<string, string> = {
            play: 'media_play',
            pause: 'media_pause',
            next: 'media_next_track',
            previous: 'media_previous_track'
        };
        const service = serviceMap[command] ?? command;
        const payload: Record<string, unknown> = { entity_id: entityId };
        if (command === 'volume_mute') {
            payload.is_volume_muted = true;
        }
        await this._api.callService('media_player', service, payload);
    }
}
