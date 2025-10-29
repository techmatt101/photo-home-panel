import { combineLatest, interval, map, Observable, shareReplay, startWith } from 'rxjs';
import { TimerEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from '../intergrations/home-assistant/home-assistant-api';

const DEFAULT_KITCHEN_TIMER_MATCHERS = ['kitchen', 'google'];

export interface TimerViewModel {
    id: string;
    entityId: string;
    name: string;
    state: 'idle' | 'active' | 'paused';
    remainingSeconds: number;
    durationSeconds: number;
    finishesAt: string | null;
}

export class TimerService {
    public readonly timers$: Observable<TimerViewModel[]>;
    private _homeAssistantApi: HomeAssistantApi;
    private _matchers: string[];

    constructor(homeAssistantApi: HomeAssistantApi, matchers: string[] = DEFAULT_KITCHEN_TIMER_MATCHERS) {
        this._homeAssistantApi = homeAssistantApi;
        this._matchers = matchers.map((matcher) => matcher.toLowerCase());

        this.timers$ = combineLatest([
            this._homeAssistantApi.timers$().pipe(startWith([] as TimerEntity[])),
            interval(1000).pipe(startWith(0))
        ]).pipe(
            map(([timers]) => this._mapToViewModels(timers)),
            shareReplay({bufferSize: 1, refCount: true})
        );
    }

    public async startTimer(entityId: string, durationSeconds?: number): Promise<void> {
        const payload = durationSeconds != null ? {duration: this._formatDuration(durationSeconds)} : {};
        await this._homeAssistantApi.controlTimer(entityId, 'start', payload);
    }

    public async pauseTimer(entityId: string): Promise<void> {
        await this._homeAssistantApi.controlTimer(entityId, 'pause');
    }

    public async cancelTimer(entityId: string): Promise<void> {
        await this._homeAssistantApi.controlTimer(entityId, 'cancel');
    }

    public async finishTimer(entityId: string): Promise<void> {
        await this._homeAssistantApi.controlTimer(entityId, 'finish');
    }

    private _mapToViewModels(entities: TimerEntity[]): TimerViewModel[] {
        return entities
            .filter((timer) => this._isKitchenTimer(timer))
            .map((timer) => {
                const remainingSeconds = this._calculateRemaining(timer);
                return {
                    entityId: timer.entity_id as string,
                    id: this._timerId(timer),
                    name: timer.attributes.friendly_name ?? this._timerId(timer),
                    state: timer.state as TimerViewModel['state'],
                    remainingSeconds,
                    durationSeconds: this._parseDuration(timer.attributes.duration),
                    finishesAt: timer.attributes.finishes_at ?? null
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    private _timerId(timer: TimerEntity): string {
        const match = timer.attributes.friendly_name;
        if (match) {
            return match;
        }
        return timer.entity_id ?? 'timer';
    }

    private _isKitchenTimer(timer: TimerEntity): boolean {
        const name = timer.attributes.friendly_name?.toLowerCase() || '';
        const entityId = (timer.entity_id ?? '').toLowerCase();
        return this._matchers.some((matcher) => name.includes(matcher) || entityId.includes(matcher));
    }

    private _calculateRemaining(timer: TimerEntity): number {
        if (timer.state === 'active' && timer.attributes.finishes_at) {
            const finishes = new Date(timer.attributes.finishes_at).getTime();
            const now = Date.now();
            return Math.max(0, Math.round((finishes - now) / 1000));
        }

        const remaining = this._parseDuration(timer.attributes.remaining);
        return Math.max(0, remaining);
    }

    private _parseDuration(duration?: string): number {
        if (!duration) {
            return 0;
        }

        const parts = duration.split(':').map((value) => Number(value));
        if (parts.length === 3) {
            const [hours, minutes, seconds] = parts;
            return hours * 3600 + minutes * 60 + seconds;
        }
        if (parts.length === 2) {
            const [minutes, seconds] = parts;
            return minutes * 60 + seconds;
        }
        return Number(parts[0]) || 0;
    }

    private _formatDuration(durationSeconds: number): string {
        const clamped = Math.max(0, Math.round(durationSeconds));
        const hours = Math.floor(clamped / 3600);
        const minutes = Math.floor((clamped % 3600) / 60);
        const seconds = clamped % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
    }
}
