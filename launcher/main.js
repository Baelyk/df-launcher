// Load Electron and NodeJs modules --------------------------------------------

const electron = require('electron')
const {app, BrowserWindow, Menu, ipcMain: ipc, dialog} = electron

const exec = require('child_process').exec
const fs = require('fs-jetpack')
const archiver = require('archiver')
const decompress = require('decompress')
const decompressTargz = require('decompress-targz')
const decompressTarbz2 = require('decompress-tarbz2')
const electronLog = require('electron-log')
const {download} = require('electron-dl')

const path = require('path')
const url = require('url')

const pathToConfig = path.join(__dirname, 'assets', 'config', 'config.json')
const config = require(pathToConfig)

// Module settings -------------------------------------------------------------

electronLog.transports.file.level = 'silly' // allow all config messages into the log file

// Main process globals --------------------------------------------------------

const log = {
  error: function (msg) {
    electronLog.error(msg)
  },
  warn: function (msg) {
    electronLog.warn(msg)
  },
  info: function (msg) {
    if (config.settings.log.infoMode) electronLog.info(msg)
  },
  verbose: function (msg) {
    if (config.settings.log.verboseMode) electronLog.verbose(msg)
  },
  debug: function (msg) {
    if (config.settings.log.debugMode) electronLog.debug(msg)
  },
  silly: function (msg) {
    if (config.settings.log.sillyMode) electronLog.silly(msg)
  }
}

// Constants
const pathToDF = config.settings.df.dir.path
const pathToData = path.join(app.getPath('appData'), app.getName(), 'data') // config.settings.data.dir.path

// "Constants"

let contents, dfConfig, dfdConfig, dfdConfigSupplement // eslint-disable-line

log.verbose('pathToData: ' + pathToData)
log.verbose('pathToDF: ' + pathToDF)

// Variables
let mainWindow, startupWindow, preferencesWindow
// let launchable = config.settings.df.launchable

// Menu ------------------------------------------------------------------------

let menuPlate = [
  {
    label: 'Edit',
    submenu: [{
      role: 'undo'
    }, {
      role: 'redo'
    }, {
      type: 'separator'
    }, {
      role: 'cut'
    }, {
      role: 'copy'
    }, {
      role: 'paste'
    }, {
      role: 'pasteandmatchstyle'
    }, {
      role: 'delete'
    }, {
      role: 'selectall'
    }]
  }, {
    label: 'View',
    submenu: [{
      type: 'separator'
    }, {
      role: 'resetzoom'
    }, {
      role: 'zoomin'
    }, {
      role: 'zoomout'
    }, {
      type: 'separator'
    }, {
      label: 'Debug',
      submenu: [{
        role: 'reload',
        accelerator: ''
      }, {
        role: 'toggledevtools',
        accelerator: ''
      } ]
    }, {
      type: 'separator'
    }, {
      role: 'togglefullscreen'
    }]
  }, {
    label: 'Launcher',
    submenu: [{
      label: 'Launch Dwarf Fortress',
      accelerator: 'Option+Q',
      click: function () {
        launchDF()
      }
    }, {
      label: 'Launch DF and Close Launcher',
      accelerator: 'Option+Shift+Q',
      click: function () {
        launchDF()
        app.quit()
      }
    }, {
      type: 'separator'
    }, {
      label: 'Backup and Restore',
      submenu: [{
        label: 'View in Window',
        accelerator: 'CommandOrControl+D',
        click: function () {
          backupAndRestore()
        }
      }, {
        label: 'Backup Saves',
        accelerator: 'CommandOrControl+S',
        click: function () {
          backupSaves()
        }
      }, {
        label: 'Resore Saves',
        accelerator: 'CommandOrControl+Shift+S',
        click: function () {
          restoreSaves()
        }
      }, {
        label: 'Backup Configs',
        accelerator: 'CommandOrControl+E',
        click: function () {
          backupConfigs()
        }
      }, {
        label: 'Restore Configs',
        accelerator: 'CommandOrControl+Shift+E',
        click: function () {
          restoreConfigs()
        }
      }]
    }, {
      label: 'Fonts and Tilesets',
      accelerator: 'CommandOrControl+F',
      click: function () {
        fontsAndTilesets()
      }
    }, {
      label: 'Settings',
      submenu: [{
        label: 'View in Window',
        accelerator: 'CommandOrControl+G',
        click: function () {
          settings()
        }
      }, {
        label: 'Update Basic Settings',
        accelerator: 'CommandOrControl+Shift+G',
        click: function () {
          updateBasicSettings()
        }
      }, {
        label: 'Update init Settings',
        accelerator: 'CommandOrControl+R',
        click: function () {
          updateInitSettings()
        }
      }, {
        label: 'Update d_init Settings',
        accelerator: 'CommandOrControl+Shift+R',
        click: function () {
          updateD_initSettings()
        }
      }]
    }, {
      type: 'separator'
    }, {
      label: 'Toggle Advance Mode',
      accelerator: 'CommandOrControl+Shift+A',
      click: function () {
        toggleAdvancedMode()
      }
    }]
  }, {
    label: 'Window',
    submenu: [{
      role: 'minimize'
    }, {
      role: 'close'
    }]
  }, {
    role: 'help',
    submenu: []
  }
]

