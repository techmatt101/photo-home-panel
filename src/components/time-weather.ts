import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {WeatherEntity} from '../types/home-assistant.types';
import weatherService from '../services/weather-service';
import timeService from '../services/time-service';

@customElement('time-weather')
export class TimeWeather extends LitElement {
    static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color, #ffffff);
    }

    .current-time {
      font-size: 1.5rem;
      font-weight: bold;
      text-align: center;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      margin: 0 20px;
    }

    /* Weather widget */
    .weather-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      margin-left: 20px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      transition: transform 0.2s ease;
    }

    .weather-widget:hover {
      transform: scale(1.05);
    }

    .weather-condition {
      font-size: 0.9rem;
      margin-bottom: 5px;
      text-transform: capitalize;
    }

    .weather-temp {
      font-size: 1.2rem;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .current-time {
        margin: 10px 0;
      }

      .weather-widget {
        margin-left: 0;
        flex-direction: row;
        gap: 10px;
      }
    }

    @media (max-width: 480px) {
      .current-time {
        font-size: 1.2rem;
      }

      .weather-temp {
        font-size: 1rem;
      }
    }
  `;
    @property({type: Boolean}) showWeather: boolean = true;
    @property({type: Boolean}) showTime: boolean = true;
    @state() private weatherData: WeatherEntity | null = null;
    @state() private currentTime: Date = new Date();

    connectedCallback() {
        super.connectedCallback();

        // Initialize time service
        if (this.showTime) {
            timeService.initialize();
            timeService.subscribeTime((time) => {
                this.currentTime = time;
                this.requestUpdate();
            });
        }

        // Initialize weather service
        if (this.showWeather) {
            this.initializeWeather();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        // Clean up services
        timeService.dispose();
        weatherService.dispose();
    }

    render() {
        return html`
      ${this.showTime ? html`
        <div class="current-time">
          ${timeService.formatDate(this.currentTime)}
        </div>
      ` : ''}

      ${this.showWeather ? this.renderWeather() : ''}
    `;
    }

    private async initializeWeather() {
        try {
            // Initialize the weather service
            const initialized = await weatherService.initialize();

            if (initialized) {
                // Subscribe to weather updates
                weatherService.subscribeWeather((weather) => {
                    this.weatherData = weather;
                    this.requestUpdate();
                });
            } else {
                console.error('Failed to initialize weather service');
            }
        } catch (error) {
            console.error('Error initializing weather service:', error);
        }
    }

    // Render weather widget
    private renderWeather() {
        if (!this.weatherData) {
            return html`<div class="weather-temp">--°C</div>`;
        }

        const {state, attributes} = this.weatherData;

        return html`
      <div class="weather-widget" @click=${() => window.open('weather://stafford', '_blank')}>
        <div class="weather-condition">${state}</div>
        <div class="weather-temp">${attributes.temperature}°C</div>
      </div>
    `;
    }
}
