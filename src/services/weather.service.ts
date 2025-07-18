import { WeatherEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from "../intergrations/home-assistant/home-assistant-api";
import { Observable } from "rxjs";

export class WeatherService {
    public weatherData$: Observable<WeatherEntity>;

    constructor(homeAssistantApi: HomeAssistantApi) {
        this.weatherData$ = homeAssistantApi.entity$<WeatherEntity>('weather.forecast_home');
    }
}