if (process.platform === 'darwin') {
  menuPlate.unshift({
    label: app.getName(),
    submenu: [{
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: 'Preferences',
      accelerator: 'CommandOrControl+,',
      click: function () {
        createPreferencesWindow()
      }
    }, {
      type: 'separator'
    }, {
      role: 'services',
      submenu: []
    }, {
      role: 'hide'
    }, {
      role: 'hideothers'
    }, {
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      role: 'quit'
    }]
  })
        // "Edit" menu
  menuPlate[1].submenu.push({
    type: 'separator'
  }, {
    label: 'Speech',
    submenu: [{
      role: 'startspeaking'
    }, {
      role: 'stopspeaking'
    }]
  })
        // "Window" menu
  menuPlate[4].submenu = [{
    label: 'Close',
    accelerator: 'CommandOrControl+W',
    role: 'close'
  }, {
    label: 'Minimize',
    accelerator: 'CommandOrControl+M',
    role: 'minimize'
  }, {
    label: 'Zoom',
    role: 'zoom'
  }, {
    type: 'separator'
  }, {
    label: 'Bring All to Front',
    role: 'front'
  }]
}

// Functions -------------------------------------------------------------------

String.prototype.capFirst = function() { // eslint-disable-line
  // [source](http://stackoverflow.com/a/1026087)
  return this.charAt(0).toUpperCase() + this.slice(1); // eslint-disable-line
}

// Electron functions

function newStartupWindow () {
  startupWindow = new BrowserWindow({
    width: 400,
    height: 700,
    resizable: false,
    fullscreenable: false
  })

  startupWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'firststartup.html'),
    protocol: 'file:',
    slashes: true
  }))

  startupWindow.on('closed', function () {
    startupWindow = null
  })
}

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 700,
    resizable: false,
    fullscreenable: false
  })

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function createPreferencesWindow () {
  preferencesWindow = new BrowserWindow({
    width: 400,
    height: 700,
    resizable: false,
    fullscreenable: false
  })

  preferencesWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'settings.html'),
    protocol: 'file:',
    slashes: true
  }))

  preferencesWindow.on('closed', function () {
    mainWindow = null
  })
}

function restart () {
    // from https://github.com/electron/electron/issues/3524
  var exec = require('child_process').exec
  exec(process.argv.join(' ')) // execute the command that was used to run the app
  app.quit() // quit the current app
}

// App functions

function ErrorGUI (message, options = {
  type: 'error',
  title: 'Error',
  detail: '',
  bWin: undefined
}, callback = function () {}) {
  options.message = message
  options.type = 'error'
  // log.debug(options.bWin)
  dialog.showMessageBox(options.bWin, options, callback)
}

