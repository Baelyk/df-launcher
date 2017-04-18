// Load Electron and NodeJs modules --------------------------------------------

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const ipc = electron.ipcMain
const dialog = electron.dialog

const exec = require("child_process").exec
const fs = require("fs-jetpack")
const archiver = require("archiver")
const decompress = require("decompress")
const decompressTargz = require("decompress-targz")
const electronLog = require("electron-log")

const path = require('path')
const url = require('url')

// const pathToConfig = fs.find(path.join(__dirname, "assets", "config"), {
//     matching: "config.json"
// })

const pathToConfig = path.join(__dirname, "assets", "config", "config.json")
const config = require(pathToConfig)

// module settings that should be set now --------------------------------------

electronLog.transports.file.level = "silly" // allow all config messages into the log file. Use launcher to and log to determine which messages are passed

// Main process globals --------------------------------------------------------

const log = {
    error: function (msg) {
        electronLog.error(msg)
    },
    warn: function (msg) {
        electronLog.warn(msg)
    },
    info: function (msg) {
        if(config.settings.log.infoMode) electronLog.info(msg)
    },
    verbose: function (msg) {
        if(config.settings.log.verboseMode) electronLog.verbose(msg)
    },
    debug: function (msg) {
        if(config.settings.log.debugMode) electronLog.debug(msg)
    },
    silly: function (msg) {
        if(config.settings.log.sillyMode) electronLog.silly(msg)
    },
}

// Constants
const pathToDF = config.settings.df.dir.path
const pathToData = config.settings.data.dir.path

// "Constants"

let contents, dfConfig, dfdConfig, dfdConfigSupplement

log.verbose("pathToData: " + pathToData)
log.verbose("pathToDF: " + pathToDF)

// Variables
let mainWindow, startupWindow

// Menu ------------------------------------------------------------------------

let menuPlate = [{
        label: "Edit",
        submenu: [{
            role: "undo"
        }, {
            role: "redo"
        }, {
            type: "separator"
        }, {
            role: "cut"
        }, {
            role: "copy"
        }, {
            role: "paste"
        }, {
            role: "pasteandmatchstyle"
        }, {
            role: "delete"
        }, {
            role: "selectall"
        }]
    }, {
        label: "View",
        submenu: [{
            type: "separator"
        }, {
            role: "resetzoom"
        }, {
            role: "zoomin"
        }, {
            role: "zoomout"
        }, {
            type: "separator"
        }, {
            label: "Debug",
            submenu: [{
                role: "reload",
                accelerator: ""
            }, {
                role: "toggledevtools",
                accelerator: ""
            },]
        }, {
            type: "separator"
        }, {
            role: "togglefullscreen"
        }]
    }, {
        label: "Launcher",
        submenu: [{
            label: "Launch Dwarf Fortress",
            accelerator: "Option+Q",
            click: function () {
                launchDF()
            }
        }, {
            label: "Launch DF and Close Launcher",
            accelerator: "Option+Shift+Q",
            click: function () {
                launchDF()
                app.quit()
            }
        }, {
            type: "separator"
        }, {
            label: "Backup and Restore",
            submenu: [{
                label: "View in Window",
                accelerator: "CommandOrControl+D",
                click: function () {
                    backupAndRestore()
                }
            }, {
                label: "Backup Saves",
                accelerator: "CommandOrControl+S",
                click: function () {
                        backupSaves()
                    }
            }, {
                label: "Resore Saves",
                accelerator: "CommandOrControl+Shift+S",
                click: function () {
                    restoreSaves()
                    }
            }, {
                label: "Backup Configs",
                accelerator: "CommandOrControl+E",
                click: function () {
                    backupConfigs()
                    }
            }, {
                label: "Restore Configs",
                accelerator: "CommandOrControl+Shift+E",
                click: function () {
                    restoreConfigs()
                }
            }]
        }, {
            label: "Fonts and Tilesets",
            accelerator: "CommandOrControl+F",
            click: function () {
                fontsAndTilesets()
            },
            // submenu: [{
            //     label: "View in Window",
            //     accelerator: "CommandOrControl+F",
            //     // click: fontsAndTilesets()
            // }, {
            //     label: "Default Font",
            //     accerlator: "CommandOrControl+Shift+F",
            //     // click: defaultFont()
            // }, {
            //     label: "Default Tileset",
            //     accelerator: "CommandOrControl+Option+F",
            //     // click: defaultTileset()
            // }]
        }, {
            label: "Settings",
            submenu: [{
                label: "View in Window",
                accelerator: "CommandOrControl+G",
                click: function () {
                    settings()
                }
            }, {
                label: "Update Basic Settings",
                accelerator: "CommandOrControl+Shift+G",
                click: function () {
                    updateBasicSettings()
                }
            }, {
                label: "Update init Settings",
                accelerator: "CommandOrControl+R",
                click: function () {
                    updateInitSettings()
                }
            }, {
                label: "Update d_init Settings",
                accelerator: "CommandOrControl+Shift+R",
                click: function () {
                    updateD_initSettings()
                }
            }]
        }, {
            type: "separator"
        }, {
            label: "Toggle Advance Mode",
            accelerator: "CommandOrControl+Shift+A",
            click: function () {
                toggleAdvancedMode()
            }
        }]
    }, {
        label: "Window",
        submenu: [{
            role: "minimize"
        }, {
            role: "close"
        }]
    }, {
        role: "help",
        submenu: []
    }
]

