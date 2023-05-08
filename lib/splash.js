/* global THREE, OffscreenCanvas */
const colors = require('./colors')
let panoramaCubeMap
let playingVideo

// Menu panorama background
function addPanoramaCubeMap (viewer) {
  let time = 0
  viewer.camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.05, 1000)
  viewer.camera.updateProjectionMatrix()
  viewer.camera.position.set(0, 0, 0)
  viewer.camera.rotation.set(0, 0, 0)
  const loader = new THREE.TextureLoader()

  const panorGeo = new THREE.BoxGeometry(1000, 1000, 1000)
  const panorMaterials = [
    new THREE.MeshBasicMaterial({ map: loader.load('extra-textures/background/panorama_1.png'), transparent: true, side: THREE.DoubleSide }), // WS
    new THREE.MeshBasicMaterial({ map: loader.load('extra-textures/background/panorama_3.png'), transparent: true, side: THREE.DoubleSide }), // ES
    new THREE.MeshBasicMaterial({ map: loader.load('extra-textures/background/panorama_4.png'), transparent: true, side: THREE.DoubleSide }), // Up
    new THREE.MeshBasicMaterial({ map: loader.load('extra-textures/background/panorama_5.png'), transparent: true, side: THREE.DoubleSide }), // Down
    new THREE.MeshBasicMaterial({ map: loader.load('extra-textures/background/panorama_0.png'), transparent: true, side: THREE.DoubleSide }), // NS
    new THREE.MeshBasicMaterial({ map: loader.load('extra-textures/background/panorama_2.png'), transparent: true, side: THREE.DoubleSide }) // SS
  ]
  const panoramaBox = new THREE.Mesh(panorGeo, panorMaterials)
  panoramaBox.onBeforeRender = () => {
    time += 0.01
    panoramaBox.rotation.y = Math.PI + time * 0.01
    panoramaBox.rotation.z = Math.sin(-time * 0.001) * 0.001
  }

  const group = new THREE.Object3D()
  group.add(panoramaBox)

  const Entity = require('prismarine-viewer/viewer/lib/entity/Entity')
  for (let i = 0; i < 42; i++) {
    const m = new Entity('1.16.4', 'squid').mesh
    m.position.set(Math.random() * 30 - 15, Math.random() * 20 - 10, Math.random() * 10 - 17)
    m.rotation.set(0, Math.PI + Math.random(), -Math.PI / 4, 'ZYX')
    const v = Math.random() * 0.01
    m.children[0].onBeforeRender = () => {
      m.rotation.y += v
      m.rotation.z = Math.cos(panoramaBox.rotation.y * 3) * Math.PI / 4 - Math.PI / 2
    }
    group.add(m)
  }

  viewer.scene.add(group)
  return group
}

function removePanorama (viewer) {
  viewer.camera = new THREE.PerspectiveCamera(document.getElementById('options-screen').fov, window.innerWidth / window.innerHeight, 0.1, 1000)
  viewer.camera.updateProjectionMatrix()
  viewer.scene.remove(window.panoramaCubeMap)
}

// This makes it easier to customize the UI rather than needing sliced equirectangular images
function showVideoBackground (url, muted = true, adaptAccentColor = false) {
  const source = document.createElement('source')
  source.src = url
  source.type = 'video/mp4'
  const video = document.createElement('video')
  video.id = 'background-video'
  video.muted = muted
  video.autoplay = true
  video.loop = true
  video.appendChild(source)
  document.body.prepend(video)

  if (adaptAccentColor) {
    const frequencies = Object.fromEntries(Object.keys(window.uiColorThemes).map(color => [color, 0]))
    const width = 256
    const height = 144
    const offscreenCanvas = new OffscreenCanvas(width, height)
    const ctx = offscreenCanvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    function frameCallback () {
      ctx.drawImage(video, 0, 0, width / 2, height / 2)
      const imageData = ctx.getImageData(0, 0, width / 2, height / 2)
      const theme = colors.getThemeClosestToColor(imageData, window.uiColorThemes, structuredClone(frequencies), 'blue')
      window.setUIColorTheme(theme)
      setTimeout(() => video.requestVideoFrameCallback(frameCallback), 60)
    }
    video.requestVideoFrameCallback(frameCallback)
  }

  if (muted) {
    function onClick () { video.muted = false }
    document.addEventListener('click', () => onClick(), document.removeEventListener('click', onClick))
  }
}

function removeVideoBackground () {
  const video = document.getElementById('background-video')
  if (video) video.remove()
  playingVideo = null
}

function showBackground (options = window.defaultBackground) {
  if (options.videoURL && options.videoURL !== playingVideo) {
    removeBackground()
    showVideoBackground(options.videoURL, options.startMuted, options.adaptAcceptColor)
    playingVideo = options.videoURL
  } else if (options.showPanorama) {
    panoramaCubeMap = addPanoramaCubeMap(window.viewer)
  }
}

function removeBackground () {
  removeVideoBackground()
  if (panoramaCubeMap) {
    removePanorama(window.viewer)
    panoramaCubeMap = null
  }
}

const uiTheme = window.localStorage.getItem('uiTheme')
if (uiTheme === 'mc') {
  window.defaultBackground = { showPanorama: true }
} else {
  window.defaultBackground = { videoURL: 'extra-textures/sky2.webm', startMuted: true, adaptAcceptColor: false }
}
module.exports = { showBackground, removeBackground }
