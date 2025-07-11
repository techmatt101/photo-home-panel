import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('side-panel')
export class SidePanel extends LitElement {
  @property({ type: Boolean }) hasContent: boolean = false;

  static styles = css`
    :host {
      display: block;
    }

    .side-panel {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 300px;
      background: var(--background-overlay, rgba(0, 0, 0, 0.5));
      backdrop-filter: blur(10px);
      z-index: 3;
      padding: 20px;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
      display: flex;
      flex-direction: column;
      color: var(--primary-color, #ffffff);
      overflow-y: auto;
    }

    .side-panel.has-content {
      transform: translateX(0);
    }

    @media (max-width: 768px) {
      .side-panel {
        width: 250px;
      }
    }

    @media (max-width: 480px) {
      .side-panel {
        width: 100%;
        transform: translateY(100%);
      }

      .side-panel.has-content {
        transform: translateY(0);
        height: 50%;
        top: auto;
      }
    }
  `;

  render() {
    return html`
      <div class="side-panel ${this.hasContent ? 'has-content' : ''}">
        <slot></slot>
      </div>
    `;
  }
}