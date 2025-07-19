import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { controlButtonsService } from "../state";
import { Subscription } from 'rxjs';
import { LightEntity, MediaPlayerEntity, VacuumEntity } from '../intergrations/home-assistant/home-assistant.types';

@customElement('control-buttons')
export class ControlButtons extends LitElement {
    private tvSubscription: Subscription | null = null;
    private tvStatus: MediaPlayerEntity | null = null;
    private lightSubscription: Subscription | null = null;
    private lightStatus: LightEntity | null = null;
    private vacuumSubscription: Subscription | null = null;
    private vacuumStatus: VacuumEntity | null = null;

    public static styles = css`
        :host {
            display: block;
        }

        .controls {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 3;
            display: flex;
            gap: 10px;
        }

        .control-button {
            background: var(--background-overlay, rgba(0, 0, 0, 0.5));
            color: var(--primary-color, #ffffff);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            font-size: 18px;
            transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .control-button:hover {
            background: rgba(0, 0, 0, 0.7);
            transform: scale(1.1);
        }

        @media (max-width: 768px) {
            .controls {
                top: 10px;
                right: 10px;
            }
        }
    `;

    public connectedCallback() {
        super.connectedCallback();
        this.initializeControlButtons();
    }

    public disconnectedCallback() {
        super.disconnectedCallback();

        // Clean up subscriptions
        if (this.tvSubscription) {
            this.tvSubscription.unsubscribe();
            this.tvSubscription = null;
        }
        
        if (this.lightSubscription) {
            this.lightSubscription.unsubscribe();
            this.lightSubscription = null;
        }
        
        if (this.vacuumSubscription) {
            this.vacuumSubscription.unsubscribe();
            this.vacuumSubscription = null;
        }
    }

    public render() {
        const isTVOn = this.tvStatus !== null && this.tvStatus.state !== 'off';
        const isLightOn = this.lightStatus !== null && this.lightStatus.state === 'on';
        const isVacuumActive = this.vacuumStatus !== null && this.vacuumStatus.state === 'cleaning';

        return html`
            <div class="controls">
                <button 
                    class="control-button" 
                    title="${isLightOn ? 'Living room lights are on' : 'Living room lights are off'}" 
                    style="${isLightOn ? 'background: rgba(255, 255, 0, 0.5);' : ''}"
                    @click=${() => this.toggleLight('light.living_room')}
                >
                    💡
                </button>
                <button 
                    class="control-button" 
                    title="${isVacuumActive ? 'Vacuum is cleaning' : 'Start vacuum cleaner'}" 
                    style="${isVacuumActive ? 'background: rgba(0, 255, 0, 0.5);' : ''}"
                    @click=${this.startVacuum}
                >
                    🧹
                </button>
                ${isTVOn ? html`
                    <button class="control-button" title="TV is on">📺</button>
                ` : ''}
                <button class="control-button" title="Settings">⚙️</button>
            </div>
        `;
    }

    private async initializeControlButtons() {
        try {
            // Subscribe to TV status updates using RxJS
            this.tvSubscription = controlButtonsService.tvStatus$.subscribe(tv => {
                this.tvStatus = tv;
                this.requestUpdate();
            });
            
            // Subscribe to light status updates
            this.lightSubscription = controlButtonsService.lightStatus$.subscribe(light => {
                this.lightStatus = light;
                this.requestUpdate();
            });
            
            // Subscribe to vacuum status updates
            this.vacuumSubscription = controlButtonsService.vacuumStatus$.subscribe(vacuum => {
                this.vacuumStatus = vacuum;
                this.requestUpdate();
            });
        } catch (error) {
            console.error('Error initializing control buttons service:', error);
        }
    }

    private async toggleLight(entityId: string) {
        await controlButtonsService.toggleLight(entityId);
    }

    private async startVacuum() {
        await controlButtonsService.startVacuum();
    }
}
