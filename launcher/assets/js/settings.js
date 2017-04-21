const ipc = require("electron").ipcRenderer
const path = require("path")

const log = {
    error: function (msg) {
        ipc.send("log-error", msg)
    },
    warn: function (msg) {
        ipc.send("log-warn", msg)
    },
    info: function (msg) {
        ipc.send("log-info", msg)
    },
    verbose: function (msg) {
        ipc.send("console.log", msg)
    },
    debug: function (msg) {
        ipc.send("console.log", msg)
    },
    silly: function (msg) {
        ipc.send("log-silly", msg)
    },
}

const config = require(path.join(__dirname, "..", "config", "config.json"))
const pathToDF = config.settings.df.dir.path
const pathToData = config.settings.data.dir.path
const contents = require(path.join(pathToData, "contents.json"))
const dfConfig = require(path.join(pathToData, "config.json"))
const dfdConfig = require(path.join(pathToData, "d_config.json"))
