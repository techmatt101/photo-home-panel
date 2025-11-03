import { WeatherEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantFacade } from "../intergrations/home-assistant/home-assistant-facade";
import { Observable } from "rxjs";

export class WeatherService {
    public weatherData$: Observable<WeatherEntity>;

    constructor(homeAssistant: HomeAssistantFacade) {
        this.weatherData$ = homeAssistant.entity$<WeatherEntity>('weather.forecast_home');
    }
}