function requestRestart (reason, options = {
  detail: ''
}) {
  log.verbose('Restart requested')
  options.message = reason
  options.type = 'question'
  options.buttons = ['Restart', 'No']
  options.defaultId = 0
  options.detail = 'Would you like to restart?'
  options.title = 'Restart'
  dialog.showMessageBox(options, (response) => {
    if (response === 0) { // if 'Yes' was clicked
      log.verbose('Restart accepted')
      restart()
    } else {
      log.verbose('Restart declined')
    }
  })
}

function updateDataContents () {
  let contents = fs.read(path.join(pathToData, 'contents.json'), 'json')
  log.verbose(contents)
  if (contents === undefined) {
    initData()
    contents = fs.read(path.join(pathToData, 'contents.json'), 'json')
  }

  contents.config = fs.find(path.join(pathToData, 'configs'), {
    matching: '[^.]*.tar.gz'
  })
  contents.fonts = fs.find(path.join(pathToData, 'fonts'), {
    matching: '[^.]*.ttf'
  })
  contents.tilesets = fs.find(path.join(pathToData, 'tilesets'), {
    matching: '[^.]+(*.png|*.bmp)'
  })
  contents.saves = fs.find(path.join(pathToData, 'saves'), {
    matching: '[^.]*.tar.gz'
  })

  contents.config.forEach(function (file, index, array) {
    array[index] = path.resolve(file) // pathToData + file.substr(file.indexOf("data/") + 4) // +4 to remove the "data" from the string
  })
  contents.fonts.forEach(function (file, index, array) {
    array[index] = path.resolve(file) // pathToData + file.substr(file.indexOf("data/") + 4) // +4 to remove the "data" from the string
  })
  contents.tilesets.forEach(function (file, index, array) {
    array[index] = path.resolve(file) // pathToData + file.substr(file.indexOf("data/") + 4) // +4 to remove the "data" from the string
  })
  contents.saves.forEach(function (file, index, array) {
    array[index] = path.resolve(file) // pathToData + file.substr(file.indexOf("data/") + 4) // +4 to remove the "data" from the string
  })
  log.verbose(contents)

  fs.write(path.join(pathToData, 'contents.json'), contents, {
    jsonIndent: 4
  })
  log.debug('Updated data/contents.json')
}

function selectFile (event, what) {
  let dirPath = what.split(' ')[0] === 'remove' ? path.join(pathToData, `${what.split(' ')[1]}s`) : ''
  let type = what.split(' ')[1]
  let title = `${what.split(' ')[0].capFirst()} ${type.capFirst()}`
  let button = what.capFirst()
  dialog.showOpenDialog(BrowserWindow.fromId(event.sender.id), {
    title: title,
    defaultPath: dirPath,
    buttonLabel: button,
    filters: [
      {name: 'Fonts', extensions: type === 'font' ? ['ttf'] : ['bmp', 'png']}
    ],
    properties: ['openFile'] // TODO: multiSelections
  }, files => {
    if (files) {
      files = files[0]
      // event.sender.send('selected-file', files, what)
      what.split(' ')[0] === 'remove' ? removeFontOrTileset(event, files, what) : addFontOrTilest(event, files, what)
    }
  })
}

function updateLaunchable (newState) {
  config.settings.df.launchable = newState
  updateConfigs(undefined, 'config', config)
  mainWindow.webContents.send('launchable', newState)
}

// Startup function (firststartup.js)