if (process.platform === "darwin") {
    menuPlate.unshift({
            label: app.getName(),
            submenu: [{
                role: "about"
            }, {
                type: "separator"
            }, {
                role: "services",
                submenu: []
            }, {
                role: "hide"
            }, {
                role: "hideothers"
            }, {
                role: "unhide"
            }, {
                type: "separator"
            }, {
                role: "quit"
            }]
        })
        // "Edit" menu
    menuPlate[1].submenu.push({
            type: "separator"
        }, {
            label: "Speech",
            submenu: [{
                role: "startspeaking"
            }, {
                role: "stopspeaking"
            }]
        })
        // "Window" menu
    menuPlate[4].submenu = [{
        label: "Close",
        accelerator: "CommandOrControl+W",
        role: "close"
    }, {
        label: "Minimize",
        accelerator: "CommandOrControl+M",
        role: "minimize"
    }, {
        label: "Zoom",
        role: 'zoom'
    }, {
        type: "separator"
    }, {
        label: "Bring All to Front",
        role: "front"
    }]
}

// Functions -------------------------------------------------------------------

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

    startupWindow.on('closed', function() {
        startupWindow = null
    })
}

function createWindow() {
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

    mainWindow.on('closed', function() {
        mainWindow = null
    })
}

app.restart = function () {
    // from https://github.com/electron/electron/issues/3524
    var exec = require('child_process').exec
    exec(process.argv.join(' ')) // execute the command that was used to run the app
    app.quit() // quit the current app
}

// App functions

function updateDataContents() {
    let contents = fs.read(path.join(pathToData, "contents.json"), "json")
    log.verbose(contents)
    if(contents === undefined) {
        prepData()
        contents = fs.read(path.join(pathToData, "contents.json"), "json")
    }

    contents.config = fs.find(path.join(pathToData, "config"), {
        matching: "[^.]*\.tar\.gz"
    })
    contents.fonts = fs.find(path.join(pathToData, "fonts"), {
        matching: "[^.]*\.ttf"
    })
    contents.tilesets = fs.find(path.join(pathToData, "tilesets"), {
        matching: "[^.]+(*.png|*.bmp)"
    })
    contents.saves = fs.find(path.join(pathToData, "saves"), {
        matching: "[^.]*\.tar\.gz"
    })

    contents.config.forEach(function(file, index, array) {
        array[index] = path.resolve(file) // pathToData + file.substr(file.indexOf("data/") + 4) // +4 to remove the "data" from the string
    })
    contents.fonts.forEach(function(file, index, array) {
        array[index] = path.resolve(file) // pathToData + file.substr(file.indexOf("data/") + 4) // +4 to remove the "data" from the string
    })
    contents.tilesets.forEach(function(file, index, array) {
        array[index] = path.resolve(file) // pathToData + file.substr(file.indexOf("data/") + 4) // +4 to remove the "data" from the string
    })
    contents.saves.forEach(function(file, index, array) {
        array[index] = path.resolve(file) // pathToData + file.substr(file.indexOf("data/") + 4) // +4 to remove the "data" from the string
    })
    log.verbose(contents)

    fs.write(path.join(pathToData, "contents.json"), contents, {
        jsonIndent: 4
    })
    log.debug("Updated data/contents.json")
}

