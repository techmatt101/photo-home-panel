import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { timerService } from '../state';
import { TimerViewModel } from '../services/timer.service';
import { classMap } from 'lit/directives/class-map.js';

@customElement('timer-widget')
export class TimerWidget extends LitElement {
    public static styles = css`
        :host {
            display: block;
            color: #fff;
        }

        .timer-card {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .timer-card__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }

        .timer-card__title {
            font-size: 1.1rem;
            margin: 0;
        }

        .quick-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .quick-actions__button {
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 999px;
            color: inherit;
            padding: 8px 14px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.2s ease, transform 0.2s ease;
        }

        .quick-actions__button:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
        }

        .quick-actions__button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .timer-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .timer-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .timer-item--active {
            background: rgba(82, 179, 255, 0.15);
            border-color: rgba(82, 179, 255, 0.35);
        }

        .timer-item__info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .timer-item__name {
            font-weight: 600;
        }

        .timer-item__status {
            font-size: 0.85rem;
            opacity: 0.75;
        }

        .timer-item__remaining {
            font-size: 1.2rem;
            font-variant-numeric: tabular-nums;
        }

        .timer-item__actions {
            display: flex;
            gap: 8px;
        }

        .timer-button {
            background: rgba(255, 255, 255, 0.12);
            border: none;
            border-radius: 999px;
            padding: 6px 12px;
            color: inherit;
            cursor: pointer;
            font-size: 0.85rem;
            transition: background 0.2s ease;
        }

        .timer-button:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.22);
        }

        .timer-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .empty-state {
            text-align: center;
            opacity: 0.7;
            font-size: 0.95rem;
        }
    `;

    @state() private _timers: TimerViewModel[] = [];
    private _subscription: Subscription | null = null;

    public connectedCallback(): void {
        super.connectedCallback();
        this._subscription = timerService.timers$.subscribe((timers) => {
            this._timers = timers;
        });
    }

    public disconnectedCallback(): void {
        this._subscription?.unsubscribe();
        this._subscription = null;
        super.disconnectedCallback();
    }

    public render() {
        const hasTimers = this._timers.length > 0;
        const primaryTimer = this._timers[0] ?? null;

        return html`
            <div class="timer-card">
                <div class="timer-card__header">
                    <h3 class="timer-card__title">Kitchen Timers</h3>
                </div>

                <div class="quick-actions">
                    ${[60, 300, 600].map((seconds) => html`
                        <button
                            class="quick-actions__button"
                            type="button"
                            ?disabled=${!primaryTimer}
                            @click=${() => this._startQuickTimer(primaryTimer?.entityId, seconds)}
                        >
                            ${Math.round(seconds / 60)} min
                        </button>
                    `)}
                    <button
                        class="quick-actions__button"
                        type="button"
                        ?disabled=${!primaryTimer}
                        @click=${() => this._startQuickTimer(primaryTimer?.entityId, 900)}
                    >
                        15 min
                    </button>
                </div>

                ${hasTimers ? html`
                    <div class="timer-list">
                        ${this._timers.map((timer) => this._renderTimer(timer))}
                    </div>
                ` : html`
                    <div class="empty-state">No kitchen timers running.</div>
                `}
            </div>
        `;
    }

    private _renderTimer(timer: TimerViewModel) {
        const isActive = timer.state === 'active';
        const isPaused = timer.state === 'paused';
        const resumeLabel = isPaused ? 'Resume' : 'Start';

        return html`
            <div class=${classMap({
                'timer-item': true,
                'timer-item--active': isActive
            })}>
                <div class="timer-item__info">
                    <span class="timer-item__name">${timer.name}</span>
                    <span class="timer-item__status">${this._formatStatus(timer)}</span>
                </div>
                <div class="timer-item__remaining">${this._formatSeconds(timer.remainingSeconds)}</div>
                <div class="timer-item__actions">
                    ${isActive ? html`
                        <button class="timer-button" type="button" @click=${() => timerService.pauseTimer(timer.entityId)}>
                            Pause
                        </button>
                    ` : html`
                        <button class="timer-button" type="button" @click=${() => timerService.startTimer(timer.entityId)}>
                            ${resumeLabel}
                        </button>
                    `}
                    <button class="timer-button" type="button" @click=${() => timerService.cancelTimer(timer.entityId)}>
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    private _startQuickTimer(entityId: string | undefined, seconds: number): void {
        if (!entityId) {
            return;
        }
        timerService.startTimer(entityId, seconds);
    }

    private _formatSeconds(totalSeconds: number): string {
        const seconds = Math.max(0, Math.round(totalSeconds));
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    private _formatStatus(timer: TimerViewModel): string {
        if (timer.state === 'active') {
            return 'Running';
        }
        if (timer.state === 'paused') {
            return 'Paused';
        }
        return 'Idle';
    }
}
