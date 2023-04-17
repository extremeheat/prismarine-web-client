const { LitElement, html, css } = require('lit')
const { isMobile } = require('./menus/components/common')

class ChatBox extends LitElement {
  static get styles () {
    return css`
      .chat-wrapper {
          position: fixed;
          z-index: 10;
      }
      .chat-display-wrapper {
          bottom: 40px;
          padding: 4px;
          padding-left: 0;
          max-height: var(--chatHeight);
          width: var(--chatWidth);
          transform-origin: bottom left;
          transform: scale(var(--chatScale));
      }
      .chat-input-wrapper {
          bottom: 1px;
          width: calc(100% - 3px);
          position: absolute;
          left: 1px;
          box-sizing: border-box;
          overflow: hidden;
          background-color: rgba(0, 0, 0, 0);
      }
      .input-mobile {
        top: 1px;
      }
      .display-mobile {
        top: 40px;
      }
      .chat {
          overflow: hidden;
          color: white;
          font-size: 10px;
          margin: 0px;
          line-height: 100%;
          text-shadow: 1px 1px 0px #3f3f3f;
          font-family: var(--fontFamily);
          width: 100%;
          max-height: var(--chatHeight);
      }
      input[type=text], #chatinput {
          background-color: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 0, 0, 0);
          display: none;
          outline: none;
      }
      #chatinput:focus {
        border-color: white;
      }
      .chat-message {
          display: block;
          padding-left: 4px;
          background-color: rgba(0, 0, 0, 0.5);
      }
      .chat-message-fadeout {
          opacity: 1;
          transition: all 3s;
      }
      .chat-message-fade {
          opacity: 0;
      }
      .chat-message-faded {
          transition: none !important;
      }
      .chat-message-chat-opened {
          opacity: 1 !important;
          transition: none !important;
      }
    `
  }

  render () {
    return html`
    <div id="chat-wrapper" class="chat-wrapper chat-display-wrapper">
      <div class="chat" id="chat">
        <li class="chat-message chat-message-fade chat-message-faded">Welcome to prismarine-web-client! Chat appears here.</li>
      </div>
    </div>
    <div id="chat-wrapper2" class="chat-wrapper chat-input-wrapper">
      <div class="chat" id="chat-input">
        <input type="text" class="chat" id="chatinput" spellcheck="false" autocomplete="off"></input>
      </div>
    </div>
    `
  }

  constructor () {
    super()
    this.chatHistoryPos = 0
    this.chatHistory = []
  }

  enableChat (isCommand) {
    const chat = this.shadowRoot.querySelector('#chat')
    const chatInput = this.shadowRoot.querySelector('#chatinput')

    this.shadowRoot.querySelector('#chat-wrapper2').classList.toggle('input-mobile', isMobile())
    this.shadowRoot.querySelector('#chat-wrapper').classList.toggle('display-mobile', isMobile())

    // Set inChat value
    this.inChat = true
    // Exit the pointer lock
    window.releasePointerLock()
    // Show chat input
    chatInput.style.display = 'block'
    // Show extended chat history
    chat.style.maxHeight = 'var(--chatHeight)'
    chat.scrollTop = chat.scrollHeight // Stay bottom of the list
    if (isCommand) { // handle commands
      chatInput.value = '/'
    }
    // Focus element
    chatInput.focus()
    this.chatHistoryPos = this.chatHistory.length
    document.querySelector('#hud').shadowRoot.querySelector('#chat').shadowRoot
      .querySelectorAll('.chat-message').forEach(e => e.classList.add('chat-message-chat-opened'))
  }

  init (bot) {
    this.inChat = false
    const chat = this.shadowRoot.querySelector('#chat')
    const chatInput = this.shadowRoot.querySelector('#chatinput')

    // Show chat
    chat.style.display = 'block'

    // Esc event - Doesnt work with onkeypress?! - keypressed is deprecated uk
    document.addEventListener('keydown', (e) => {
      if (!this.inChat) return
      switch (e.code) {
        case 'Escape': return disableChat()
        case 'ArrowUp':
          if (this.chatHistoryPos === 0) return
          chatInput.value = this.chatHistory[--this.chatHistoryPos] !== undefined ? this.chatHistory[this.chatHistoryPos] : ''
          setTimeout(() => { chatInput.setSelectionRange(-1, -1) }, 0)
          return
        case 'ArrowDown':
          if (this.chatHistoryPos === this.chatHistory.length) return
          chatInput.value = this.chatHistory[++this.chatHistoryPos] !== undefined ? this.chatHistory[this.chatHistoryPos] : ''
          setTimeout(() => { chatInput.setSelectionRange(-1, -1) }, 0)
      }
    })

    // Chat events
    document.addEventListener('keypress', e => {
      if (!this.inChat) return
      if (e.code === 'Enter') {
        this.chatHistory.push(chatInput.value)
        bot.chat(chatInput.value)
        disableChat()
      }
    })

    const disableChat = () => {
      this.inChat = false
      hideChat()
      window.requestPointerLock()
    }

    const hideChat = () => {
      // Clear chat input
      chatInput.value = ''
      // Unfocus it
      chatInput.blur()
      // Hide it
      chatInput.style.display = 'none'
      // Hide extended chat history
      chat.style.maxHeight = 'var(--chatHeight)'
      chat.scrollTop = chat.scrollHeight // Stay bottom of the list
      document.querySelector('#hud').shadowRoot.querySelector('#chat').shadowRoot
        .querySelectorAll('.chat-message').forEach(e => e.classList.remove('chat-message-chat-opened'))
    }

    bot.on('message', (message) => {
      // Reading of chat message
      const li = document.createElement('li')
      li.innerHTML += message.toHTML()
      chat.appendChild(li)
      chat.scrollTop = chat.scrollHeight // Stay bottom of the list
      // fading
      li.classList.add('chat-message')
      if (this.inChat) {
        li.classList.add('chat-message-chat-opened')
      }
      setTimeout(() => {
        li.classList.add('chat-message-fadeout')
        li.classList.add('chat-message-fade')
        setTimeout(() => {
          li.classList.add('chat-message-faded')
        }, 3000)
      }, 5000)
    })

    hideChat()
  }
}

window.customElements.define('chat-box', ChatBox)
