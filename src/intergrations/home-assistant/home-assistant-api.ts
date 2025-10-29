import { callService, Connection, createConnection, subscribeEntities } from 'home-assistant-js-websocket';
import { CalendarEntity, HomeAssistantConfig, MediaPlayerEntity, SpotcastStartOptions, TimerEntity } from './home-assistant.types';
import { createLongLivedTokenAuth } from "home-assistant-js-websocket";
import { BehaviorSubject, map, Observable } from 'rxjs';

export class HomeAssistantApi {
    private _config: HomeAssistantConfig;
    private _connection: Connection | null = null;
    private _entities: Record<string, any> = {};
    private _entityListeners: Map<string, Set<(entity: any) => void>> = new Map();
    private _connectionPromise: Promise<Connection> | null = null;

    private _entitiesSubject: BehaviorSubject<Record<string, any>> = new BehaviorSubject<Record<string, any>>({});
    private _entitySubjects: Map<string, BehaviorSubject<any>> = new Map();

    constructor(config: HomeAssistantConfig) {
        this._config = config;
    }

    public async initialize(): Promise<void> {
        await this.connect();
        subscribeEntities(this._connection!, (entities) => {
            this._entities = entities;
            this._entitiesSubject.next(entities);

            console.log(entities);
            for (const [entityId, entity] of Object.entries(entities)) {
                // Update RxJS subjects
                if (!this._entitySubjects.has(entityId)) {
                    this._entitySubjects.set(entityId, new BehaviorSubject(entity));
                } else {
                    this._entitySubjects.get(entityId)!.next(entity);
                }

                // Legacy callback support
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

    /**
     * Returns an Observable that emits all entities
     */
    public entities$(): Observable<Record<string, any>> {
        return this._entitiesSubject.asObservable();
    }

    /**
     * Returns an Observable that emits a specific entity
     */
    public entity$<T>(entityId: string): Observable<T> {
        // Create the subject if it doesn't exist
        if (!this._entitySubjects.has(entityId)) {
            this._entitySubjects.set(entityId, new BehaviorSubject<any>(this._entities[entityId] || null));
        }

        return this._entitySubjects.get(entityId)!.asObservable() as Observable<T>;
    }

    /**
     * Legacy method for subscribing to an entity with a callback
     * @deprecated Use entity$() instead
     */
    public subscribeEntity<T>(entityId: string, callback: (entity: T) => void): () => void {
        if (!this._entityListeners.has(entityId)) {
            this._entityListeners.set(entityId, new Set());
        }

        const listeners = this._entityListeners.get(entityId)!;
        listeners.add(callback as any);

        if (this._entities[entityId]) {
            callback(this._entities[entityId] as T);
        }

        // Use the Observable internally for consistency
        const subscription = this.entity$<T>(entityId).subscribe(callback);

        return () => {
            subscription.unsubscribe();
            const listeners = this._entityListeners.get(entityId);
            if (listeners) {
                listeners.delete(callback as any);
                if (listeners.size === 0) {
                    this._entityListeners.delete(entityId);
                }
            }
        };
    }

    /**
     * Returns an Observable that emits calendar entities
     */
    public calendarEvents$(): Observable<CalendarEntity[]> {
        return this.entities$().pipe(
            map(entities => {
                const calendarEntities: CalendarEntity[] = [];
                for (const [entityId, entity] of Object.entries(entities)) {
                    if (entityId.startsWith('calendar.')) {
                        calendarEntities.push(entity as CalendarEntity);
                    }
                }
                return calendarEntities;
            })
        );
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

    /**
     * Returns an Observable that emits media player entity updates
     */
    public mediaPlayer$(entityId: string = 'media_player.spotify'): Observable<MediaPlayerEntity> {
        return this.entity$<MediaPlayerEntity>(entityId);
    }

    public async getMediaPlayerStatus(entityId: string = 'media_player.spotify'): Promise<MediaPlayerEntity | null> {
        await this.connect();
        return this._entities[entityId] as MediaPlayerEntity || null;
    }

    /**
     * Legacy method for subscribing to media player updates with a callback
     * @deprecated Use mediaPlayer$() instead
     */
    public subscribeMediaPlayer(callback: (mediaPlayer: MediaPlayerEntity) => void, entityId: string = 'media_player.spotify'): () => void {
        return this.subscribeEntity<MediaPlayerEntity>(entityId, callback);
    }

    /**
     * Returns an Observable that emits TV entity updates
     */
    public tv$(entityId: string = 'media_player.tv'): Observable<MediaPlayerEntity> {
        return this.entity$<MediaPlayerEntity>(entityId);
    }

    public async getTVStatus(entityId: string = 'media_player.tv'): Promise<MediaPlayerEntity | null> {
        await this.connect();
        return this._entities[entityId] as MediaPlayerEntity || null;
    }

    /**
     * Legacy method for subscribing to TV updates with a callback
     * @deprecated Use tv$() instead
     */
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

    public async mediaPlayerCommand(
        entityId: string,
        command: 'play' | 'pause' | 'next' | 'previous' | 'volume_up' | 'volume_down' | 'volume_mute'
    ): Promise<void> {
        const connection = await this.connect();
        const domain = 'media_player';
        const serviceMap: Record<string, string> = {
            play: 'media_play',
            pause: 'media_pause',
            next: 'media_next_track',
            previous: 'media_previous_track'
        };
        const service = serviceMap[command] ?? command;
        const payload: Record<string, unknown> = {
            entity_id: entityId
        };

        if (command === 'volume_mute') {
            payload.is_volume_muted = true;
        }

        await callService(connection, domain, service, payload);
    }

    public getBaseUrl(): string {
        return this._config.url;
    }

    public getAccessToken(): string {
        return this._config.accessToken;
    }

    public async startSpotcast(options: SpotcastStartOptions): Promise<void> {
        const connection = await this.connect();
        await callService(connection, 'spotcast', 'start', options);
    }

    public async setMediaPlayerShuffle(entityId: string, shuffle: boolean): Promise<void> {
        const connection = await this.connect();
        await callService(connection, 'media_player', 'shuffle_set', {
            entity_id: entityId,
            shuffle
        });
    }

    public async setMediaPlayerVolume(entityId: string, volumeLevel: number): Promise<void> {
        const connection = await this.connect();
        await callService(connection, 'media_player', 'volume_set', {
            entity_id: entityId,
            volume_level: volumeLevel
        });
    }

    public timers$(): Observable<TimerEntity[]> {
        return this.entities$().pipe(
            map((entities) => Object.entries(entities)
                .filter(([entityId]) => entityId.startsWith('timer.'))
                .map(([entityId, entity]) => ({
                    ...(entity as TimerEntity),
                    entity_id: entityId
                })))
        );
    }

    public async controlTimer(
        entityId: string,
        command: 'start' | 'pause' | 'cancel' | 'finish',
        payload: Record<string, unknown> = {}
    ): Promise<void> {
        const connection = await this.connect();
        await callService(connection, 'timer', command, {
            entity_id: entityId,
            ...payload
        });
    }

}
