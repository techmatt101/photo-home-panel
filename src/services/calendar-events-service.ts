import { CalendarEntity } from '../intergrations/home-assistant/home-assistant.types';
import { HomeAssistantApi } from "../intergrations/home-assistant/home-assistant-api";
import { firstValueFrom } from "rxjs";

export class CalendarEventsService {
    private _calendarEvents: CalendarEntity[] = [];
    private _eventsSubscribers: ((events: CalendarEntity[]) => void)[] = [];
    private _homeAssistantApi: HomeAssistantApi;

    constructor(homeAssistantApi: HomeAssistantApi) {
        this._homeAssistantApi = homeAssistantApi;
    }

    public async initialize(): Promise<void> {
        await this.loadCalendarEvents();
    }

    public getAllEvents(): CalendarEntity[] {
        return this._calendarEvents;
    }

    public getUpcomingEvents(): CalendarEntity[] {
        if (this._calendarEvents.length === 0) {
            return [];
        }

        // Sort events by start time
        const sortedEvents = [...this._calendarEvents].sort((a, b) => {
            return new Date(a.attributes.start_time).getTime() - new Date(b.attributes.start_time).getTime();
        });

        // Only show events for today and tomorrow
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        return sortedEvents.filter(event => {
            const eventEnd = new Date(event.attributes.end_time);
            return eventEnd >= now && eventEnd <= tomorrow;
        });
    }

    public hasUpcomingEvents(): boolean {
        return this.getUpcomingEvents().length > 0;
    }

    public formatEventTime(dateString: string, locale: string = 'en-GB'): string {
        const date = new Date(dateString);
        return date.toLocaleTimeString(locale, {hour: '2-digit', minute: '2-digit'});
    }

    public subscribeEvents(callback: (events: CalendarEntity[]) => void): void {
        this._eventsSubscribers.push(callback);

        // Immediately notify with current data if available
        if (this._calendarEvents.length > 0) {
            callback(this.getUpcomingEvents());
        }
    }

    public unsubscribeEvents(callback: (events: CalendarEntity[]) => void): void {
        this._eventsSubscribers = this._eventsSubscribers.filter(cb => cb !== callback);
    }

    public dispose(): void {
        this._eventsSubscribers = [];
    }

    private async loadCalendarEvents(): Promise<void> {
        try {
            const entities = await firstValueFrom(this._homeAssistantApi.entities$());

            const calendarEntities: CalendarEntity[] = [];
            for (const [entityId, entity] of Object.entries(entities)) {
                if (entityId.startsWith('calendar.')) {
                    calendarEntities.push(entity as CalendarEntity);
                }
            }

            this._calendarEvents = calendarEntities;
            // Notify all subscribers
            this.notifySubscribers();
        } catch (error) {
            console.error('Error loading calendar events:', error);
        }
    }

    private notifySubscribers(): void {
        const upcomingEvents = this.getUpcomingEvents();
        for (const callback of this._eventsSubscribers) {
            callback(upcomingEvents);
        }
    }
}