function selectDirectory (e, directory) { // directory: true for data, false for df
  let dirName
  if (directory) {
    dialog.showOpenDialog(BrowserWindow.fromId(e.sender.id), {
      title: 'Data Directory',
      properties: ['openDirectory', 'createDirectory']
    }, function (dir) {
      if (dir) {
        dir = dir[0]
        dirName = path.basename(dir)
        log.verbose(dir)
        log.verbose(dirName)
        e.sender.send('dir-selected', directory, dir, dirName)
      }
    })
  } else if (directory === false) {
    dialog.showOpenDialog(BrowserWindow.fromId(e.sender.id), {
      title: 'Dwarf Fortress Directory',
      properties: ['openDirectory', 'createDirectory']
    }, function (dir) {
      if (dir) {
        dir = dir[0]
        dirName = path.basename(dir)
        log.verbose(dir)
        log.verbose(dirName)
        e.sender.send('dir-selected', directory, dir, dirName)
      }
    })
  }
}

function startup (e, df) {
  let dataDir = pathToData
    // let dataDirName = data[1]
  let dfDir = df[0]
  let dfDirName = df[1]

  log.verbose('Running startup')

  log.verbose('dataDir ' + dataDir) // TODO: make this nicer (we don't need to join this 4 times)
  log.verbose('dataDirName ' + path.basename(dataDir))
  config.settings.data.dir.path = dataDir
  config.settings.data.dir.name = path.basename(dataDir)

  log.verbose('dfDir ' + dfDir)
  log.verbose('dfDirName ' + dfDirName)
  config.settings.df.dir.path = dfDir
  config.settings.df.dir.name = dfDirName

  config.startups++

  fs.write(pathToConfig, config, {
    jsonIndent: 4
  })

  restart()
}

function initData () {
  config.settings.data.dir.path = pathToData

  fs.write(pathToConfig, config, {
    jsonIndent: 4
  })

  fs.dir(path.join(pathToData, 'configs'))
  fs.dir(path.join(pathToData, 'df'))
  fs.dir(path.join(pathToData, 'fonts'))
  fs.dir(path.join(pathToData, 'saves'))
  fs.dir(path.join(pathToData, 'tilesets'))

  fs.write(path.join(pathToData, 'contents.json'), { // add blank contents.json
    config: '',
    fonts: '',
    tilesets: '',
    saves: ''
  }, {
    jsonIndent: 4
  })

    // Move the DF config helper files
  fs.copy(path.join(__dirname, 'assets', 'data', 'config.json'), path.join(pathToData, 'config.json'))
  fs.copy(path.join(__dirname, 'assets', 'data', 'd_config.json'), path.join(pathToData, 'd_config.json'))
  fs.copy(path.join(__dirname, 'assets', 'data', 'dconfigsupplement.txt'), path.join(pathToData, 'dconfigsupplement.txt'))

    // Move default DF font and tilesets to the data folder

  if (pathToDF !== '') {
    fs.find(path.join(pathToDF, 'data', 'art'), {
      matching: '[^.]*.ttf'
    }).forEach(function (font) {
      fs.copy(font, path.join(pathToData, 'fonts', path.basename(font)))
    })
    fs.find(path.join(pathToDF, 'data', 'art'), {
      matching: '[^.]@(*.png|*.bmp)'
    }).forEach(function (tileset) {
      if (tileset.indexOf('mouse') === -1) fs.copy(tileset, path.join(pathToData, 'tilesets', path.basename(tileset)))
    })
    const defaultTileset = fs.find(path.join(pathToDF, 'data', 'art'), {
      matching: 'curses_800x600.png'
    })[0]
    fs.copy(defaultTileset, path.join(pathToDF, 'data', 'art', 'tileset.png'))
  } else {
    log.verbose('pathToDF has not yet been defined.')
  }
}

// Launcher function (index.js)

