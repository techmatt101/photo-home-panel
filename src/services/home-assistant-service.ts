import axios from 'axios';
import {
  Connection,
  createConnection,
  getAuth,
  subscribeEntities,
  ERR_HASS_HOST_REQUIRED,
  Auth,
  AuthData,
  callService
} from 'home-assistant-js-websocket';

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
interface HomeAssistantConfig {
  url: string;
  accessToken?: string;
}

// Saved authentication data
interface SavedAuth {
  hassUrl: string;
  clientId: string;
  expires: number;
  refresh_token: string;
  access_token: string;
  expires_in: number;
}

class HomeAssistantService {
  private config: HomeAssistantConfig;
  private connection: Connection | null = null;
  private entities: Record<string, any> = {};
  private entityListeners: Map<string, Set<(entity: any) => void>> = new Map();
  private connectionPromise: Promise<Connection> | null = null;
  
  constructor() {
    // Default configuration - should be loaded from user settings in a real app
    this.config = {
      url: 'http://homeassistant.local',
      accessToken: undefined
    };
  }
  
  // Initialize the service and connect to Home Assistant
  async initialize(): Promise<boolean> {
    try {
      await this.connect();
      return true;
    } catch (error) {
      console.error('Failed to initialize Home Assistant service:', error);
      return false;
    }
  }
  
  // Connect to Home Assistant WebSocket API
  async connect(): Promise<Connection> {
    if (this.connection) {
      return this.connection;
    }
    
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    this.connectionPromise = (async () => {
      try {
        // Try to load saved auth from localStorage in a real app
        let auth: Auth;
        
        if (this.config.accessToken) {
          // Use long-lived access token if provided
          auth = await getAuth({
            hassUrl: this.config.url,
            saveTokens: () => {},
            loadTokens: () => ({
              hassUrl: this.config.url,
              clientId: '',
              expires: 0,
              refresh_token: '',
              access_token: this.config.accessToken!,
              expires_in: 3600
            })
          });
        } else {
          // Otherwise use the normal auth flow
          auth = await getAuth({
            hassUrl: this.config.url,
            saveTokens: (tokens: AuthData) => {
              // In a real app, save tokens to localStorage
              console.log('Saving tokens:', tokens);
            },
            loadTokens: () => {
              // In a real app, load tokens from localStorage
              return undefined;
            }
          });
        }
        
        // Create connection
        this.connection = await createConnection({ auth });
        
        // Subscribe to entities
        subscribeEntities(this.connection, (entities) => {
          this.entities = entities;
          
          // Notify entity listeners
          for (const [entityId, entity] of Object.entries(entities)) {
            const listeners = this.entityListeners.get(entityId);
            if (listeners) {
              for (const listener of listeners) {
                listener(entity);
              }
            }
          }
        });
        
        return this.connection;
      } catch (err) {
        if (err === ERR_HASS_HOST_REQUIRED) {
          throw new Error('Home Assistant URL is required');
        } else {
          throw err;
        }
      } finally {
        this.connectionPromise = null;
      }
    })();
    
    return this.connectionPromise;
  }
  
  // Subscribe to entity updates
  subscribeEntity<T>(entityId: string, callback: (entity: T) => void): () => void {
    if (!this.entityListeners.has(entityId)) {
      this.entityListeners.set(entityId, new Set());
    }
    
    const listeners = this.entityListeners.get(entityId)!;
    listeners.add(callback as any);
    
    // If we already have data for this entity, call the callback immediately
    if (this.entities[entityId]) {
      callback(this.entities[entityId] as T);
    }
    
    // Return unsubscribe function
    return () => {
      const listeners = this.entityListeners.get(entityId);
      if (listeners) {
        listeners.delete(callback as any);
        if (listeners.size === 0) {
          this.entityListeners.delete(entityId);
        }
      }
    };
  }
  
  // Get weather data
  async getWeather(entityId: string = 'weather.stafford'): Promise<WeatherEntity | null> {
    try {
      await this.connect();
      return this.entities[entityId] as WeatherEntity || null;
    } catch (error) {
      console.error('Failed to get weather data:', error);
      return null;
    }
  }
  
  // Subscribe to weather updates
  subscribeWeather(callback: (weather: WeatherEntity) => void, entityId: string = 'weather.stafford'): () => void {
    return this.subscribeEntity<WeatherEntity>(entityId, callback);
  }
  
  // Get calendar events
  async getCalendarEvents(): Promise<CalendarEntity[]> {
    try {
      await this.connect();
      
      // Filter entities to find calendar entities
      const calendarEntities: CalendarEntity[] = [];
      for (const [entityId, entity] of Object.entries(this.entities)) {
        if (entityId.startsWith('calendar.')) {
          calendarEntities.push(entity as CalendarEntity);
        }
      }
      
      return calendarEntities;
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  }
  
  // Get media player status
  async getMediaPlayerStatus(entityId: string = 'media_player.spotify'): Promise<MediaPlayerEntity | null> {
    try {
      await this.connect();
      return this.entities[entityId] as MediaPlayerEntity || null;
    } catch (error) {
      console.error('Failed to get media player status:', error);
      return null;
    }
  }
  
  // Subscribe to media player updates
  subscribeMediaPlayer(callback: (mediaPlayer: MediaPlayerEntity) => void, entityId: string = 'media_player.spotify'): () => void {
    return this.subscribeEntity<MediaPlayerEntity>(entityId, callback);
  }
  
  // Get TV status
  async getTVStatus(entityId: string = 'media_player.shield'): Promise<MediaPlayerEntity | null> {
    try {
      await this.connect();
      return this.entities[entityId] as MediaPlayerEntity || null;
    } catch (error) {
      console.error('Failed to get TV status:', error);
      return null;
    }
  }
  
  // Subscribe to TV updates
  subscribeTV(callback: (tv: MediaPlayerEntity) => void, entityId: string = 'media_player.shield'): () => void {
    return this.subscribeEntity<MediaPlayerEntity>(entityId, callback);
  }
  
  // Control lights
  async toggleLight(entityId: string): Promise<void> {
    try {
      const connection = await this.connect();
      const domain = 'light';
      const service = 'toggle';
      
      await callService(connection, domain, service, { entity_id: entityId });
    } catch (error) {
      console.error(`Failed to toggle light ${entityId}:`, error);
      throw error;
    }
  }
  
  // Start vacuum cleaner
  async startVacuum(entityId: string = 'vacuum.robot_vacuum'): Promise<void> {
    try {
      const connection = await this.connect();
      const domain = 'vacuum';
      const service = 'start';
      
      await callService(connection, domain, service, { entity_id: entityId });
    } catch (error) {
      console.error(`Failed to start vacuum ${entityId}:`, error);
      throw error;
    }
  }
  
  // Control media player
  async mediaPlayerCommand(entityId: string, command: 'play' | 'pause' | 'next' | 'previous' | 'volume_up' | 'volume_down' | 'volume_mute'): Promise<void> {
    try {
      const connection = await this.connect();
      const domain = 'media_player';
      
      await callService(connection, domain, command, { entity_id: entityId });
    } catch (error) {
      console.error(`Failed to send command ${command} to media player ${entityId}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
export const homeAssistantService = new HomeAssistantService();

// Export the service
export default homeAssistantService;