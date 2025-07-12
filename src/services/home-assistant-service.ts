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
import {
  WeatherEntity,
  CalendarEntity,
  MediaPlayerEntity,
  HomeAssistantConfig
} from '../types/home-assistant.types';
import authService, { AuthServiceRegistration } from './auth-service';

class HomeAssistantService {
  private config: HomeAssistantConfig | null = null;
  private connection: Connection | null = null;
  private entities: Record<string, any> = {};
  private entityListeners: Map<string, Set<(entity: any) => void>> = new Map();
  private connectionPromise: Promise<Connection> | null = null;
  private authRequested: boolean = false;
  private serviceType = 'homeassistant';

  constructor() {
    // Register with auth service
    this.registerWithAuthService();
  }

  // Register this service with the auth service
  private registerWithAuthService(): void {
    const registration: AuthServiceRegistration = {
      type: this.serviceType,
      name: 'Home Assistant',
      storageKey: 'homeassistant_auth',
      formFields: [
        {
          id: 'url',
          label: 'Home Assistant URL',
          type: 'url',
          placeholder: 'http://homeassistant.local',
          required: true
        },
        {
          id: 'accessToken',
          label: 'Long-lived Access Token (optional)',
          type: 'password',
          placeholder: 'Enter your access token',
          required: false,
          helpText: 'If you don\'t provide an access token, you\'ll be redirected to the Home Assistant login page.'
        }
      ]
    };

    authService.registerService(registration);
  }

  // Initialize the service and connect to Home Assistant
  async initialize(): Promise<boolean> {
    try {
      // Get config from auth service
      const authConfig = authService.getConfig(this.serviceType);

      if (authConfig) {
        this.config = authConfig as HomeAssistantConfig;
      }

      // If no config is available, request authentication
      if (!this.config && !this.authRequested) {
        this.authRequested = true;
        authService.requestAuth(this.serviceType, 'Please log in to Home Assistant to access your smart home.');
        return false;
      }

      // If we have a config, try to connect
      if (this.config) {
        await this.connect();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize Home Assistant service:', error);

      // If connection fails, request authentication
      if (!this.authRequested) {
        this.authRequested = true;
        authService.requestAuth(this.serviceType, 'Authentication failed. Please check your credentials.');
      }

      return false;
    }
  }

  // Reset authentication state
  resetAuth(): void {
    this.connection = null;
    this.connectionPromise = null;
    this.authRequested = false;
  }

  // Connect to Home Assistant WebSocket API
  async connect(): Promise<Connection> {
    if (this.connection) {
      return this.connection;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (!this.config) {
      throw new Error('Home Assistant configuration is not available');
    }

    this.connectionPromise = (async () => {
      try {
        // Try to load saved auth from auth service
        let auth: Auth;

        // Create a local copy of config to ensure it's not null within this scope
        // We've already checked this.config is not null above, so we can safely assert it's non-null
        const config = this.config!;

        if (config.accessToken) {
          // Use long-lived access token if provided
          auth = await getAuth({
            hassUrl: config.url,
            saveTokens: () => {},
            loadTokens: async () => ({
              hassUrl: config.url,
              clientId: '',
              expires: 0,
              refresh_token: '',
              access_token: config.accessToken || '', // Ensure it's never undefined
              expires_in: 3600
            })
          });
        } else {
          // Otherwise use the normal auth flow
          auth = await getAuth({
            hassUrl: config.url,
            saveTokens: (tokens: AuthData | null) => {
              // Save tokens to auth service
              if (tokens) {
                authService.updateTokens(this.serviceType, tokens);
              }
            },
            loadTokens: async () => {
              // Load tokens from auth service
              return authService.getTokens(this.serviceType);
            }
          });
        }

        // Create connection
        this.connection = await createConnection({ auth });

        // Reset auth requested flag on successful connection
        this.authRequested = false;

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
  async getWeather(entityId: string = 'weather.home'): Promise<WeatherEntity | null> {
    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          return null;
        }
      }

      await this.connect();
      return this.entities[entityId] as WeatherEntity || null;
    } catch (error) {
      console.error('Failed to get weather data:', error);
      return null;
    }
  }

  // Subscribe to weather updates
  subscribeWeather(callback: (weather: WeatherEntity) => void, entityId: string = 'weather.home'): () => void {
    return this.subscribeEntity<WeatherEntity>(entityId, callback);
  }

  // Get calendar events
  async getCalendarEvents(): Promise<CalendarEntity[]> {
    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          return [];
        }
      }

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
  async getMediaPlayerStatus(entityId: string =  'media_player.spotify'): Promise<MediaPlayerEntity | null> {
    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          return null;
        }
      }

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
  async getTVStatus(entityId: string = 'media_player.tv'): Promise<MediaPlayerEntity | null> {
    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          return null;
        }
      }

      await this.connect();
      return this.entities[entityId] as MediaPlayerEntity || null;
    } catch (error) {
      console.error('Failed to get TV status:', error);
      return null;
    }
  }

  // Subscribe to TV updates
  subscribeTV(callback: (tv: MediaPlayerEntity) => void, entityId: string = 'media_player.tv'): () => void {
    return this.subscribeEntity<MediaPlayerEntity>(entityId, callback);
  }

  // Control lights
  async toggleLight(entityId: string): Promise<void> {
    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          throw new Error('Home Assistant configuration is not available');
        }
      }

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
  async startVacuum(entityId: string = 'vacuum.cleaner'): Promise<void> {
    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          throw new Error('Home Assistant configuration is not available');
        }
      }

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
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          throw new Error('Home Assistant configuration is not available');
        }
      }

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
