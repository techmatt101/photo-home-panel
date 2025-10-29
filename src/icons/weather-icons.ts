const icon = (name: string) => new URL(`../assets/weather/${name}.svg`, import.meta.url).href;

export const WEATHER_ICON_MAP = {
    'clear-night': icon('clear-night'),
    'cloudy': icon('cloudy'),
    'fog': icon('fog'),
    'hail': icon('hail'),
    'lightning': icon('lightning'),
    'lightning-rainy': icon('lightning-rainy'),
    'partlycloudy': icon('partlycloudy'),
    'pouring': icon('pouring'),
    'rainy': icon('rainy'),
    'snowy': icon('snowy'),
    'snowy-rainy': icon('snowy-rainy'),
    'sunny': icon('sunny'),
    'windy': icon('windy'),
    'windy-variant': icon('windy-variant')
} as const satisfies Record<string, string>;

export type WeatherIconKey = keyof typeof WEATHER_ICON_MAP;

export const DEFAULT_WEATHER_ICON = WEATHER_ICON_MAP['cloudy'];

export const getWeatherIcon = (condition: string | null | undefined): string => {
    if (!condition) {
        return DEFAULT_WEATHER_ICON;
    }

    const normalized = condition.trim().toLowerCase().replace(/[\s_]+/g, '-');
    return WEATHER_ICON_MAP[normalized as WeatherIconKey] ?? DEFAULT_WEATHER_ICON;
};
