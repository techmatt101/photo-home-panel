import { callService, Connection, createConnection, subscribeEntities } from 'home-assistant-js-websocket';
import { CalendarEntity, HomeAssistantConfig, MediaPlayerEntity, WeatherEntity } from './home-assistant.types';
import { createLongLivedTokenAuth } from "home-assistant-js-websocket/dist/auth";

export class HomeAssistantApi {
    private _config: HomeAssistantConfig;
    private _connection: Connection | null = null;
    private _entities: Record<string, any> = {};
    private _entityListeners: Map<string, Set<(entity: any) => void>> = new Map();
    private _connectionPromise: Promise<Connection> | null = null;

    constructor(config: HomeAssistantConfig) {
        this._config = config;
    }

    public async initialize(): Promise<void> {
        await this.connect();
        subscribeEntities(this._connection!, (entities) => {
            this._entities = entities;

            for (const [entityId, entity] of Object.entries(entities)) {
                const listeners = this._entityListeners.get(entityId);
                if (listeners) {
                    for (const listener of listeners) {
                        listener(entity);
                    }
                }
            }
        });
    }

    public async connect(): Promise<Connection> {
        if (this._connectionPromise) {
            return this._connectionPromise;
        }

        this._connectionPromise = (async () => {
            const auth = await createLongLivedTokenAuth(
                this._config.url,
                this._config.accessToken
            );

            this._connection = await createConnection({auth});

            return this._connection;
        })();

        return this._connectionPromise;
    }

    public subscribeEntity<T>(entityId: string, callback: (entity: T) => void): () => void {
        if (!this._entityListeners.has(entityId)) {
            this._entityListeners.set(entityId, new Set());
        }

        const listeners = this._entityListeners.get(entityId)!;
        listeners.add(callback as any);

        if (this._entities[entityId]) {
            callback(this._entities[entityId] as T);
        }

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