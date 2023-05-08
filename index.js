/* global THREE */
require('./lib/theme')
require('./lib/chat')

require('./lib/menus/components/button')
require('./lib/menus/components/edit_box')
require('./lib/menus/components/slider')
require('./lib/menus/components/hotbar')
require('./lib/menus/components/health_bar')
require('./lib/menus/components/food_bar')
require('./lib/menus/components/breath_bar')
require('./lib/menus/components/debug_overlay')
require('./lib/menus/components/playerlist_overlay')
require('./lib/menus/components/bossbars_overlay')
require('./lib/menus/hud')
require('./lib/menus/play_screen')
require('./lib/menus/pause_screen')
require('./lib/menus/loading_screen')
require('./lib/menus/keybinds_screen')
require('./lib/menus/options_screen')
require('./lib/menus/title_screen')
require('./lib/menus/about_screen')

const net = require('net')
const Cursor = require('./lib/cursor')
const splash = require('./lib/splash')
window.splash = splash

// Workaround for process.versions.node not existing in the browser
process.versions.node = '14.0.0'

const mineflayer = require('mineflayer')
const { WorldView, Viewer } = require('prismarine-viewer/viewer')
const pathfinder = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')
global.THREE = require('three')
const { initVR } = require('./lib/vr')

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('SW registered: ', registration)
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError)
    })
  })
}

const maxPitch = 0.5 * Math.PI
const minPitch = -0.5 * Math.PI

// Create three.js context, add to page
const renderer = new THREE.WebGLRenderer()
renderer.setPixelRatio(window.devicePixelRatio || 1)
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
window.requestPointerLock = () => {
  if (window.hasPointerLock()) return
  // If this fails with "DOMException: The user has exited the lock before this request was completed."
  // you need to wait for `window.isPointerLocked` to be false before calling this
  renderer?.domElement?.requestPointerLock()
}
window.releasePointerLock = () => {
  document.exitPointerLock()
}
window.hasPointerLock = (element) => {
  return element ? (document.pointerLockElement === element) : !!document.pointerLockElement
}

// Create viewer
const viewer = new Viewer(renderer)
window.viewer = viewer

let animate = () => {
  window.requestAnimationFrame(animate)
  viewer.update()
  renderer.render(viewer.scene, viewer.camera)
}
animate()

