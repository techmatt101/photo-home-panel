import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { CalendarEntity } from '../types/home-assistant.types';
import homeAssistantService from '../services/home-assistant-service';

@customElement('calendar-events')
export class CalendarEvents extends LitElement {
  @state() private calendarEvents: CalendarEntity[] = [];

  static styles = css`
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

  connectedCallback() {
    super.connectedCallback();
    this.loadCalendarEvents();
  }

  private async loadCalendarEvents() {
    try {
      // Initialize the Home Assistant service
      const initialized = await homeAssistantService.initialize();

      if (initialized) {
        // Get calendar events
        this.calendarEvents = await homeAssistantService.getCalendarEvents();
        this.requestUpdate();
      } else {
        console.error('Failed to initialize Home Assistant service for calendar events');
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  }

  render() {
    if (this.calendarEvents.length === 0) {
      this.dispatchEvent(new CustomEvent('has-events', { detail: { hasEvents: false } }));
      return null;
    }

    // Sort events by start time
    const sortedEvents = [...this.calendarEvents].sort((a, b) => {
      return new Date(a.attributes.start_time).getTime() - new Date(b.attributes.start_time).getTime();
    });

    // Only show events for today and tomorrow
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const upcomingEvents = sortedEvents.filter(event => {
      const eventEnd = new Date(event.attributes.end_time);
      return eventEnd >= now && eventEnd <= tomorrow;
    });

    if (upcomingEvents.length === 0) {
      this.dispatchEvent(new CustomEvent('has-events', { detail: { hasEvents: false } }));
      return null;
    }

    this.dispatchEvent(new CustomEvent('has-events', { detail: { hasEvents: true } }));

    return html`
      <div class="calendar-events">
        <h3>Upcoming Events</h3>
        <ul>
          ${upcomingEvents.map(event => {
            const startTime = new Date(event.attributes.start_time);
            return html`
              <li>
                <div class="event-time">${startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="event-title">${event.attributes.friendly_name}</div>
              </li>
            `;
          })}
        </ul>
      </div>
    `;
  }
}
