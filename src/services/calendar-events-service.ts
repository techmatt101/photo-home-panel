import homeAssistantService from './home-assistant-service';
import { CalendarEntity } from '../types/home-assistant.types';

class CalendarEventsService {
  private calendarEvents: CalendarEntity[] = [];
  private eventsSubscribers: ((events: CalendarEntity[]) => void)[] = [];

  // Initialize the calendar events service
  async initialize(): Promise<boolean> {
    try {
      // Initialize the Home Assistant service
      const initialized = await homeAssistantService.initialize();

      if (initialized) {
        // Get calendar events
        await this.loadCalendarEvents();
        return true;
      } else {
        console.error('Failed to initialize Home Assistant service for calendar events');
        return false;
      }
    } catch (error) {
      console.error('Error initializing calendar events service:', error);
      return false;
    }
  }

  // Load calendar events from Home Assistant
  private async loadCalendarEvents(): Promise<void> {
    try {
      this.calendarEvents = await homeAssistantService.getCalendarEvents();
      // Notify all subscribers
      this.notifySubscribers();
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  }

  // Get all calendar events
  getAllEvents(): CalendarEntity[] {
    return this.calendarEvents;
  }

  // Get upcoming events (today and tomorrow)
  getUpcomingEvents(): CalendarEntity[] {
    if (this.calendarEvents.length === 0) {
      return [];
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

    return sortedEvents.filter(event => {
      const eventEnd = new Date(event.attributes.end_time);
      return eventEnd >= now && eventEnd <= tomorrow;
    });
  }

  // Check if there are upcoming events
  hasUpcomingEvents(): boolean {
    return this.getUpcomingEvents().length > 0;
  }

  // Format event time
  formatEventTime(dateString: string, locale: string = 'en-GB'): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  // Subscribe to calendar events updates
  subscribeEvents(callback: (events: CalendarEntity[]) => void): void {
    this.eventsSubscribers.push(callback);
    
    // Immediately notify with current data if available
    if (this.calendarEvents.length > 0) {
      callback(this.getUpcomingEvents());
    }
  }

  // Unsubscribe from calendar events updates
  unsubscribeEvents(callback: (events: CalendarEntity[]) => void): void {
    this.eventsSubscribers = this.eventsSubscribers.filter(cb => cb !== callback);
  }

  // Notify all subscribers of calendar events updates
  private notifySubscribers(): void {
    const upcomingEvents = this.getUpcomingEvents();
    for (const callback of this.eventsSubscribers) {
      callback(upcomingEvents);
    }
  }

  // Clean up resources
  dispose(): void {
    this.eventsSubscribers = [];
  }
}

// Create a singleton instance
export const calendarEventsService = new CalendarEventsService();

// Export the service
export default calendarEventsService;