// Startup function (firststartup.js)

function selectDirectory (e, directory) { // directory: true for data, false for df
    let dirName
    if (directory) {
        dialog.showOpenDialog(BrowserWindow.fromId(e.sender.id), {
            title: "Data Directory",
            properties: ["openDirectory", "createDirectory"]
        }, function (dir) {
            if(dir) {
                dir = dir[0]
                dirName = path.basename(dir)
                log.verbose(dir)
                log.verbose(dirName)
                e.sender.send("dir-selected", directory, dir, dirName)
            }
        })
    } else if (directory === false) {
        dialog.showOpenDialog(BrowserWindow.fromId(e.sender.id), {
            title: "Dwarf Fortress Directory",
            properties: ["openDirectory", "createDirectory"]
        }, function (dir) {
            if(dir) {
                dir = dir[0]
                dirName = path.basename(dir)
                log.verbose(dir)
                log.verbose(dirName)
                e.sender.send("dir-selected", directory, dir, dirName)
            }
        })
    }
}

function startup (e, data, df) {
    let dataDir = data[0]
    let dataDirName = data[1]
    let dfDir = df[0]
    let dfDirName = df[1]

    log.verbose("Running startup")

    log.verbose("dataDir " + dataDir)
    log.verbose("dataDirName " + dataDirName)
    config.settings.data.dir.path = dataDir
    config.settings.data.dir.name = dataDirName

    log.verbose("dfDir " + dfDir)
    log.verbose("dfDirName " + dfDirName)
    config.settings.df.dir.path = dfDir
    config.settings.df.dir.name = dfDirName

    config.startups++

    fs.write(pathToConfig, config, {
        jsonIndent: 4
    })

    app.restart()
}

function prepData () {
    fs.write(path.join(config.settings.data.dir.path, "contents.json"), { // add blank contents.json
        config: "",
        fonts: "",
        tilesets: "",
        saves: ""
    }, {
        jsonIndent: 4
    })

    // Move the DF config helper files
    fs.copy(path.join(__dirname, "assets", "data", "config.json"), `${config.settings.data.dir.path}/config.json`)
    fs.copy(path.join(__dirname, "assets", "data", "d_config.json"), `${config.settings.data.dir.path}/d_config.json`)
    fs.copy(path.join(__dirname, "assets", "data", "dfconfigsupplement.txt"), `${config.settings.data.dir.path}/dconfigsupplement.txt`)

    // Move default DF font and tilesets to the data folder
    fs.find(path.join(config.settings.df.dir.path, "data", "art"), {
        matching: "[^.]*\.ttf"
    }).forEach(function (font) {
        fs.copy(font, path.join(config.settings.data.dir.path, "fonts", path.basename(font)))
    })
    fs.find(path.join(config.settings.df.dir.path, "data", "art"), {
        matching: "[^.]@(*.png|*.bmp)"
    }).forEach(function (tileset) {
        if (tileset.indexOf("mouse") === -1) fs.copy(tileset, path.join(config.settings.data.dir.path, "tilesets", path.basename(tileset)))
    })
    const defaultTileset = fs.find(path.join(config.settings.df.dir.path, "data", "art"), {
        matching: "curses_800x600.png"
    })[0]
    fs.copy(defaultTileset, path.join(config.settings.data.dir.path, "tilesets", "tileset.png"))
}

// Launcher function (index.js)

function launchDF() {
    log.debug("launching df")
    // dfPath = pathToDF.replace(/ /gi, "\\ ")
    // log.debug(dfPath)
    log.debug(`"${path.join(pathToDF, "df")}" ; exit;`)
    exec(`"${path.join(pathToDF, "df")}" ; exit;`, function(error, out, err) {
        if (error) {
            log.error(error)
        } else {
            log.verbose("launchDF output " + out)
        }
    })
}

