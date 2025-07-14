import {css, html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('loading-spinner')
export class LoadingSpinner extends LitElement {
  static styles = css`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #000;
      z-index: 9999;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  constructor() {
    super();
    // Hide the loading spinner when the component is fully loaded
    window.addEventListener('load', () => {
      this.remove();
    });
  }

  render() {
    return html`
      <div class="loading-spinner"></div>
    `;
  }
}