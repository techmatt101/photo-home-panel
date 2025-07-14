import homeAssistantService from './home-assistant-service';
import {WeatherEntity} from '../types/home-assistant.types';

class WeatherService {
    private weatherData: WeatherEntity | null = null;
    private weatherSubscribers: ((weather: WeatherEntity | null) => void)[] = [];

    // Initialize the weather service
    async initialize(): Promise<boolean> {
        try {
            // Initialize the Home Assistant service
            const initialized = await homeAssistantService.initialize();

            if (initialized) {
                // Subscribe to weather updates from Home Assistant
                homeAssistantService.subscribeWeather((weather) => {
                    this.weatherData = weather;
                    // Notify all subscribers
                    this.notifySubscribers();
                });
                return true;
            } else {
                console.error('Failed to initialize Home Assistant service for weather');
                return false;
            }
        } catch (error) {
            console.error('Error initializing weather service:', error);
            return false;
        }
    }

    // Get current weather data
    getWeatherData(): WeatherEntity | null {
        return this.weatherData;
    }

    // Subscribe to weather updates
    subscribeWeather(callback: (weather: WeatherEntity | null) => void): void {
        this.weatherSubscribers.push(callback);

        // Immediately notify with current data if available
        if (this.weatherData) {
            callback(this.weatherData);
        }
    }

    // Unsubscribe from weather updates
    unsubscribeWeather(callback: (weather: WeatherEntity | null) => void): void {
        this.weatherSubscribers = this.weatherSubscribers.filter(cb => cb !== callback);
    }

    // Clean up resources
    dispose(): void {
        this.weatherSubscribers = [];
    }

    // Notify all subscribers of weather updates
    private notifySubscribers(): void {
        for (const callback of this.weatherSubscribers) {
            callback(this.weatherData);
        }
    }
}

// Create a singleton instance
export const weatherService = new WeatherService();

// Export the service
export default weatherService;