function backupSaves() {
    log.debug("Backing up saves...")
    let date = Date.now()
    log.debug(date)
    let saveLocation = fs.createWriteStream(path.join(pathToData, "saves", date + ".tar.gz"))

    let archive = archiver("tar", {
        gzip: true,
        gzipOptions: {
            level: 1
        }
    })

    saveLocation.on("close", function() {
        log.verbose("saveLocation closed")
    })

    archive.on("error", function(error) {
        log.error(error)
        throw error // this will be **rude** if df hasn't been run at least once (the df/data/save doesn't exist until this)
    })

    saveLocation.on("open", function() {
        archive.pipe(saveLocation)
        archive
            .directory(path.join(pathToDF, "data", "save"))
            .finalize()
    })
    log.debug("Saves backed up.")
}

function restoreSaves(selectedSave) {
    log.debug("Restoring saves...")
    let save
    if(arguments.length > 0 && selectedSave !== "") {
        save = selectedSave
    } else {
        let saves = fs.find(path.join(pathToData, "saves"), {
            matching: "['1', '2', '3', '4', '5', '6', '7', '8', '9']*.tar.gz"
        })
        saves.forEach(function(e, i) {
            saves[i] = e.substr(-20, 13)
        })
        log.verbose(saves)
        save = Math.max(...saves)
    }

    log.verbose(save)

    decompress(path.join(pathToData, "saves", save + ".tar.gz"), {
        plugins: [
            decompressTargz()
        ]
    }).then(function(file) {
        log.verbose("Files decompressed")
    })
    log.debug("Saves restored")
}

function backupConfigs() {
    log.debug("Backing up configs...")
    log.debug(pathToDF)
    let date = Date.now()
    log.debug(date)
    let configLocation = fs.createWriteStream(path.join(pathToData, "config", date + ".tar.gz"))

    let archive = archiver("tar", {
        gzip: true,
        gzipOptions: {
            level: 1
        }
    })

    configLocation.on("close", function() {
        log.verbose("configLocation closed")
    })

    archive.on("error", function(error) {
        log.error(error)
        throw error
    })

    configLocation.on("open", function() {
        archive.pipe(configLocation)
        archive
            .file(path.join(pathToDF, "data", "init", "init.txt"))
            .file(path.join(pathToDF, "data", "init", "d_init.txt"))
            .file(path.join(pathToData, "config.json"))
            .file(path.join(pathToData, "d_config.json"))
            .finalize()
    })
    log.debug("Configs backed up")
}

function restoreConfigs(selectedConfig) {
    log.debug("Restoring config...")
    let config
    if(arguments > 0 && selectedConfig !== "") {
        config = selectedConfig
    } else {
        let configs = fs.find(path.join(pathToData, "config"), {
            matching: "['1', '2', '3', '4', '5', '6', '7', '8', '9']*.tar.gz"
        })
        configs.forEach(function(e, i) {
            configs[i] = e.substr(-20, 13)
        })
        log.verbose(configs)
        config = Math.max(...configs)
    }

    log.verbose(config)

    decompress(path.join(pathToData, "config", config + "tar.gz"), {
        plugins: [
            decompressTargz()
        ]
    }).then(function(file) {
        log.verbose("Files decompressed")
    })
    log.debug("Config restored.")
}

function chooseFont(e, font) {
    log.debug("Moving font...")
    fs.copy(font, path.join(pathToDF, "data", "art", "font.ttf"), {
        overwrite: true
    })
    log.verbose(`Font (${font}) moved`)

    let newConfigs = config
    config.ui.usedFont = font

    log.verbose("config.ui.usedFont set")

    updateConfigs({}, "config", newConfigs)
    log.verbose("configs updated")
    log.debug("Font moved")
}

function chooseTileset(e, tileset) {
    log.debug("Moving tileset...")
    let end = path.extname(tileset)
    log.verbose("Tileset filetype: " + end)
    fs.copy(tileset, path.join(pathToDF, "data", "art", "tileset" + end), {
        overwrite: true
    })
    log.verbose(`Tileset (${tileset}) moved`)

    let newConfigs = dfConfig
    newConfigs[6].value = `tileset${end}` // window font
    newConfigs[10].value = `tileset${end}` // fullscreen font
    newConfigs[15].value = `tileset${end}` // graphics window font
    newConfigs[18].value = `tileset${end}` // graphics fullscreen font

    updateConfigs({}, "init", newConfigs)

    newConfigs = config
    config.ui.usedTileset = tileset

    updateConfigs({}, "config", newConfigs)
    log.debug("Tileset moved")
    e.sender.reload()
}

