import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { WeatherEntity } from '../intergrations/home-assistant/home-assistant.types';
import { weatherService } from "../state";

const icon = (name: string) => new URL(`../assets/weather/${name}.svg`, import.meta.url).href;

const WEATHER_ICON_MAP: Record<string, string> = {
    'clear-night': icon('clear-night'),
    'cloudy': icon('cloudy'),
    'fog': icon('fog'),
    'hail': icon('hail'),
    'lightning': icon('lightning'),
    'lightning-rainy': icon('lightning-rainy'),
    'partlycloudy': icon('partlycloudy'),
    'pouring': icon('pouring'),
    'rainy': icon('rainy'),
    'snowy': icon('snowy'),
    'snowy-rainy': icon('snowy-rainy'),
    'sunny': icon('sunny'),
    'windy': icon('windy'),
    'windy-variant': icon('windy-variant')
};

@customElement('weather-widget')
export class WeatherWidget extends LitElement {
    public static styles = css`
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
                    <img class="icon"/>
                    <div class="temp">--<small>°C</small></div>
                </div>
            `;
        }

        const { state, attributes } = this._weatherData;
        const iconSrc = this._getIconForState(state);

        return html`
            <div class="container" @click=${() => open('weather://stafford', '_blank')}>
                <img class="icon" src=${iconSrc}/>
                <div class="temp">${attributes.temperature}<small>°C</small></div>
            </div>
        `;
    }

    private _getIconForState(condition: string | null | undefined): string {
        if (!condition) {
            return '';
        }

        const normalized = condition.trim().toLowerCase().replace(/[\s_]+/g, '-');
        return WEATHER_ICON_MAP[normalized] ?? '';
    }
}
