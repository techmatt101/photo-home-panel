import { WeatherEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from "../intergrations/home-assistant/home-assistant-api";

export class WeatherService {
    private weatherData: WeatherEntity | null = null;
    private weatherSubscribers: ((weather: WeatherEntity | null) => void)[] = [];

    private _homeAssistantApi: HomeAssistantApi;

    constructor(homeAssistantApi: HomeAssistantApi) {
        this._homeAssistantApi = homeAssistantApi;
    }

    public async initialize(): Promise<void> {
        this._homeAssistantApi.subscribeWeather((weather) => {
            this.weatherData = weather;
            this.notifySubscribers();
        });
    }

    public getWeatherData(): WeatherEntity | null {
        return this.weatherData;
    }

    public subscribeWeather(callback: (weather: WeatherEntity | null) => void): void {
        this.weatherSubscribers.push(callback);

        if (this.weatherData) {
            callback(this.weatherData);
        }
    }

    public unsubscribeWeather(callback: (weather: WeatherEntity | null) => void): void {
        this.weatherSubscribers = this.weatherSubscribers.filter(cb => cb !== callback);
    }

    public dispose(): void {
        this.weatherSubscribers = [];
    }

    private notifySubscribers(): void {
        for (const callback of this.weatherSubscribers) {
            callback(this.weatherData);
        }
    }
}