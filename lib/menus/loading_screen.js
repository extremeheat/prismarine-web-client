const { LitElement, html, css } = require('lit')
const { unsafeHTML } = require('lit/directives/unsafe-html.js')
const { commonCss } = require('./components/common')

class LoadingScreen extends LitElement {
  static get styles () {
    return css`
      ${commonCss}
      p, br {
        display: block;
      }

      .title {
        top: 2vh;
        position: relative;
      }

      #cancel-btn {
        position: relative;
        margin: auto;
        width: fit-content;
        display: block;
      }

      small {
        color: gray;
      }
    `
  }

  static get properties () {
    return {
      status: { type: String },
      errors: { type: Array },
      loadingText: { type: String },
      hasError: { type: Number }
    }
  }

  constructor () {
    super()
    this.hasError = false
    this.status = 'Waiting for JS load'
    this.errors = []
  }

  firstUpdated () {
    this.statusRunner()
  }

  async statusRunner () {
    const array = ['.', '..', '...', '']
    const timer = ms => new Promise((resolve) => setTimeout(resolve, ms))

    const load = async () => {
      for (let i = 0; true; i = ((i + 1) % array.length)) {
        this.loadingText = this.status + array[i]
        await timer(500)
      }
    }

    load()
  }

  render () {
    return html`
      <div class="bg dirt-bg"></div>
      <p class="title">${this.hasError
        ? this.errors.map((error, i) => html`${i !== 0 ? html`<small>${error}</small>` : error}<br/><br/>`)
        : this.loadingText
      }</p>
      ${this.hasError
        ? html`<p class="title"><small>Please reload the page to continue</small></p><br/><pmui-button id="cancel-btn" pmui-width="200px" pmui-label="Reload" @pmui-click=${() => window.location.reload()}></pmui-button>`
        : ''
      }
    `
  }

  setError (message, htmlContent) {
    this.hasError = true
    // Comment this line to show all errors. Only useful for debugging,
    // as the first error is the important one and can cause cascading errors
    if (this.errors.length) return
    if (htmlContent) {
      this.errors.push(html`${message} <br/> ${unsafeHTML(htmlContent)}`)
    } else {
      this.errors.push(message)
    }
  }
}

window.customElements.define('pmui-loadingscreen', LoadingScreen)