function downloadDF (event, what) {
  log.debug('downloadDF')
  const version = what === 'newest' ? config.settings.df.downloads.newest.replace(/0\./gi, '').replace(/\./gi, '_') : what
  const platform = process.platform === 'darwin' ? 'osx' : process.platform === 'win32' ? 'win_s' : 'linux'
  const extention = process.platform === 'win32' ? '.zip' : '.tar.bz2'
  const downloadURL = `http://www.bay12games.com/dwarves/df_${version}_${platform}${extention}` // what === 'newest' ? 'true' : 'false' // http://www.bay12games.com/dwarves/df_43_04_win_s.zip
  log.debug(downloadURL)
  download(BrowserWindow.fromId(event.sender.id), downloadURL, {
    directory: path.join(pathToData, 'df')
  })
  .then((df) => {
    const destination = path.join(pathToData, 'df', `${version}_${Date.now()}`)
    log.verbose('Downloaded df!')
    decompress(df.getSavePath(), destination, { plugins: [ decompressTarbz2() ] })
    .then(files => {
      log.verbose(`DF decompressed at ${path.join(destination, files[0].path)}!`)
      /* const pathToDF = */ config.settings.df.dir.path = path.join(destination, files[0].path)
      event.sender.send('download-finished')
      updateLaunchable(true)
      requestRestart('You must restart now restart to use the downloaded version.')
    })
  })
  .catch(log.error)
}

function launchDF () {
  log.debug('launching df')
  // dfPath = pathToDF.replace(/ /gi, "\\ ")
  // log.debug(dfPath)
  log.debug(`"${path.join(pathToDF, 'df')}" ; exit;`)
  if (config.settings.df.launchable) {
    exec(`"${path.join(pathToDF, 'df')}" ; exit;`, function (error, out, err) {
      if (error) {
        log.error(error)
      } else {
        log.verbose('launchDF output ' + out)
      }
    })
  }
}

function backupSaves () {
  log.debug('Backing up saves...')
  let date = Date.now()
  log.debug(date)
  let saveLocation = fs.createWriteStream(path.join(pathToData, 'saves', date + '.tar.gz'))

  let archive = archiver('tar', {
    gzip: true,
    gzipOptions: {
      level: 1
    }
  })

  saveLocation.on('close', function () {
    log.verbose('saveLocation closed')
  })

  archive.on('error', function (error) {
    log.error(error)
    throw error // this will be **rude** if df hasn't been run at least once (the df/data/save doesn't exist until this)
  })

  saveLocation.on('open', function () {
    archive.pipe(saveLocation)
    archive
            .directory(path.join(pathToDF, 'data', 'save'))
            .finalize()
  })
  log.debug('Saves backed up.')
}

function restoreSaves (selectedSave) {
  log.debug('Restoring saves...')
  let save
  if (arguments.length > 0 && selectedSave !== '') {
    save = selectedSave
  } else {
    let saves = fs.find(path.join(pathToData, 'saves'), {
      matching: "['1', '2', '3', '4', '5', '6', '7', '8', '9']*.tar.gz"
    })
    saves.forEach(function (e, i) {
      saves[i] = e.substr(-20, 13)
    })
    log.verbose(saves)
    save = Math.max(...saves)
  }

  log.verbose(save)

  decompress(path.join(pathToData, 'saves', save + '.tar.gz'), {
    plugins: [
      decompressTargz()
    ]
  }).then(function (file) {
    log.verbose('Files decompressed')
  })
  log.debug('Saves restored')
}

function backupConfigs () {
  log.debug('Backing up configs...')
  log.debug(pathToDF)
  let date = Date.now()
  log.debug(date)
  let configLocation = fs.createWriteStream(path.join(pathToData, 'config', date + '.tar.gz'))

  let archive = archiver('tar', {
    gzip: true,
    gzipOptions: {
      level: 1
    }
  })

  configLocation.on('close', function () {
    log.verbose('configLocation closed')
  })

  archive.on('error', function (error) {
    log.error(error)
    throw error
  })

  configLocation.on('open', function () {
    archive.pipe(configLocation)
    archive
            .file(path.join(pathToDF, 'data', 'init', 'init.txt'))
            .file(path.join(pathToDF, 'data', 'init', 'd_init.txt'))
            .file(path.join(pathToData, 'config.json'))
            .file(path.join(pathToData, 'd_config.json'))
            .finalize()
  })
  log.debug('Configs backed up')
}

