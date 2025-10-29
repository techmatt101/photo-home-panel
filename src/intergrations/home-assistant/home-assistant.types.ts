// Types for Home Assistant entities
export interface WeatherEntity {
    state: string;
    attributes: {
        temperature: number;
        humidity: number;
        pressure: number;
        wind_speed: number;
        wind_bearing: number;
        forecast: Array<{
            datetime: string;
            temperature: number;
            condition: string;
            precipitation: number;
            precipitation_probability: number;
        }>;
        friendly_name: string;
    };
}

export interface CalendarEntity {
    state: string;
    attributes: {
        friendly_name: string;
        start_time: string;
        end_time: string;
        location: string;
        description: string;
        all_day: boolean;
    };
}

export interface MediaPlayerEntity {
    state: string;
    attributes: {
        friendly_name: string;
        media_title?: string;
        media_artist?: string;
        media_album_name?: string;
        media_content_id?: string;
        media_content_type?: string;
        media_duration?: number;
        media_position?: number;
        media_position_updated_at?: string;
        volume_level?: number;
        is_volume_muted?: boolean;
        source?: string;
        source_list?: string[];
        sound_mode?: string;
        sound_mode_list?: string[];
        entity_picture?: string;
    };
}

export interface CameraEntity {
    state: string;
    attributes: {
        friendly_name: string;
        access_token?: string;
        entity_picture?: string;
        frontend_stream_type?: string;
        fps?: number;
    };
}

export interface LightEntity {
    state: string;
    attributes: {
        friendly_name: string;
        brightness?: number;
        color_temp?: number;
        rgb_color?: [number, number, number];
        xy_color?: [number, number];
        hs_color?: [number, number];
        effect?: string;
        effect_list?: string[];
    };
}

export interface VacuumEntity {
    state: string;
    attributes: {
        friendly_name: string;
        battery_level?: number;
        fan_speed?: string;
        fan_speed_list?: string[];
    };
}

// Configuration for Home Assistant API
export interface HomeAssistantConfig {
    url: string;
    accessToken: string;
}

// Saved authentication data
export interface SavedAuth {
    hassUrl: string;
    clientId: string;
    expires: number;
    refresh_token: string;
    access_token: string;
    expires_in: number;
}
