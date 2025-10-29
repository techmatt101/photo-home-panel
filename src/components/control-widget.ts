import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';

import { controlButtonsService } from "../state";
import { LightEntity, MediaPlayerEntity, VacuumEntity } from '../intergrations/home-assistant/home-assistant.types';
import { LIGHT_ICON, TV_ICON, VACUUM_ICON } from '../icons/control-icons';

@customElement('control-widget')
export class ControlWidget extends LitElement {
    public static styles = css`
        :host {
            display: block;
            color: #fff;
        }

        .widget {
            display: flex;
            align-items: center;
            gap: 2rem;
            padding: 1.5rem 2rem;
            background: rgba(12, 12, 12, 0.45);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(16px);
            min-width: 360px;
        }

        .widget-title {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
            letter-spacing: 0.18em;
            text-transform: uppercase;
        }

        .button-grid {
            display: flex;
            gap: 1rem;
        }

        .control-button {
            width: 72px;
            height: 72px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.08);
            color: inherit;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            cursor: pointer;
            transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .control-button:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.35);
            box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
        }

        .control-button:active {
            transform: scale(0.98);
        }

        .control-button__label {
            font-size: 0.65rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.7);
        }

        .control-button--active {
            background: rgba(255, 255, 255, 0.22);
            border-color: rgba(255, 255, 255, 0.5);
            box-shadow: 0 18px 46px rgba(0, 0, 0, 0.45);
        }

        .control-button--disabled {
            opacity: 0.4;
            cursor: default;
            transform: none;
            box-shadow: none;
        }

        .control-button__icon {
            width: 30px;
            height: 30px;
            filter: invert(1) sepia(0) saturate(0) hue-rotate(0deg) brightness(1.2) contrast(1.2);
        }

        @media (max-width: 1024px) {
            .widget {
                flex-direction: column;
                align-items: flex-start;
                gap: 1.25rem;
            }

            .button-grid {
                width: 100%;
                flex-wrap: wrap;
            }
        }
    `;

    @state() private _tvStatus: MediaPlayerEntity | null = null;
    @state() private _lightStatus: LightEntity | null = null;
    @state() private _vacuumStatus: VacuumEntity | null = null;

    private _subscriptions: Subscription = new Subscription();
    private readonly _lightEntityId = 'light.kitchen';

    public connectedCallback() {
        super.connectedCallback();

        this._subscriptions.add(
            controlButtonsService.tvStatus$.subscribe(status => {
                this._tvStatus = status;
            })
        );

        this._subscriptions.add(
            controlButtonsService.lightStatus$.subscribe(status => {
                this._lightStatus = status;
            })
        );

        this._subscriptions.add(
            controlButtonsService.vacuumStatus$.subscribe(status => {
                this._vacuumStatus = status;
            })
        );
    }

    public disconnectedCallback() {
        super.disconnectedCallback();
        this._subscriptions.unsubscribe();
        this._subscriptions = new Subscription();
    }

    public render() {
        const isLightOn = this._lightStatus?.state === 'on';
        const isVacuumRunning = this._vacuumStatus?.state === 'cleaning';
        const isTvActive = !!this._tvStatus && this._tvStatus.state !== 'off' && this._tvStatus.state !== 'standby';

        return html`
            <div class="widget">
                <div class="button-grid">
                    ${this._renderLightButton(isLightOn)}
                    ${this._renderVacuumButton(isVacuumRunning)}
                    ${this._renderTvButton(isTvActive)}
                </div>
            </div>
        `;
    }

    private _renderLightButton(isActive: boolean) {
        const classes = classMap({
            'control-button': true,
            'control-button--active': isActive
        });

        return html`
            <button
                class=${classes}
                aria-pressed=${isActive}
                title=${isActive ? 'Living room lights are on' : 'Living room lights are off'}
                @click=${() => this._toggleLight(this._lightEntityId)}
            >
                <img class="control-button__icon" src=${LIGHT_ICON} alt="Light" />
                <span class="control-button__label">Lights</span>
            </button>
        `;
    }

    private _renderVacuumButton(isActive: boolean) {
        const classes = classMap({
            'control-button': true,
            'control-button--active': isActive
        });

        return html`
            <button
                class=${classes}
                aria-pressed=${isActive}
                title=${isActive ? 'Vacuum is cleaning' : 'Start vacuum cleaner'}
                @click=${this._startVacuum}
            >
                <img class="control-button__icon" src=${VACUUM_ICON} alt="Vacuum" />
                <span class="control-button__label">Vacuum</span>
            </button>
        `;
    }

    private _renderTvButton(isActive: boolean) {
        const classes = classMap({
            'control-button': true,
            'control-button--active': isActive,
            'control-button--disabled': true
        });

        return html`
            <div
                class=${classes}
                title=${isActive ? 'TV is on' : 'TV is off'}
                aria-label=${isActive ? 'TV is on' : 'TV is off'}
            >
                <img class="control-button__icon" src=${TV_ICON} alt="Television" />
                <span class="control-button__label">TV</span>
            </div>
        `;
    }

    private async _toggleLight(entityId: string) {
        await controlButtonsService.toggleLight(entityId);
    }

    private async _startVacuum() {
        await controlButtonsService.startVacuum();
    }
}