function updateConfigs(e, which, newConfigs) {
    log.debug("updatingConfigs...")
    log.verbose("Update configs" + which)
    if (which == "init") {
        // Update the config.json file
        fs.write(path.join(pathToData, "config.json"), newConfigs, {
                jsonIndent: 4
            })
            // Update the init.txt file
        let inits = `Generated with ${app.getName()}. Use the launcher restore configs to restore.`
        newConfigs.forEach(function(config) {
            inits += "\n"
            inits += `[${config.field}:${config.value}]`
        })
        fs.write(path.join(pathToDF, "data", "init", "init.txt"), inits)
    } else if (which == "d_init") {
        let supplement = fs.read(dfdConfigSupplement)

        // Update the d_config.json file
        fs.write(path.join(pathToData, "D_config.json"), newConfigs, {
                jsonIndent: 4
            })
            // Update the d_init.txt file
        let inits = `Generated with ${app.getName()}. Use the launcher restore configs to restore.`
        newConfigs.forEach(function(config) {
            inits += "\n"
            inits += `[${config.field}:${config.value}]`
        })
        fs.write(path.join(pathToDF, "data", "init", "d_init.txt"), inits + supplement)
    } else if (which == "config") {
        fs.write(path.join(__dirname, "assets", "config", "config.json"), newConfigs, {
            jsonIndent: 4
        })
    } else {
        log.error("'which' is not defined in function 'updateConfigs'")
    }
    log.debug("Updated configs.")
}

// Menu function

function backupAndRestore() {
    mainWindow.webContents.send("backup-and-restore-menu")
}

function fontsAndTilesets() {
    mainWindow.webContents.send("fonts-and-tilesets-menu")
}

function settings() {
    mainWindow.webContents.send("settings-menu")
}

function updateBasicSettings() {
    mainWindow.webContents.send("update-basic-settings-menu")
}

function updateInitSettings() {
    mainWindow.webContents.send("update-init-settings-menu")
}

function updateD_initSettings() {
    mainWindow.webContents.send("update-d_init-settings-menu")
}

function toggleAdvancedMode() {
    mainWindow.webContents.send("toggle-advanced-menu")
}

// App events ------------------------------------------------------------------

app.on('ready', function () {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuPlate))
    if(config.startups !== 0) {
        log.verbose("Startups !== 0")

        fs.dir(path.join(pathToData, "config"))
        fs.dir(path.join(pathToData, "fonts"))
        fs.dir(path.join(pathToData, "saves"))
        fs.dir(path.join(pathToData, "tilesets"))

        updateDataContents()

        contents = require(path.join(pathToData, "contents.json"))
        dfConfig = require(path.join(pathToData, "config.json"))
        dfdConfig = require(path.join(pathToData, "d_config.json"))
        dfdConfigSupplement = path.join(pathToData, "dconfigsupplement.txt")

        createWindow()
    } else {
        log.verbose("Startups === 0")
        newStartupWindow()
    }
})

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow()
    }
})

// ipc events ------------------------------------------------------------------

// from index.js

ipc.on("launch-DF", launchDF)
ipc.on("backup-saves", backupSaves)
ipc.on("restore-saves", function (event, save) {
    restoreSaves(save)
})
ipc.on("backup-config", backupConfigs)
ipc.on("restore-config", function (event, config) {
    restoreConfigs(config)
})
ipc.on("choose-font", chooseFont)
ipc.on("choose-tileset", chooseTileset)
ipc.on("update-configs", updateConfigs)
ipc.on("reload-contents", updateDataContents)

// from firststartup.js

ipc.on("dirbtn-click", selectDirectory)
ipc.on("startup-fail", function () {
    log.debug("Startup failed.")
    app.restart()
})
ipc.on("startup-succeed", startup)

// log events

ipc.on("log-error", function (event, msg) {
    log.error("Renderer: " + msg)
})
ipc.on("log-warn", function (event, msg) {
    log.warn("Renderer: " + msg)
})
ipc.on("log-info", function (event, msg) {
    log.info("Renderer: " + msg)
})
ipc.on("log-verbose", function (event, msg) {
    log.verbose("Renderer: " + msg)
})
ipc.on("log-debug", function (event, msg) {
    log.debug("Renderer: " + msg)
})
ipc.on("log-silly", function (event, msg) {
    log.silly("Renderer: " + msg)
})
