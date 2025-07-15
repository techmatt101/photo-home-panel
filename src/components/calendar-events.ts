import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { CalendarEntity } from '../intergrations/home-assistant/home-assistant.types';
import { calendarEventsService } from "../state";

@customElement('calendar-events')
export class CalendarEvents extends LitElement {

    public static styles = css`
        :host {
            display: block;
            color: var(--primary-color, #ffffff);
        }

        .calendar-events {
            margin-bottom: 20px;
        }

        .calendar-events h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 1.2rem;
            border-bottom: 1px solid var(--secondary-color, rgba(255, 255, 255, 0.8));
            padding-bottom: 5px;
        }

        .calendar-events ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .calendar-events li {
            margin-bottom: 10px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
        }

        .event-time {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .event-title {
            font-size: 0.9rem;
        }
    `;
    @state() private _upcomingEvents: CalendarEntity[] = [];

    public connectedCallback() {
        super.connectedCallback();
        this.initializeCalendarEvents();
    }

    public disconnectedCallback() {
        super.disconnectedCallback();

        // Clean up service
        calendarEventsService.dispose();
    }

    public render() {
        if (this._upcomingEvents.length === 0) {
            this.dispatchEvent(new CustomEvent('has-events', {detail: {hasEvents: false}}));
            return null;
        }

        this.dispatchEvent(new CustomEvent('has-events', {detail: {hasEvents: true}}));

        return html`
            <div class="calendar-events">
                <h3>Upcoming Events</h3>
                <ul>
                    ${this._upcomingEvents.map(event => {
                        return html`
                            <li>
                                <div class="event-time">${calendarEventsService.formatEventTime(event.attributes.start_time)}</div>
                                <div class="event-title">${event.attributes.friendly_name}</div>
                            </li>
                        `;
                    })}
                </ul>
            </div>
        `;
    }

    private async initializeCalendarEvents() {
        try {
            await calendarEventsService.initialize();

            calendarEventsService.subscribeEvents((events) => {
                this._upcomingEvents = events;
                this.requestUpdate();
            });
        } catch (error) {
            console.error('Error initializing calendar events service:', error);
        }
    }
}
