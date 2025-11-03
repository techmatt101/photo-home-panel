import { LightEntity, MediaPlayerEntity, VacuumEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantFacade } from "../intergrations/home-assistant/home-assistant.facade";
import { Observable } from 'rxjs';

export class ControlButtonsService {
    public tvStatus$: Observable<MediaPlayerEntity>;
    public lightStatus$: Observable<LightEntity>;
    public vacuumStatus$: Observable<VacuumEntity>;
    private _ha: HomeAssistantFacade;

    constructor(homeAssistant: HomeAssistantFacade) {
        this._ha = homeAssistant;
        this.tvStatus$ = this._ha.entity$<MediaPlayerEntity>('media_player.tv');
        this.lightStatus$ = this._ha.entity$<LightEntity>('light.kitchen');
        this.vacuumStatus$ = this._ha.entity$<VacuumEntity>('vacuum.cleaner');
    }

    public async toggleLight(entityId: string): Promise<void> {
        await this._ha.lightToggle(entityId);
    }

    public async startVacuum(): Promise<void> {
        await this._ha.vacuumStart('vacuum.cleaner');
    }
}
