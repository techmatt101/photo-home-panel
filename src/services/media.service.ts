import { MediaPlayerEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from "../intergrations/home-assistant/home-assistant-api";
import { Observable } from "rxjs";

export class MediaService {
    public currentlyPlayer: Observable<MediaPlayerEntity>;
    private _homeAssistantApi: HomeAssistantApi;

    constructor(homeAssistantApi: HomeAssistantApi) {
        this._homeAssistantApi = homeAssistantApi;
        this.currentlyPlayer = homeAssistantApi.entity$('media_player.spotify_matthew');
    }

    public async mediaCommand(command: 'play' | 'pause' | 'next' | 'previous'): Promise<void> {
        await this._homeAssistantApi.mediaPlayerCommand(
            'media_player.spotify_matthew',
            command
        );
    }
}