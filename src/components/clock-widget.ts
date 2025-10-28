import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { minuteSync } from "../services/time-service";
import { format } from 'date-fns';

@customElement('clock-widget')
export class ClockWidget extends LitElement {
    public static styles = css`
        .time {
            font-size: 8rem;
            font-weight: bold;
            color: #fff;

            small {
                font-size: 0.3em;
                margin-left: 0.2em;
                color: rgba(255, 255, 255, 0.5);
            }
        }

        .date {
            font-size: 3rem;
            color: rgba(255, 255, 255, 0.8);
        }
    `;
    @state() private _currentTime: Date = new Date();

    private _time$ = minuteSync()

    public connectedCallback() {
        super.connectedCallback();

        this._time$.subscribe(time => {
            this._currentTime = time;
        });
    }

    public disconnectedCallback() {
        super.disconnectedCallback();

    }


    public render() {
        return html`
            <div class="time">
                ${format(this._currentTime, 'h:mm')}<small>${format(this._currentTime, 'aaa')}</small>
            </div>
            <div class="date">
                ${format(this._currentTime, 'ccc d MMM')}
            </div>
        `;
    }
}
