import { MediaPlayerEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from "../intergrations/home-assistant/home-assistant-api";

export class ControlButtonsService {
    private _tvStatus: MediaPlayerEntity | null = null;
    private _tvSubscribers: ((tv: MediaPlayerEntity | null) => void)[] = [];

    private _homeAssistantApi: HomeAssistantApi;

    constructor(homeAssistantApi: HomeAssistantApi) {
        this._homeAssistantApi = homeAssistantApi;
    }

    public async initialize(): Promise<void> {
        this._homeAssistantApi.subscribeTV((tv) => {
            this._tvStatus = tv;
            this.notifySubscribers();
        });
    }

    public getTVStatus(): MediaPlayerEntity | null {
        return this._tvStatus;
    }

    public isTVOn(): boolean {
        return this._tvStatus !== null && this._tvStatus.state !== 'off';
    }

    public subscribeTV(callback: (tv: MediaPlayerEntity | null) => void): void {
        this._tvSubscribers.push(callback);

        if (this._tvStatus) {
            callback(this._tvStatus);
        }
    }

    public unsubscribeTV(callback: (tv: MediaPlayerEntity | null) => void): void {
        this._tvSubscribers = this._tvSubscribers.filter(cb => cb !== callback);
    }

    public async toggleLight(entityId: string): Promise<boolean> {
        try {
            await this._homeAssistantApi.toggleLight(entityId);
            return true;
        } catch (error) {
            console.error(`Failed to toggle light ${entityId}:`, error);
            return false;
        }
    }

    public async startVacuum(): Promise<boolean> {
        try {
            await this._homeAssistantApi.startVacuum();
            return true;
        } catch (error) {
            console.error('Failed to start vacuum:', error);
            return false;
        }
    }

    public dispose(): void {
        this._tvSubscribers = [];
    }

    private notifySubscribers(): void {
        for (const callback of this._tvSubscribers) {
            callback(this._tvStatus);
        }
    }
}