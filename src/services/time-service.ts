export class TimeService {
    private _timeSubscribers: ((currentTime: Date) => void)[] = [];
    private _updateInterval: number | null = null;
    private _updateFrequency: number = 60000; // Default: update every minute

    // Initialize the time service
    initialize(updateFrequency: number = 60000): void {
        this._updateFrequency = updateFrequency;
        this.startTimeUpdates();
    }

    // Format date according to locale and options
    formatDate(date: Date, locale: string = 'en-GB', options: Intl.DateTimeFormatOptions = {}): string {
        // Default options for date formatting
        const defaultOptions: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        };

        // Merge default options with provided options
        const mergedOptions = {...defaultOptions, ...options};

        return new Intl.DateTimeFormat(locale, mergedOptions).format(date);
    }

    // Subscribe to time updates
    subscribeTime(callback: (currentTime: Date) => void): void {
        this._timeSubscribers.push(callback);

        // Immediately notify with current time
        callback(new Date());
    }

    // Unsubscribe from time updates
    unsubscribeTime(callback: (currentTime: Date) => void): void {
        this._timeSubscribers = this._timeSubscribers.filter(cb => cb !== callback);
    }

    // Clean up resources
    dispose(): void {
        this.stopTimeUpdates();
        this._timeSubscribers = [];
    }

    // Start time updates
    private startTimeUpdates(): void {
        // Clear any existing interval
        this.stopTimeUpdates();

        // Update immediately
        this.updateTime();

        // Set interval for future updates
        this._updateInterval = window.setInterval(() => {
            this.updateTime();
        }, this._updateFrequency);
    }

    // Stop time updates
    private stopTimeUpdates(): void {
        if (this._updateInterval) {
            window.clearInterval(this._updateInterval);
            this._updateInterval = null;
        }
    }

    // Update time and notify subscribers
    private updateTime(): void {
        const currentTime = new Date();
        this.notifySubscribers(currentTime);
    }

    // Notify all subscribers of time updates
    private notifySubscribers(currentTime: Date): void {
        for (const callback of this._timeSubscribers) {
            callback(currentTime);
        }
    }
}