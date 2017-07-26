/**
* Resets the project for building and builds the launcher with electron-builder.
*/
const builder = require('electron-builder')
const fs = require('fs-jetpack')
const path = require('path')
const Platform = builder.Platform

const pathToConfig = path.join(__dirname, '..', 'src', 'config', 'config.json')
let config = require(pathToConfig)

config.basicSettings = {
  init: [
    2,
    24,
    25,
    26,
    32
  ],
  d_init: [
    0,
    5,
    7,
    51
  ]
}
config.settings.paths = {
  config: '',
  contents: '',
  dfConfig: '',
  dfdConfig: '',
  dfdConfigSupplement: '',
  data: ''
}
config.settings.df.launchable = false
config.initDF = false

fs.write(pathToConfig, config, {
  jsonIndent: 4
})

builder.build({
  targets: Platform.MAC.createTarget(),
  config: {
    asar: false
  }
})
  .then(() => {
    console.log('Built!')
  })
  .catch((error) => {
    console.error(error)
  })
