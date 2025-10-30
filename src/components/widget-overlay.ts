import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import './media-player';
import './control-widget';
import './weather-widget';
import './clock-widget';
import './calendar-events';
import './timer-widget';

@customElement('widget-overlay')
export class WidgetOverlay extends LitElement {
    private static readonly COLLAPSED_HEIGHT = 260;
    private static readonly EXPANDED_HEIGHT = 520;

    @state() private _sheetHeight = WidgetOverlay.COLLAPSED_HEIGHT;
    @state() private _isExpanded = false;
    @state() private _isDragging = false;
    @property({type: String}) public viewMode: 'photos' | 'camera' = 'photos';

    private _dragStartY = 0;
    private _dragStartHeight = WidgetOverlay.COLLAPSED_HEIGHT;

    public static styles = css`
        :host {
            display: block;
        }

        .overlay {
            position: fixed;
            z-index: 999;
            background: linear-gradient(153deg, rgb(157 94 0 / 10%), rgb(0 95 161 / 20%));
            bottom: 0;
            right: 0;
            backdrop-filter: blur(10px);
            margin-right: 40px;
            padding: 16px 24px 24px;
            border-radius: 20px 20px 0 0;
            box-sizing: border-box;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3), inset 6px 12px 42px 12px rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-top-color: rgba(255, 255, 255, 0.3);
            border-bottom: none;
            overflow: hidden;
            transition: height 0.3s ease, box-shadow 0.3s ease;
        }

        .overlay--dragging {
            transition: none;
        }

        .flex-spacer {
            flex: 1 1 0%;
        }

        .spacer {
            border-left: 2px solid rgba(255, 255, 255, 0.2);
            height: 150px;
        }

        .handle {
            width: 80px;
            height: 8px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.45);
            margin: 0 auto;
            cursor: grab;
            touch-action: none;
        }

        .handle--dragging {
            cursor: grabbing;
        }

        .overlay__content {
            display: flex;
            justify-content: flex-start;
            align-items: stretch;
            gap: 32px;
        }

        .view-toggle {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 0, 0, 0.35);
            border-radius: 999px;
            padding: 6px;
            margin: 12px 0 24px;
        }

        .overlay__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .view-toggle__button {
            border: none;
            border-radius: 999px;
            padding: 8px 16px;
            background: transparent;
            color: #fff;
            cursor: pointer;
            font-size: 0.95rem;
            transition: background 0.2s ease;
        }

        .view-toggle__button:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .view-toggle__button--active {
            background: rgba(255, 255, 255, 0.9);
            color: #000;
        }

        .settings-button {
            border: none;
            border-radius: 999px;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.35);
            color: #fff;
            cursor: pointer;
            font-size: 0.95rem;
            transition: background 0.2s ease;
        }

        .settings-button:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .overlay__extras {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 24px;
            opacity: 0;
            transform: translateY(30px);
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .overlay--expanded .overlay__extras {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        .overlay__extras-card {
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 20px;
            color: #fff;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-height: 220px;
        }

        .overlay__extras-card calendar-events,
        .overlay__extras-card control-widget {
            flex: 1;
            width: 100%;
            height: 100%;
            display: block;
        }
    `;

