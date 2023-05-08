const { LitElement, html, css } = require('lit')
const { openURL, commonCss, displayScreen } = require('./components/common')

class AboutScreen extends LitElement {
  static styles = css`
    ${commonCss}
    .title {
      top: 10px;
    }
    p, td {
      color: white;
      font-size: 8px;
      margin-bottom: 2px;
    }
    main {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 30px;
      width: 100%;
      height: calc(100% - 64px);
      place-items: center;
      background: rgba(0, 0, 0, 0.5);
      box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.7), inset 0 -3px 6px rgba(0, 0, 0, 0.7);
    }
    .bottom-btns {
      display: flex;
      flex-direction: row;
      justify-content: center;
      position: absolute;
      bottom: 9px;
      width: 100%;
    }
  `

  render () {
    return html`
    <div class='title'>About</div>
    <main style='text-align:center;'>
      <p class='text'>Prismarine Web Client is an open source client compatible with the Minecraft protocol</p>
      <div style='margin:2%;'>
        <pmui-button pmui-width="140px" pmui-label="PrismarineJS Discord 💬" @pmui-click=${() => openURL('https://discord.gg/4Ucm684Fq3')}></pmui-button>
      </div>
      <p><strong>Asset Credits</strong></p>
      <table>
        <tr><td><b>Asset</b></td><td><b>License</b></td></tr>
        ${Object.entries(credits).map(([asset, license]) => html`<tr><td>${asset}</td><td>${license}</td></tr>`)}
        <tr></tr>
        <tr><td colspan='2'>Minecraft textures if used are copyright Mojang AB.</td></tr>
        <tr><td colspan='2'>All other code is copyright open source contributors, released under MIT license.</td></tr>
      </table>
    </main>
    <div class="bottom-btns">
      <pmui-button pmui-width="200px" pmui-label="Done" @pmui-click=${() => displayScreen(this, document.getElementById('title-screen'))}></pmui-button>
    </div>
    `
  }
}

const credits = {
  'click.wav': 'Mixkit Sound Effects Free License',
  'snowfall.mp4': 'CC0, via Pexels'
}
window.customElements.define('pmui-aboutscreen', AboutScreen)
