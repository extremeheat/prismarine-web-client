const { LitElement, html, css } = require('lit')

const audioContext = new window.AudioContext()
const sounds = {}

async function playSound (path) {
  let volume = 1
  const options = document.getElementById('options-screen')
  if (options) {
    volume = options.sound / 100
  }

  let soundBuffer = sounds[path]

  if (!soundBuffer) {
    const res = await window.fetch(path)
    const data = await res.arrayBuffer()

    soundBuffer = await audioContext.decodeAudioData(data)
    sounds[path] = soundBuffer
  }

  const gainNode = audioContext.createGain()
  const source = audioContext.createBufferSource()
  source.buffer = soundBuffer
  source.connect(gainNode)
  gainNode.connect(audioContext.destination)
  gainNode.gain.value = volume
  source.start(0)
}

class Button extends LitElement {
  static get styles () {
    return css`
      .button {
        --txrV: 66px;
        position: relative;
        width: 200px;
        height: 20px;
        font-family: var(--fontFamily);
        font-size: 10px;
        color: white;
        text-shadow: 1px 1px #222;
        border: none;
        z-index: 1;
        outline: none;
        border-radius: 2px;
        background-color: var(--c-buttonPrimary);
        transition: background-color 1s ease;
      }

      .button:hover,
      .button:focus-visible {
        --txrV: 86px;
        background-color: var(--c-buttonPrimaryHover);
        transition: background-color 0.25s ease;
      }

      .button:disabled {
        --txrV: 46px;
        color: #A0A0A0;
        text-shadow: 1px 1px #111;
      }

      .button::after {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 50%;
        height: 20px;
        background-size: 256px;
        z-index: -1;
      }

      .button::before {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 50%;
        width: 50%;
        height: 20px;
        background-size: 256px;
        z-index: -1;
      }
    `
  }

  static get properties () {
    return {
      label: {
        type: String,
        attribute: 'pmui-label'
      },
      width: {
        type: String,
        attribute: 'pmui-width'
      },
      disabled: {
        type: Boolean,
        attribute: 'pmui-disabled'
      },
      onPress: {
        type: Function,
        attribute: 'pmui-click'
      },
      fontSize: {
        type: Number
      }
    }
  }

  constructor () {
    super()
    this.label = ''
    this.disabled = false
    this.width = '200px'
    this.onPress = () => {}
    this.fontSize = 10
  }

  render () {
    return html`
    <button
      class="button"
      ?disabled=${this.disabled}
      @click=${this.onBtnClick}
      style="width: ${this.width}; font-size: ${this.fontSize}px"
    >
      ${this.label}
    </button>`
  }

  onBtnClick () {
    playSound('click.mp3')
    this.dispatchEvent(new window.CustomEvent('pmui-click'))
  }
}

window.customElements.define('pmui-button', Button)
const _playSound = playSound
export { _playSound as playSound }
