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
        this.tvStatus$ = this._homeAssistantApi.tv$();
        this.lightStatus$ = this._homeAssistantApi.entity$<LightEntity>('light.kitchen');
        this.vacuumStatus$ = this._homeAssistantApi.entity$<VacuumEntity>('vacuum.cleaner');
    }

    public async toggleLight(entityId: string): Promise<void> {
        await this._homeAssistantApi.toggleLight(entityId);
    }

    public async startVacuum(): Promise<void> {
        await this._homeAssistantApi.startVacuum();
    }
}