function restoreConfigs (selectedConfig) {
  log.debug('Restoring config...')
  let config
  if (arguments > 0 && selectedConfig !== '') {
    config = selectedConfig
  } else {
    let configs = fs.find(path.join(pathToData, 'configs'), {
      matching: "['1', '2', '3', '4', '5', '6', '7', '8', '9']*.tar.gz"
    })
    configs.forEach(function (e, i) {
      configs[i] = e.substr(-20, 13)
    })
    log.verbose(configs)
    config = Math.max(...configs)
  }

  log.verbose(config)

  decompress(path.join(pathToData, 'config', config + 'tar.gz'), {
    plugins: [
      decompressTargz()
    ]
  }).then(function (file) {
    log.verbose('Files decompressed')
  })
  log.debug('Config restored.')
}

function addFontOrTilest (event, files, what) {
  let type = what.split(' ')[1] + 's'
  fs.move(files, path.join(pathToData, type, path.basename(files)))
  event.sender.send('added-files', files, what)
}

function removeFontOrTileset (event, files, what) {
  if (path.dirname(path.dirname(files)) === pathToData) {
    fs.remove(files)
  } else {
    ErrorGUI(`${app.getName()} can only remove files in the data directory.`, {
      bWin: BrowserWindow.fromId(event.sender.id),
      details: `${files} is under ${path.dirname(path.dirname(files))} not ${pathToData}.`
    })
    log.error(`${files} is not in the data directory! Instead, it is here: ${path.dirname(path.dirname(files))}`)
  }
}

function chooseFont (e, font) {
  log.debug('Moving font...')
  fs.copy(font, path.join(pathToDF, 'data', 'art', 'font.ttf'), {
    overwrite: true
  })
  log.verbose(`Font (${font}) moved`)

  let newConfigs = config
  config.ui.usedFont = font

  log.verbose('config.ui.usedFont set')

  updateConfigs({}, 'config', newConfigs)
  log.verbose('configs updated')
  log.debug('Font moved')
}

function chooseTileset (e, tileset) {
  log.debug('Moving tileset...')
  let end = path.extname(tileset)
  log.verbose('Tileset filetype: ' + end)
  fs.copy(tileset, path.join(pathToDF, 'data', 'art', 'tileset' + end), {
    overwrite: true
  })
  log.verbose(`Tileset (${tileset}) moved`)

  let newConfigs = dfConfig
  newConfigs[6].value = `tileset${end}` // window font
  newConfigs[10].value = `tileset${end}` // fullscreen font
  newConfigs[15].value = `tileset${end}` // graphics window font
  newConfigs[18].value = `tileset${end}` // graphics fullscreen font

  updateConfigs({}, 'init', newConfigs)

  newConfigs = config
  config.ui.usedTileset = tileset

  updateConfigs({}, 'config', newConfigs)
  log.debug('Tileset moved')
  e.sender.reload()
}

function updateConfigs (e, which, newConfigs) {
  log.debug('updatingConfigs...')
  log.verbose('Update configs' + which)
  if (which === 'init') {
        // Update the config.json file
    fs.write(path.join(pathToData, 'config.json'), newConfigs, {
      jsonIndent: 4
    })
            // Update the init.txt file
    let inits = `Generated with ${app.getName()}. Use the launcher restore configs to restore.`
    newConfigs.forEach(function (config) {
      inits += '\n'
      inits += `[${config.field}:${config.value}]`
    })
    fs.write(path.join(pathToDF, 'data', 'init', 'init.txt'), inits)
  } else if (which === 'd_init') {
    let supplement = fs.read(dfdConfigSupplement)

        // Update the d_config.json file
    fs.write(path.join(pathToData, 'D_config.json'), newConfigs, {
      jsonIndent: 4
    })
            // Update the d_init.txt file
    let inits = `Generated with ${app.getName()}. Use the launcher restore configs to restore.`
    newConfigs.forEach(function (config) {
      inits += '\n'
      inits += `[${config.field}:${config.value}]`
    })
    fs.write(path.join(pathToDF, 'data', 'init', 'd_init.txt'), inits + supplement)
  } else if (which === 'config') {
    fs.write(pathToConfig, newConfigs, {
      jsonIndent: 4
    })
  } else {
    log.error("'which' is not defined in function 'updateConfigs'")
  }
  log.debug('Updated configs.')
}

