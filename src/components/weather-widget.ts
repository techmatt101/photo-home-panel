import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WeatherEntity } from '../intergrations/home-assistant/home-assistant.types';
import { weatherService } from "../state";
import { DEFAULT_WEATHER_ICON, getWeatherIcon } from '../icons/weather-icons';

@customElement('weather-widget')
export class WeatherWidget extends LitElement {
    public static styles = css`
        :host {
            display: block;
        }

        .temp {
            font-size: 3rem;
            font-weight: bold;
            color: #fff;
            text-align: center;

            small {
                font-size: 0.6em;
                color: rgba(255, 255, 255, 0.6);
                font-weight: normal;
            }
        }

        .icon {
            width: 154px;
            height: 154px;
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
                <div class="container">
                    <img class="icon" src=${DEFAULT_WEATHER_ICON} alt="Weather condition"/>
                    <div class="temp">--<small>°C</small></div>
                </div>
            `;
        }

        const { state, attributes } = this._weatherData;
        const iconSrc = getWeatherIcon(state);

        return html`
            <div class="container" @click=${() => open('weather://stafford', '_blank')}>
                <img class="icon" src=${iconSrc} alt="Weather condition"/>
                <div class="temp">${attributes.temperature}<small>°C</small></div>
            </div>
        `;
    }
}
