import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { controlButtonsService } from "../state";

@customElement('control-buttons')
export class ControlButtons extends LitElement {
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

        // Clean up service
        controlButtonsService.dispose();
    }

    public render() {
        const isTVOn = controlButtonsService.isTVOn();

        return html`
            <div class="controls">
                <button class="control-button" title="Toggle living room lights" @click=${() => this.toggleLight('light.living_room')}>💡</button>
                <button class="control-button" title="Start vacuum cleaner" @click=${this.startVacuum}>🧹</button>
                ${isTVOn ? html`
                    <button class="control-button" title="TV is on">📺</button>
                ` : ''}
                <button class="control-button" title="Settings">⚙️</button>
            </div>
        `;
    }

    private async initializeControlButtons() {
        try {
            await controlButtonsService.initialize();

            controlButtonsService.subscribeTV(() => {
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
