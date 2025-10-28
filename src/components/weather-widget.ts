import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WeatherEntity } from '../intergrations/home-assistant/home-assistant.types';
import { weatherService } from "../state";

@customElement('weather-widget')
export class WeatherWidget extends LitElement {
    public static styles = css`
        .temp {
            font-size: 4rem;
            font-weight: bold;
            color: #fff;

            small {
                font-size: 0.6em;
                color: rgba(255, 255, 255, 0.6);
            }
        }
    `;
    @state() private _weatherData: WeatherEntity | null = null;

    public connectedCallback() {
        super.connectedCallback();

        weatherService.weatherData$.subscribe(weather => {
            this._weatherData = weather;
        });
    }

    public disconnectedCallback() {
        super.disconnectedCallback();
    }


    public render() {
        if (!this._weatherData) {
            return html`
                <div class="temp">--°C</div>`;
        }

        const {state, attributes} = this._weatherData;

        return html`
            <div class="weather-widget" @click=${() => open('weather://stafford', '_blank')}>
                <div class="weather-condition">${state}</div>
                <div class="temp">${attributes.temperature}<small>°C</small></div>
            </div>
        `;
    }
}
