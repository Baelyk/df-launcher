/*
This file is for firststartup.html, when the app is first started and needs to
be configured
*/

const ipc = require("electron").ipcRenderer // Not be a hermit

const log = { // This is the logging function so that I get logs when testing and in "production"
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

let datadiv = document.querySelector("#data")
let dfdiv = document.querySelector("#df")
let restartdiv = document.querySelector("r#estart")
let restartbtn = document.querySelector("#restart button")
let databtn = document.querySelector("#data button")
let dfbtn = document.querySelector("#df button")
let datadirspan = document.querySelector("#data-dir")
let dfdirspan = document.querySelector("#df-dir")

let datadir, datadirname, dfdir, dfdirnamr

// Functions -------------------------------------------------------------------

// For IPC events

function dirSelected (e, directory, dir, dirName) {
    if (directory) {
        datadir = dir
        datadirname = dirName
        datadirspan.innerHTML = `<span class="bold">${dirName}:</span> ${dir}`
    } else if (directory === false) {
        dfdir = dir
        dfdirname = dirName
        dfdirspan.innerHTML = `<span class="bold">${dirName}:</span> ${dir}`
    }
}

// IPC events ------------------------------------------------------------------

ipc.on("dir-selected", dirSelected)

// Event listeners -------------------------------------------------------------

databtn.addEventListener("click", function () {
    ipc.send("dirbtn-click", true)
})

dfbtn.addEventListener("click", function () {
    ipc.send("dirbtn-click", false)
})

restartbtn.addEventListener("click", function () {
    if(datadir === undefined || datadirname === undefined || dfdir === undefined || dfdirname === undefined) {
        console.log("Startup failed because one of the directories (or its name) value was undefined.")
        // ipc.send("startup-fail")
    } else {
        console.log("Startup succeeded (because you followed the directions)!")
        ipc.send("startup-succeed", [dfdir, dfdirname])
    }
})
