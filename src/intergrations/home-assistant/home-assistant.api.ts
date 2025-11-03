import { callService, Connection, createConnection, createLongLivedTokenAuth, HassServiceTarget, subscribeEntities } from 'home-assistant-js-websocket';
import { HomeAssistantConfig } from './home-assistant.types';
import { BehaviorSubject, Observable } from 'rxjs';

export class HomeAssistantApi {
    private _config: HomeAssistantConfig;
    private _connection: Connection | null = null;
    private _entities: Record<string, any> = {};

    private _entitiesSubject: BehaviorSubject<Record<string, any>> = new BehaviorSubject<Record<string, any>>({});
    private _entitySubjects: Map<string, BehaviorSubject<any>> = new Map();

    constructor(config: HomeAssistantConfig) {
        this._config = config;
    }

    public async initialize(): Promise<void> {
        const auth = createLongLivedTokenAuth(
            this._config.url,
            this._config.accessToken
        );

        this._connection = await createConnection({auth});

        subscribeEntities(this._connection!, (entities) => {
            this._entities = entities;
            this._entitiesSubject.next(entities);

            console.log(entities);
            for (const [entityId, entity] of Object.entries(entities)) {
                if (!this._entitySubjects.has(entityId)) {
                    this._entitySubjects.set(entityId, new BehaviorSubject(entity));
                } else {
                    this._entitySubjects.get(entityId)!.next(entity);
                }
            }
        });
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
        await callService(this._connection!, domain, service, serviceData, target);
    }

    public async disconnect(): Promise<void> {
        if (this._connection) {
            this._connection.close();
            this._connection = null;
        }
    }
}
