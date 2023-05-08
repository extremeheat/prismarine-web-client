const { LitElement, html, css } = require('lit')
const { commonCss } = require('./common')

class Slider extends LitElement {
  static get styles () {
    return css`
      ${commonCss}
      .slider-container {
        --txrV: -46px;
        position: relative;
        width: 150px;
        height: 20px;
        font-family: var(--fontFamily);
        font-size: 10px;
        color: white;
        text-shadow: 1px 1px #220;
        z-index: 1;
        background-color: var(--c-sliderBg);
        transition: background-color 1s ease;
        border-radius: 2px;
        cursor: ew-resize;
      }

      .slider-thumb {
        --txrV: -66px;
        pointer-events: none;
        width: 8px;
        height: 20px;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 3;
        background-color: var(--c-sliderThumb);
        transition: background-color 0.25s ease;
        border-radius: 2px;
      }

      .slider-container:hover .slider-thumb {
        --txrV: -86px;
        background-color: var(--c-sliderThumbHover);
      }

      .slider {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        -webkit-appearance: none;
        appearance: none;
        background: none;
        width: 100%;
        height: 20px;
        margin: 0;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        position: relative;
        appearance: none;
        width: 8px;
        height: 20px;
        background: transparent;
      }

      .slider::-moz-range-thumb {
        width: 8px;
        height: 20px;
        background: transparent;
      }

      label {
        pointer-events: none;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 6;
        width: max-content;
      }
    `
  }

  constructor () {
    super()
    this.label = ''
    this.type = '%'
    this.width = '150px'
    this.value = '50'
    this.min = '0'
    this.max = '100'
    this.ratio = (Number(this.value) - Number(this.min)) / (Number(this.max) - Number(this.min))
  }

  updated () {
    this.ratio = (Number(this.value) - Number(this.min)) / (Number(this.max) - Number(this.min))
  }

  static get properties () {
    return {
      label: {
        type: String,
        attribute: 'pmui-label'
      },
      type: {
        type: String,
        attribute: 'pmui-type'
      },
      width: {
        type: String,
        attribute: 'pmui-width'
      },
      value: {
        type: String,
        attribute: 'pmui-value'
      },
      min: {
        type: String,
        attribute: 'pmui-min'
      },
      max: {
        type: String,
        attribute: 'pmui-max'
      },
      ratio: { type: Number }
    }
  }

  render () {
    return html`
      <div
        class="slider-container"
        style="width: ${this.width};"
      >
        <input
          type="range"
          class="slider"
          min="${this.min}"
          max="${this.max}"
          value="${this.value}"
          @input=${(e) => {
            const range = e.target
            this.ratio = (range.value - range.min) / (range.max - range.min)
            this.value = range.value
          }}>
        <div
          class="slider-thumb"
          style="left: calc((100% * ${this.ratio}) - (8px * ${this.ratio}));"
        ></div>
        <label>${this.label}: ${this.value}${this.type}</label>
      </div>
    `
  }
}

window.customElements.define('pmui-slider', Slider)
