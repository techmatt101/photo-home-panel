import { LightEntity, MediaPlayerEntity, VacuumEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from "../intergrations/home-assistant/home-assistant-api";
import { Observable } from 'rxjs';

export class ControlButtonsService {
    public tvStatus$: Observable<MediaPlayerEntity>;
    public lightStatus$: Observable<LightEntity>;
    public vacuumStatus$: Observable<VacuumEntity>;
    private _homeAssistantApi: HomeAssistantApi;

    constructor(homeAssistantApi: HomeAssistantApi) {
        this._homeAssistantApi = homeAssistantApi;
        this.tvStatus$ = this._homeAssistantApi.entity$<MediaPlayerEntity>('media_player.tv');
        this.lightStatus$ = this._homeAssistantApi.entity$<LightEntity>('light.kitchen');
        this.vacuumStatus$ = this._homeAssistantApi.entity$<VacuumEntity>('vacuum.cleaner');
    }

    public async toggleLight(entityId: string): Promise<void> {
        const domain = 'light';
        const service = 'toggle';
        await this._homeAssistantApi.callService(domain, service, {entity_id: entityId});
    }

    public async startVacuum(): Promise<void> {
        const domain = 'vacuum';
        const service = 'start';
        await this._homeAssistantApi.callService(domain, service, {entity_id: 'vacuum.cleaner'});
    }
}