window.addEventListener('resize', () => {
  viewer.camera.aspect = window.innerWidth / window.innerHeight
  viewer.camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const showEl = (str) => { document.getElementById(str).style = 'display:block' }
async function main () {
  const menu = document.getElementById('play-screen')

  menu.addEventListener('connect', e => {
    const options = e.detail
    menu.style = 'display: none;'
    showEl('loading-screen')
    connect(options)
  })
}

async function connect (options) {
  const loadingScreen = document.getElementById('loading-screen')

  const hud = document.getElementById('hud')
  const chat = hud.shadowRoot.querySelector('#chat')
  const debugMenu = hud.shadowRoot.querySelector('#debug-overlay')
  const optionsScrn = document.getElementById('options-screen')
  const keyBindScrn = document.getElementById('keybinds-screen')
  const gameMenu = document.getElementById('pause-screen')

  function hideAllScreens () {
    for (const screen of document.querySelectorAll('.pmui')) {
      screen.style.display = 'none'
    }
  }
  window.showScreen = (screen) => {
    switch (screen) {
      case 'options': optionsScrn.style.display = 'block'; return
      case 'keybinds': keyBindScrn.style.display = 'block'; return
      case 'gameMenu': gameMenu.style.display = 'block'; return
      case 'chat': chat.style.display = 'block'; return
      case 'debug': debugMenu.style.display = 'block'; return
      case 'hud': hud.style.display = 'block'; return
      case 'loading': loadingScreen.style.display = 'block'
    }
  }

  const viewDistance = optionsScrn.renderDistance
  const hostprompt = options.server
  const proxyprompt = options.proxy
  const username = options.username
  const password = options.password

  let host, port, proxy, proxyport
  if (!hostprompt.includes(':')) {
    host = hostprompt
    port = 25565
  } else {
    [host, port] = hostprompt.split(':')
    port = parseInt(port, 10)
  }

  if (!proxyprompt.includes(':')) {
    proxy = proxyprompt
    proxyport = undefined
  } else {
    [proxy, proxyport] = proxyprompt.split(':')
    proxyport = parseInt(proxyport, 10)
  }
  console.log(`connecting to ${host} ${port} with ${username}`)

  if (proxy) {
    console.log(`using proxy ${proxy} ${proxyport}`)
    net.setProxy({ protocol: 'wss', hostname: proxy, port: proxyport })
  }

  loadingScreen.status = 'Logging in'

  const bot = mineflayer.createBot({
    host,
    port,
    version: options.botVersion === '' ? false : options.botVersion,
    username,
    password,
    viewDistance: 'tiny',
    checkTimeoutInterval: 240 * 1000,
    noPongTimeout: 240 * 1000,
    closeTimeout: 240 * 1000
  })
  hud.preload(bot)

  function showErrorScreen (message, htmlContent) {
    renderer.dispose()
    renderer.domElement.remove()
    loadingScreen.setError(message, htmlContent)
    hideAllScreens()
    window.showScreen('loading')
    splash.showBackground()
  }

  bot.on('error', (err) => {
    console.log('Encountered error!', err)
    showErrorScreen(`Error encountered: ${err}`)
  })

  bot.on('kicked', (kickReason) => {
    console.log('User was kicked!', kickReason)
    if (bot.registry) {
      const ChatMessage = require('prismarine-chat')(bot.registry)
      const chatMessage = new ChatMessage(JSON.parse(kickReason))
      showErrorScreen('The Minecraft server kicked you. Kick reason:', '<br/>' + chatMessage.toHTML())
    } else {
      showErrorScreen(`The Minecraft server kicked you. Kick reason: ${kickReason}`)
    }
  })

  bot.on('end', (endReason) => {
    console.log('disconnected for', endReason)
    showErrorScreen(`You have been disconnected from the server. End reason: ${endReason}`)
  })

  bot.once('login', () => {
    loadingScreen.status = 'Loading world'
  })

  bot.once('spawn', () => {
    splash.removeBackground()

    const mcData = require('minecraft-data')(bot.version)

    loadingScreen.status = 'Placing blocks (starting viewer)'

    console.log('bot spawned - starting viewer')

    const version = bot.version

    const center = bot.entity.position

    console.log(viewDistance)
    const worldView = new WorldView(bot.world, viewDistance, center)

    gameMenu.init(renderer)
    optionsScrn.isInsideWorld = true
    optionsScrn.addEventListener('fov_changed', (e) => {
      viewer.camera.fov = e.detail.fov
      viewer.camera.updateProjectionMatrix()
    })

    viewer.setVersion(version)

    window.worldView = worldView
    window.bot = bot
    window.mcData = mcData
    window.Vec3 = Vec3
    window.pathfinder = pathfinder
    window.debugMenu = debugMenu
    window.settings = optionsScrn
    window.renderer = renderer

    initVR(bot, renderer, viewer)

    const cursor = new Cursor(viewer, renderer, bot)
    animate = () => {
      window.requestAnimationFrame(animate)
      viewer.update()
      cursor.update(bot)
      debugMenu.cursorBlock = cursor.cursorBlock
      renderer.render(viewer.scene, viewer.camera)
    }

    // Link WorldView and Viewer
    viewer.listen(worldView)
    worldView.listenToBot(bot)
    worldView.init(bot.entity.position)

    // Bot position callback
    function botPosition () {
      viewer.setFirstPersonCamera(bot.entity.position, bot.entity.yaw, bot.entity.pitch)
      worldView.updatePosition(bot.entity.position)
    }
    bot.on('move', botPosition)
    botPosition()

    loadingScreen.status = 'Setting callbacks'

    function moveCallback (e) {
      bot.entity.pitch -= e.movementY * optionsScrn.mouseSensitivityY * 0.0001
      bot.entity.pitch = Math.max(minPitch, Math.min(maxPitch, bot.entity.pitch))
      bot.entity.yaw -= e.movementX * optionsScrn.mouseSensitivityX * 0.0001

      viewer.setFirstPersonCamera(null, bot.entity.yaw, bot.entity.pitch)
    }

    function changeCallback () {
      if (window.hasPointerLock(renderer.domElement)) {
        document.addEventListener('mousemove', moveCallback, false)
      } else {
        // Per the Pointer Lock spec, there is a timeout after a pointer has been unlocked before it can be locked again:
        // https://discourse.threejs.org/t/how-to-avoid-pointerlockcontrols-error/33017/4
        // A requestPointerLock 6() call immediately after the default unlock gesture 2 MUST fail even when transient
        // activation 4 is available, to prevent malicious sites from acquiring an unescapable locked state through
        // repeated lock attempts. On the other hand, a requestPointerLock 6() call immediately after a programmatic
        // lock exit (through a exitPointerLock 2() call) MUST succeed when transient activation 4 is available,
        // to enable applications to move frequently between interaction modes, possibly through a timer or remote
        // network activity.
        window.isPointerBlocked = true
        gameMenu.setCanReturnToGame(false)
        setTimeout(() => {
          window.isPointerBlocked = false
          gameMenu.setCanReturnToGame(true)
        }, 1250) // 1.25s per https://bugs.chromium.org/p/chromium/issues/detail?id=1127223
        document.removeEventListener('mousemove', moveCallback, false)
        if (!chat.inChat && !gameMenu.inMenu) {
          gameMenu.enableGameMenu(renderer)
        }
      }
    }
    document.addEventListener('pointerlockchange', changeCallback, false)

    let lastTouch
    document.addEventListener('touchmove', (e) => {
      window.scrollTo(0, 0)
      e.preventDefault()
      e.stopPropagation()
      if (lastTouch !== undefined) {
        moveCallback({ movementX: e.touches[0].pageX - lastTouch.pageX, movementY: e.touches[0].pageY - lastTouch.pageY })
      }
      lastTouch = e.touches[0]
    }, { passive: false })

    document.addEventListener('touchend', (e) => {
      lastTouch = undefined
    }, { passive: false })
    document.addEventListener('mousedown', (e) => {
      if (!chat.inChat && !gameMenu.inMenu) {
        window.requestPointerLock()
      }
    })

    document.addEventListener('contextmenu', (e) => e.preventDefault(), false)

    window.addEventListener('blur', (e) => {
      bot.clearControlStates()
    }, false)

    const codeFor = keyBindScrn.maps
    document.addEventListener('keydown', (e) => {
      if (chat.inChat) return
      if (gameMenu.inMenu) return
      switch (e.code) {
        case codeFor.drop.key:
          if (bot.heldItem) bot.tossStack(bot.heldItem)
          break
        case codeFor.sprint.key:
          bot.setControlState('sprint', true)
          break
        case codeFor.sneak.key:
          bot.setControlState('sneak', true)
          break
        case codeFor.jump.key:
          bot.setControlState('jump', true)
          break
        case codeFor.right.key:
          bot.setControlState('right', true)
          break
        case codeFor.left.key:
          bot.setControlState('left', true)
          break
        case codeFor.backward.key:
          bot.setControlState('back', true)
          break
        case codeFor.forward.key:
          bot.setControlState('forward', true)
          break
        case codeFor.chat.key:
          setTimeout(() => chat.enableChat(false), 20)
          break
        case codeFor.command.key:
          setTimeout(() => chat.enableChat(true), 20)
          break
        case 'Escape':
          // This only handles if game isn't in focus, if it is, that'll be caught by the pointerlockchange event
          if (chat.inChat) break
          if (gameMenu.inMenu && !window.isPointerBlocked) {
            gameMenu.disableGameMenu(renderer)
          }
          break
      }
    }, false)

    document.addEventListener('keyup', (e) => {
      if (chat.inChat || gameMenu.inMenu) {
        bot.clearControlStates()
        return
      }
      switch (e.code) {
        case codeFor.drop.key:
          if (bot.heldItem) bot.tossStack(bot.heldItem)
          break
        case codeFor.sprint.key:
          bot.setControlState('sprint', false)
          break
        case codeFor.sneak.key:
          bot.setControlState('sneak', false)
          break
        case codeFor.jump.key:
          bot.setControlState('jump', false)
          break
        case codeFor.right.key:
          bot.setControlState('right', false)
          break
        case codeFor.left.key:
          bot.setControlState('left', false)
          break
        case codeFor.backward.key:
          bot.setControlState('back', false)
          break
        case codeFor.forward.key:
          bot.setControlState('forward', false)
          break
      }
    }, false)

    loadingScreen.status = 'Done!'
    console.log(loadingScreen.status) // only do that because it's read in index.html and npm run fix complains.

    hud.init(renderer, bot, host)
    hud.style.display = 'block'

    setTimeout(function () {
      // remove loading screen, wait a second to make sure a frame has properly rendered
      loadingScreen.style = 'display: none;'
    }, 2500)
  })
}

/**
 * @param {URLSearchParams} params
 */
async function fromTheOutside (params, addr) {
  const opts = {}
  const dfltConfig = await (await window.fetch('config.json')).json()

  let server, port, proxy, proxyPort

  if (address.includes(':')) {
    const s = address.split(':')
    server = s[0]
    port = Number(s[1]) || 25565
  } else {
    server = address
    port = Number(params.get('port')) || 25565
  }

  const proxyAddr = params.get('proxy')
  if (proxyAddr) {
    const s = proxyAddr.split(':')
    proxy = s[0]
    proxyPort = Number(s[1] ?? 'NaN') || 22
  } else {
    proxy = dfltConfig.defaultProxy
    proxyPort = !dfltConfig.defaultProxy && !dfltConfig.defaultProxyPort ? '' : dfltConfig.defaultProxyPort ?? 443
  }

  opts.server = `${server}:${port}`
  opts.proxy = `${proxy}:${proxyPort}`
  opts.username = params.get('username') ?? `pviewer${Math.floor(Math.random() * 1000)}`
  opts.password = params.get('password') ?? ''
  opts.botVersion = params.get('version') ?? false

  console.log(opts)

  showEl('loading-screen')
  connect(opts)
}

const params = new URLSearchParams(window.location.search)
const address = params.get('address')
const lastPage = window.localStorage.getItem('lastPage')
if (address) {
  fromTheOutside(params, address)
} else {
  if (lastPage) {
    // Restore the last page
    console.log('Restoring page', lastPage)
    showEl(lastPage)
    window.localStorage.removeItem('lastPage')
  } else {
    showEl('title-screen')
  }
  main()
}

splash.showBackground()