// Menu function

function backupAndRestore () {
  mainWindow.webContents.send('backup-and-restore-menu')
}

function fontsAndTilesets () {
  mainWindow.webContents.send('fonts-and-tilesets-menu')
}

function settings () {
  mainWindow.webContents.send('settings-menu')
}

function updateBasicSettings () {
  mainWindow.webContents.send('update-basic-settings-menu')
}

function updateInitSettings () {
  mainWindow.webContents.send('update-init-settings-menu')
}

function updateD_initSettings () { // eslint-disable-line
  mainWindow.webContents.send('update-d_init-settings-menu')
}

function toggleAdvancedMode () {
  mainWindow.webContents.send('toggle-advanced-menu')
}

// App events ------------------------------------------------------------------

app.on('ready', function () {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuPlate))
  // if (config.startups !== 0) {
  //   log.verbose('Startups !== 0')
  //
  //   updateDataContents()
  //
  //   contents = require(path.join(pathToData, 'contents.json'))
  //   dfConfig = require(path.join(pathToData, 'config.json'))
  //   dfdConfig = require(path.join(pathToData, 'd_config.json'))
  //   dfdConfigSupplement = path.join(pathToData, 'dconfigsupplement.txt')
  //
  //   createWindow()
  // } else {
  //   log.verbose('Startups === 0')
  //   // newStartupWindow()
  // }
  updateDataContents()

  contents = require(path.join(pathToData, 'contents.json'))
  dfConfig = require(path.join(pathToData, 'config.json'))
  dfdConfig = require(path.join(pathToData, 'd_config.json'))
  dfdConfigSupplement = path.join(pathToData, 'dconfigsupplement.txt')

  config.settings.data.dir.path = pathToData
  updateConfigs(undefined, 'config', config)

  createWindow()

  mainWindow.webContents.on('did-finish-load', () => {
    updateLaunchable(config.settings.df.launchable)
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

// ipc events ------------------------------------------------------------------

// from index.js

ipc.on('launch-DF', launchDF)
ipc.on('backup-saves', backupSaves)
ipc.on('restore-saves', function (event, save) {
  restoreSaves(save)
})
ipc.on('backup-config', backupConfigs)
ipc.on('restore-config', function (event, config) {
  restoreConfigs(config)
})
ipc.on('choose-font', chooseFont)
ipc.on('choose-tileset', chooseTileset)
ipc.on('update-configs', updateConfigs)
ipc.on('reload-contents', updateDataContents)

// from firststartup.js

ipc.on('dirbtn-click', selectDirectory)
ipc.on('startup-fail', function () {
  log.debug('Startup failed.')
  restart()
})
ipc.on('startup-succeed', startup)

// from settings.js

ipc.on('select-file', selectFile)
ipc.on('download', downloadDF)

// log events

ipc.on('log-error', function (event, msg) {
  log.error('Renderer: ' + msg)
})
ipc.on('log-warn', function (event, msg) {
  log.warn('Renderer: ' + msg)
})
ipc.on('log-info', function (event, msg) {
  log.info('Renderer: ' + msg)
})
ipc.on('log-verbose', function (event, msg) {
  log.verbose('Renderer: ' + msg)
})
ipc.on('log-debug', function (event, msg) {
  log.debug('Renderer: ' + msg)
})
ipc.on('log-silly', function (event, msg) {
  log.silly('Renderer: ' + msg)
})
