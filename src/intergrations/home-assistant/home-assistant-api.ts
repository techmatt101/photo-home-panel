import { Auth, AuthData, callService, Connection, createConnection, ERR_HASS_HOST_REQUIRED, getAuth, subscribeEntities } from 'home-assistant-js-websocket';
import { CalendarEntity, HomeAssistantConfig, MediaPlayerEntity, WeatherEntity } from './home-assistant.types';

export class HomeAssistantApi {
    private _config: HomeAssistantConfig | null = null;
    private _connection: Connection | null = null;
    private _entities: Record<string, any> = {};
    private _entityListeners: Map<string, Set<(entity: any) => void>> = new Map();
    private _connectionPromise: Promise<Connection> | null = null;

    constructor(config: HomeAssistantConfig) {
        this._config = config;
    }

    public async initialize(): Promise<void> {
        await this.connect();
    }

    public async connect(): Promise<Connection> {
        if (this._connection) {
            return this._connection;
        }

        if (this._connectionPromise) {
            return this._connectionPromise;
        }

        if (!this._config) {
            throw new Error('Home Assistant configuration is not available');
        }

        this._connectionPromise = (async () => {
            try {
                // Try to load saved auth
                let auth: Auth;

                // Create a local copy of config to ensure it's not null within this scope
                // We've already checked this.config is not null above, so we can safely assert it's non-null
                const config = this._config!;

                if (config.accessToken) {
                    // Use long-lived access token if provided
                    auth = await getAuth({
                        hassUrl: config.url,
                        saveTokens: () => {
                            // No need to save tokens when using access token
                        },
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
                    // This is a simplified version that doesn't persist tokens
                    // In a real implementation, you might want to pass token handlers via constructor
                    auth = await getAuth({
                        hassUrl: config.url,
                        saveTokens: (_tokens: AuthData | null) => {
                            // Token saving would be handled externally
                            console.log('Home Assistant tokens updated');
                        },
                        loadTokens: async () => {
                            // Return empty tokens to force new authentication
                            return null;
                        }
                    });
                }

                // Create connection
                this._connection = await createConnection({auth});

                // Subscribe to entities
                subscribeEntities(this._connection, (entities) => {
                    this._entities = entities;

                    // Notify entity listeners
                    for (const [entityId, entity] of Object.entries(entities)) {
                        const listeners = this._entityListeners.get(entityId);
                        if (listeners) {
                            for (const listener of listeners) {
                                listener(entity);
                            }
                        }
                    }
                });

                return this._connection;
            } catch (err) {
                if (err === ERR_HASS_HOST_REQUIRED) {
                    throw new Error('Home Assistant URL is required');
                } else {
                    throw err;
                }
            } finally {
                this._connectionPromise = null;
            }
        })();

        return this._connectionPromise;
    }

    public subscribeEntity<T>(entityId: string, callback: (entity: T) => void): () => void {
        if (!this._entityListeners.has(entityId)) {
            this._entityListeners.set(entityId, new Set());
        }

        const listeners = this._entityListeners.get(entityId)!;
        listeners.add(callback as any);

        // If we already have data for this entity, call the callback immediately
        if (this._entities[entityId]) {
            callback(this._entities[entityId] as T);
        }

        // Return unsubscribe function
        return () => {
            const listeners = this._entityListeners.get(entityId);
            if (listeners) {
                listeners.delete(callback as any);
                if (listeners.size === 0) {
                    this._entityListeners.delete(entityId);
                }
            }
        };
    }

    public async getWeather(entityId: string = 'weather.home'): Promise<WeatherEntity | null> {
        await this.connect();
        return this._entities[entityId] as WeatherEntity || null;
    }

    public subscribeWeather(callback: (weather: WeatherEntity) => void, entityId: string = 'weather.home'): () => void {
        return this.subscribeEntity<WeatherEntity>(entityId, callback);
    }

    public async getCalendarEvents(): Promise<CalendarEntity[]> {
        await this.connect();

        const calendarEntities: CalendarEntity[] = [];
        for (const [entityId, entity] of Object.entries(this._entities)) {
            if (entityId.startsWith('calendar.')) {
                calendarEntities.push(entity as CalendarEntity);
            }
        }

        return calendarEntities;
    }

    public async getMediaPlayerStatus(entityId: string = 'media_player.spotify'): Promise<MediaPlayerEntity | null> {
        await this.connect();
        return this._entities[entityId] as MediaPlayerEntity || null;
    }

    public subscribeMediaPlayer(callback: (mediaPlayer: MediaPlayerEntity) => void, entityId: string = 'media_player.spotify'): () => void {
        return this.subscribeEntity<MediaPlayerEntity>(entityId, callback);
    }

    public async getTVStatus(entityId: string = 'media_player.tv'): Promise<MediaPlayerEntity | null> {
        await this.connect();
        return this._entities[entityId] as MediaPlayerEntity || null;
    }

    public subscribeTV(callback: (tv: MediaPlayerEntity) => void, entityId: string = 'media_player.tv'): () => void {
        return this.subscribeEntity<MediaPlayerEntity>(entityId, callback);
    }

    public async toggleLight(entityId: string): Promise<void> {
        const connection = await this.connect();
        const domain = 'light';
        const service = 'toggle';

        await callService(connection, domain, service, {entity_id: entityId});
    }

    public async startVacuum(entityId: string = 'vacuum.cleaner'): Promise<void> {
        const connection = await this.connect();
        const domain = 'vacuum';
        const service = 'start';

        await callService(connection, domain, service, {entity_id: entityId});
    }

    public async mediaPlayerCommand(entityId: string, command: 'play' | 'pause' | 'next' | 'previous' | 'volume_up' | 'volume_down' | 'volume_mute'): Promise<void> {
        const connection = await this.connect();
        const domain = 'media_player';
        await callService(connection, domain, command, {entity_id: entityId});
    }

}