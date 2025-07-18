import { WeatherEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from "../intergrations/home-assistant/home-assistant-api";
import { Observable } from "rxjs";

export class WeatherService {
    public weatherData$: Observable<WeatherEntity>;

    private _homeAssistantApi: HomeAssistantApi;

    constructor(homeAssistantApi: HomeAssistantApi) {
        this._homeAssistantApi = homeAssistantApi;
        this.weatherData$ = this._homeAssistantApi.entity$<WeatherEntity>('weather.forecast_home');
    }
}