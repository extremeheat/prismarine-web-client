function getAverageColor (imageData) {
  const data = imageData.data
  const rgb = { r: 0, g: 0, b: 0 }
  let length = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      rgb.r += data[i]
      rgb.g += data[i + 1]
      rgb.b += data[i + 2]
      length++
    }
  }
  rgb.r = Math.floor(rgb.r / length)
  rgb.g = Math.floor(rgb.g / length)
  rgb.b = Math.floor(rgb.b / length)
  return rgb
}

function colorShadow (hex, dim = 0.25) {
  const color = parseInt(hex.replace('#', ''), 16)

  const r = (color >> 16 & 0xFF) * dim | 0
  const g = (color >> 8 & 0xFF) * dim | 0
  const b = (color & 0xFF) * dim | 0

  const f = (c) => ('00' + c.toString(16)).substr(-2)
  return `#${f(r)}${f(g)}${f(b)}`
}

// some color comparison functions
function getDominantColor (imageData) {
  const data = imageData.data
  const colorCounts = {}
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const color = `${r},${g},${b}`
    if (colorCounts[color]) {
      colorCounts[color]++
    } else {
      colorCounts[color] = 1
    }
  }
  let max = 0
  let dominantColor = '0,0,0'
  for (const color in colorCounts) {
    if (colorCounts[color] > max) {
      max = colorCounts[color]
      dominantColor = color
    }
  }
  return dominantColor
}

// https://stackoverflow.com/a/52453462
function deltaE (rgbA, rgbB) {
  const labA = rgb2lab(rgbA)
  const labB = rgb2lab(rgbB)
  const deltaL = labA[0] - labB[0]
  const deltaA = labA[1] - labB[1]
  const deltaB = labA[2] - labB[2]
  const c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2])
  const c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2])
  const deltaC = c1 - c2
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH)
  const sc = 1.0 + 0.045 * c1
  const sh = 1.0 + 0.015 * c1
  const deltaLKlsl = deltaL / (1.0)
  const deltaCkcsc = deltaC / (sc)
  const deltaHkhsh = deltaH / (sh)
  const i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh
  return i < 0 ? 0 : Math.sqrt(i)
}

function rgb2lab (rgb) {
  let r = rgb[0] / 255; let g = rgb[1] / 255; let b = rgb[2] / 255; let x; let y; let z
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116
  y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116
  z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116
  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

function getThemeClosestToColor (imageData, themePalette, closestDistances, defaultColor) {
  const data = imageData.data
  // Match the current frame's dominant color to the color palette
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    let minDistance = Infinity
    let closestColor
    for (const color in themePalette) {
      const colorRGB = themePalette[color]
      const distance = deltaE([r, g, b], colorRGB)
      if (distance < minDistance) {
        minDistance = distance
        closestColor = color
      }
    }
    if (closestColor) closestDistances[closestColor]++
  }
  let closestColor = defaultColor
  for (const color in closestDistances) {
    if (closestDistances[color] > closestDistances[closestColor]) {
      closestColor = color
    }
  }
  return closestColor
}

module.exports = { getAverageColor, getDominantColor, colorShadow, getThemeClosestToColor }