    public render() {
        const overlayClasses = classMap({
            overlay: true,
            'overlay--expanded': this._isExpanded,
            'overlay--dragging': this._isDragging
        });

        const handleClasses = classMap({
            handle: true,
            'handle--dragging': this._isDragging
        });

        const overlayStyles = styleMap({
            height: `${this._sheetHeight}px`
        });

        return html`
            <div class=${overlayClasses} style=${overlayStyles}>
                <div
                    class=${handleClasses}
                    @pointerdown=${this._onHandlePointerDown}
                    @pointermove=${this._onHandlePointerMove}
                    @pointerup=${this._onHandlePointerUp}
                    @pointercancel=${this._onHandlePointerUp}
                    @touchstart=${this._onHandleTouchStart}
                ></div>
                <div class="overlay__content">
                    <media-player></media-player>
                    <div class="flex-spacer"></div>
                    <weather-widget></weather-widget>
                    <div class="spacer"></div>
                    <clock-widget></clock-widget>
                </div>
                <div class="overlay__extras">
                    <div class="overlay__extras-card">
                        <control-widget></control-widget>
                    </div>
                    <div class="overlay__extras-card">
                        <timer-widget></timer-widget>
                    </div>
                    <div class="overlay__extras-card">
                        <calendar-events></calendar-events>
                        <div class="overlay__header">
                            <div class="view-toggle">
                                <button
                                    class=${classMap({
                                        'view-toggle__button': true,
                                        'view-toggle__button--active': this.viewMode === 'photos'
                                    })}
                                    type="button"
                                    @click=${() => this._setViewMode('photos')}
                                >
                                    Photos
                                </button>
                                <button
                                    class=${classMap({
                                        'view-toggle__button': true,
                                        'view-toggle__button--active': this.viewMode === 'camera'
                                    })}
                                    type="button"
                                    @click=${() => this._setViewMode('camera')}
                                >
                                    CCTV
                                </button>
                            </div>
                            <button class="settings-button" type="button" @click=${this._openSettings}>
                                Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Shared drag helpers
    private _startDrag(startY: number) {
        this._isDragging = true;
        this._dragStartY = startY;
        this._dragStartHeight = this._sheetHeight;
    }

    private _moveDrag(currentY: number) {
        const delta = this._dragStartY - currentY;
        const nextHeight = this._dragStartHeight + delta;
        const clampedHeight = Math.min(
            WidgetOverlay.EXPANDED_HEIGHT,
            Math.max(WidgetOverlay.COLLAPSED_HEIGHT, nextHeight)
        );

        this._sheetHeight = clampedHeight;
    }

    private _endDrag() {
        this._isDragging = false;
        const midpoint = (WidgetOverlay.COLLAPSED_HEIGHT + WidgetOverlay.EXPANDED_HEIGHT) / 2;
        const shouldExpand = this._sheetHeight >= midpoint;
        this._sheetHeight = shouldExpand ? WidgetOverlay.EXPANDED_HEIGHT : WidgetOverlay.COLLAPSED_HEIGHT;
        this._isExpanded = shouldExpand;
    }

    private _onHandlePointerDown(event: PointerEvent) {
        this._startDrag(event.clientY);

        const target = event.currentTarget as HTMLElement;
        target.setPointerCapture(event.pointerId);
    }

    private _onHandlePointerMove(event: PointerEvent) {
        if (!this._isDragging) {
            return;
        }
        this._moveDrag(event.clientY);
        event.preventDefault();
    }

    private _onHandlePointerUp(event: PointerEvent) {
        if (!this._isDragging) {
            return;
        }

        const target = event.currentTarget as HTMLElement;
        if (target.hasPointerCapture(event.pointerId)) {
            target.releasePointerCapture(event.pointerId);
        }
        this._endDrag();
    }

    // Touch fallback for browsers/devices without Pointer Events
    private _onHandleTouchStart = (event: TouchEvent) => {
        if (event.touches.length === 0) return;
        const y = event.touches[0].clientY;
        this._startDrag(y);
        event.preventDefault();
        // Track moves on the window so dragging continues outside the handle
        window.addEventListener('touchmove', this._onTouchMove, { passive: false });
        window.addEventListener('touchend', this._onTouchEnd);
        window.addEventListener('touchcancel', this._onTouchEnd);
    };

    private _onTouchMove = (event: TouchEvent) => {
        if (!this._isDragging) return;
        const touch = event.touches[0] ?? event.changedTouches[0];
        if (!touch) return;
        this._moveDrag(touch.clientY);
        event.preventDefault();
    };

    private _onTouchEnd = (_event: TouchEvent) => {
        if (!this._isDragging) return;
        this._endDrag();
        window.removeEventListener('touchmove', this._onTouchMove as EventListener);
        window.removeEventListener('touchend', this._onTouchEnd as EventListener);
        window.removeEventListener('touchcancel', this._onTouchEnd as EventListener);
    };

    private _setViewMode(mode: 'photos' | 'camera'): void {
        if (this.viewMode === mode) {
            return;
        }

        this.viewMode = mode;

        this.dispatchEvent(new CustomEvent('view-mode-change', {
            detail: { viewMode: mode },
            bubbles: true,
            composed: true
        }));
    }

    private _openSettings = (): void => {
        this.dispatchEvent(new CustomEvent('open-settings', {
            bubbles: true,
            composed: true
        }));
    };

}
