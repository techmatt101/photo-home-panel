import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WeatherEntity } from '../intergrations/home-assistant/home-assistant.types';
import { weatherService } from "../state";
import { minuteSync } from "../services/time-service";

@customElement('time-weather')
export class TimeWeather extends LitElement {
    public static styles = css`
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
    @state() private _weatherData: WeatherEntity | null = null;
    @state() private _currentTime: Date = new Date();

    private _dateTimeFormater = new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'short',
        timeStyle: 'short'
    });

    private _time$ = minuteSync()

    public connectedCallback() {
        super.connectedCallback();

        this._time$.subscribe(time => {
            this._currentTime = time;
        });

        weatherService.weatherData$.subscribe(weather => {
            this._weatherData = weather;
        });
    }

    public disconnectedCallback() {
        super.disconnectedCallback();

    }


    public render() {
        return html`
            <div class="current-time">
                ${this._dateTimeFormater.format(this._currentTime)}
            </div>

            ${this.renderWeather()}
        `;
    }

    private renderWeather() {
        if (!this._weatherData) {
            return html`
                <div class="weather-temp">--°C</div>`;
        }

        const {state, attributes} = this._weatherData;

        return html`
            <div class="weather-widget" @click=${() => open('weather://stafford', '_blank')}>
                <div class="weather-condition">${state}</div>
                <div class="weather-temp">${attributes.temperature}°C</div>
            </div>
        `;
    }
}
