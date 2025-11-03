import { callService, Connection, createConnection, createLongLivedTokenAuth, HassServiceTarget, subscribeEntities } from 'home-assistant-js-websocket';
import { HomeAssistantConfig } from './home-assistant.types';
import { BehaviorSubject, Observable } from 'rxjs';

export class HomeAssistantApi {
    private _config: HomeAssistantConfig;
    private _connection: Connection | null = null;
    private _connectionPromise: Promise<Connection> | null = null;
    private _entities: Record<string, any> = {};

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
            }
        });
    }

    public async connect(): Promise<Connection> {
        if (this._connectionPromise) {
            return this._connectionPromise;
        }

        this._connectionPromise = (async () => {
            const auth = createLongLivedTokenAuth(
                this._config.url,
                this._config.accessToken
            );

            this._connection = await createConnection({auth});

            return this._connection;
        })();

        return this._connectionPromise;
    }

    public entities$(): Observable<Record<string, any>> {
        return this._entitiesSubject.asObservable();
    }

    public entity$<T>(entityId: string): Observable<T> {
        if (!this._entitySubjects.has(entityId)) {
            this._entitySubjects.set(entityId, new BehaviorSubject<any>(this._entities[entityId] || null));
        }

        return this._entitySubjects.get(entityId)!.asObservable() as Observable<T>;
    }

    public getBaseUrl(): string {
        return this._config.url;
    }

    public getAccessToken(): string {
        return this._config.accessToken;
    }

    public async callService(domain: string, service: string, serviceData?: object, target?: HassServiceTarget): Promise<void> {
        const connection = await this.connect();
        await callService(connection, domain, service, serviceData, target);
    }
}
