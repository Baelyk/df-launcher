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

// const path = __dirname.replace("/assets/js", "") // __dirname includes /assets/js
const config = require(path.join(__dirname, "..", "config", "config.json"))
const pathToDF = config.settings.df.dir.path
const pathToData = config.settings.data.dir.path
// const pathToDF = "/Volumes/Untitled 1/Programs/Games/Dwarf Fortress/Dwarf Fortress Launcher/df_43_05_osx"
// const pathToData = "/Volumes/Untitled 1/Programs/Games/Dwarf Fortress/Dwarf Fortress Launcher/data"
const contents = require(path.join(pathToData, "contents.json"))
const dfConfig = require(path.join(pathToData, "config.json"))
const dfdConfig = require(path.join(pathToData, "d_config.json"))


let launchDFbtn = document.getElementById("launchDF")
let backupSavesbtn = document.getElementById("backupSaves")
let saveSelect = document.getElementById("save-select")
let restoreSavesbtn = document.getElementById("restoreSaves")
let backupConfigbtn = document.getElementById("backupConfig")
let configSelect = document.getElementById("config-select")
let restoreConfigbtn = document.getElementById("restoreConfig")
let fontform = document.getElementById("font-form")
let fontoptions = document.getElementById("font-options")
let chooseFontbtn = document.getElementById("chooseFont")
let tilesetform = document.getElementById("tileset-form")
let tilesetoptions = document.getElementById("tileset-options")
let chooseTilesetbtn = document.getElementById("chooseTileset")
let basicdfconfigDiv = document.getElementById("basicdfconfig-div")
let basicdfconfigForm = document.getElementById("basicdfconfig-form")
let basicdfconfigOptions = document.getElementById("basicdfconfig-options")
let basicdfconfigbtn = document.getElementById("basicdfconfig-submit")
let dfconfigDiv = document.getElementById("dfconfig-div")
let dfconfigForm = document.getElementById("dfconfig-form")
let dfconfigOptions = document.getElementById("dfconfig-options")
let dfconfigbtn = document.getElementById("dfconfig-submit")
let dfconfigCategory = document.getElementById("dfconfig-category")
let dfdconfigDiv = document.getElementById("dfdconfig-div")
let dfdconfigForm = document.getElementById("dfdconfig-form")
let dfdconfigOptions = document.getElementById("dfdconfig-options")
let dfdconfigbtn = document.getElementById("dfdconfig-submit")
let dfdconfigCategory = document.getElementById("dfdconfig-category")
let reloadContents = document.getElementById("reloadContents")
let toggleAdvanced = document.getElementById("toggleAdvanced")
let backupToggle = document.getElementById("view-backup")
let backupControl = document.getElementById("backups")
let ftToggle = document.getElementById("view-ft")
let ftControl = document.getElementById("fontandtileset")
let settingsToggle = document.getElementById("view-settings")
let settingsControl = document.getElementById("settings")
let description = document.getElementById("description")

let checkboxes = []

const dfconfigOptionsContent = dfconfigDiv.innerHTML
const dfdconfigOptionsContent = dfdconfigDiv.innerHTML

function* interator (arr) {
    let key = arr.length -1

    while(key >= 0) {
        yield key
        key -= 1
    }
}

function populateOptions() {
    console.log("Populating options")
    console.log("Font options")
    let options = []
    contents.fonts.forEach(function(e) {
        options.push(path.basename(e, ".ttf"))
    })
    options.forEach(function(e, i) {
        let selected = config.ui.usedFont == contents.fonts[i] ? "selected" : ""
        fontoptions.innerHTML += `<option value="${contents.fonts[i]}" ${selected}>${e}</option>`
    })
    console.log(options)

    console.log("Tileset options")
    options = []
    contents.tilesets.forEach(function(e) {
        options.push(path.basename(e, path.extname(e)))
    })
    options.forEach(function(e, i) {
        let selected = config.ui.usedTileset == contents.tilesets[i] ? "selected" : ""
        tilesetoptions.innerHTML += `<option value="${contents.tilesets[i]}" ${selected}>${e}</option>`
    })
    console.log(options)

    console.log("Save options")
    options = []
    let recentestSave = []
    contents.saves.forEach(function(e) {
        let save = path.basename(e, ".tar.gz")
        log.info(save)
        if(/\d\d\d\d\d\d\d\d\d\d\d\d\d/.test(save)) {
            recentestSave.push(save)
            let date = new Date(+save)
            save = date.toLocaleString()
        }

        options.push(save)
    })
    recentestSave = recentestSave.indexOf(Math.max(...recentestSave).toString())
    options.forEach(function(e, i) {
        let selected = recentestSave == i ? "selected" : ""
        saveSelect.innerHTML += `<option value="${contents.saves[i]}" ${selected}>${e}</option>`
    })

    console.log(options)

    console.log("Config options")
    options = []
    let recentestConfig = []
    contents.config.forEach(function(e) {
        let config = path.basename(e, ".tar.gz")
        if(/\d\d\d\d\d\d\d\d\d\d\d\d\d/.test(config)) {
            recentestConfig.push(config)
            let date = new Date(+config)
            config = date.toLocaleString()
        }

        options.push(config)
    })
    recentestConfig = recentestConfig.indexOf(Math.max(...recentestConfig).toString())
    options.forEach(function(e, i) {
        let selected = recentestConfig == i ? "selected" : ""
        configSelect.innerHTML += `<option value="${contents.config[i]}" ${selected}>${e}</option>`
    })
    console.log(options)
}

function populateConfigCategories() {
    dfconfigCategory.innerHTML = `<option value="0">Select category...</option>`
    config.ui.categories.init.forEach(function(category) {
        dfconfigCategory.innerHTML += `<option value="${category.tag}">${category.name}</option>`
    })
    dfdconfigCategory.innerHTML = `<option value="0">Select category...</option>`
    config.ui.categories.d_init.forEach(function(category) {
        dfdconfigCategory.innerHTML += `<option value="${category.tag}">${category.name}</option>`
    })
}

function checkboxToggle() {
    let chbxs = [...document.getElementsByClassName('dfconfigbool')].map(function(option, i) {
        // convert HTMLCollection to JSON string
        // then convert the JSON string to JSON
        return JSON.parse(JSON.stringify({
            tag: option.tagName,
            type: option.type,
            checked: option.checked,
            field: option.id,
            value: option.value
        }))
    })
    console.log(chbxs)
    chbxs.forEach(function (chbx) {
        let checkbox = document.getElementById(chbx.field)
        if(checkboxes.indexOf(checkbox) < 0) {
            checkboxes.push(checkbox)
            const here = checkbox.parentNode.innerHTML.indexOf(`<span class="option-info-span ${chbx.field}-info"`)
            checkbox.parentNode.innerHTML = checkbox.parentNode.innerHTML.substr(0, checkbox.parentNode.innerHTML.length - checkbox.parentNode.innerHTML.substr(here).length) + `<label id="${chbx.field}-label" class="toggle" for="${checkbox.id}"></label>` + checkbox.parentNode.innerHTML.substr(here)
            let label = document.getElementById(`${chbx.field}-label`)
            if(checkbox.checked) {
                label.innerHTML = "<i class=\"fa fa-toggle-on yes\" aria-hidden=\"true\"></i>"
            } else {
                label.innerHTML = "<i class=\"fa fa-toggle-off no\" aria-hidden=\"true\"></i>"
            }
            console.log(label)
            label.addEventListener("click", function (event) {
                let box = document.getElementById(event.target.parentNode.id.substr(0, event.target.parentNode.id.length - 6))
                if(!box.checked) {
                    label.innerHTML = "<i class=\"fa fa-toggle-on yes\" aria-hidden=\"true\"></i>"
                } else {
                    label.innerHTML = "<i class=\"fa fa-toggle-off no\" aria-hidden=\"true\"></i>"
                }
            })
        }
    })
}

function basicSettings() {
    let options = []
    config.basicSettings.init.forEach(function(e) {
        options.push(dfConfig[e])
    })
    config.basicSettings.d_init.forEach(function(e) {
        options.push(dfdConfig[e])
    })
    console.log(options)
    configOptions(basicdfconfigOptions, options)
}

function configOptions(where, config) {
    let basicConfigAddOn = where == basicdfconfigOptions ? "-basic" : ""
    let options = ""
    config.forEach(function(option) {
        let disabled = option.meta === undefined ? "" : (option.meta.disabled ? "disabled" : "")
        options += `<span id="${option.field}${basicConfigAddOn}-span">${option.name}: `
        if (option.meta !== undefined) {
            if (option.meta.manyArgs) {
                option.meta.args.forEach(function(subOption) {
                    if (subOption.options.type == "num") {
                        console.log("It's a number")
                        options += `<input ${disabled} type="number" class="dfconfignum" id="${option.field}${basicConfigAddOn}" value="${subOption.value}">`
                    } else if (subOption.options.type == "multi") {
                        console.log("It's a multi")
                        options += `<select ${disabled} class="dfconfigmulti" id="${option.field}${basicConfigAddOn}">`
                        option.options.options.forEach(function(opt) {
                            let selected = opt == option.value ? "selected" : ""
                            options += `<option value="${opt}" ${selected}>${opt}</option>`
                        })
                        options += `</select>`
                    } else if (subOption.options.type == "bool") {
                        console.log("It's a boolean")
                        let checked = subOption.value == "YES" ? "checked" : ""
                        console.log("checked: " + subOption.value + " " + checked)
                        options += `<input type="checkbox" class="dfconfigbool" id="${option.field}${basicConfigAddOn}" value="${option.field}" ${checked}>`
                    } else if (subOption.options.type == "string") {
                        console.log("It's a string")
                        options += `<input ${disabled} type="text" class="dfconfigstring" id="${option.field}${basicConfigAddOn}" value="${subOption.value}">`
                    } else {
                        console.error("option.options.type is neither num, multi, or string!")
                    }
                })
                options += `<span class="option-info-span ${option.field}-info" id="${option.field}${basicConfigAddOn}-info"><i class="option-info fa fa-info-circle" aria-hidden="true" title="${option.description}"></i></span><br></span>`
            } else {
                if (option.options.type == "num") {
                    console.log("It's a number")
                    options += `<input ${disabled} type="number" class="dfconfignum" id="${option.field}${basicConfigAddOn}" value="${option.value}">`
                } else if (option.options.type == "multi") {
                    console.log("It's a multi")
                    options += `<select ${disabled} class="dfconfigmulti" id="${option.field}${basicConfigAddOn}">`
                    option.options.options.forEach(function(opt) {
                        let selected = opt == option.value ? "selected" : ""
                        options += `<option value="${opt}" ${selected}>${opt}</option>`
                    })
                    options += `</select>`
                } else if (option.options.type == "bool") {
                    console.log("It's a boolean")
                    let checked = option.value == "YES" ? "checked" : ""
                    console.log("checked: " + option.value + " " + checked)
                    options += `<input type="checkbox" class="dfconfigbool" id="${option.field}${basicConfigAddOn}" value="${option.field}" ${checked}>`
                } else if (option.options.type == "string") {
                    console.log("It's a string")
                    options += `<input ${disabled} type="text" class="dfconfigstring" id="${option.field}${basicConfigAddOn}" value="${option.value}">`
                } else {
                    console.error("option.options.type is neither num, multi, or string!")
                }
                options += `<span class="option-info-span ${option.field}-info" id="${option.field}${basicConfigAddOn}-info"><i class="option-info fa fa-info-circle" aria-hidden="true" title="${option.description}"></i></span><br></span>`
            }
        } else {
            if (option.options.type == "num") {
                console.log("It's a number")
                options += `<input ${disabled} type="number" class="dfconfignum" id="${option.field}${basicConfigAddOn}" value="${option.value}">`
            } else if (option.options.type == "multi") {
                console.log("It's a multi")
                options += `<select ${disabled} class="dfconfigmulti" id="${option.field}${basicConfigAddOn}">`
                option.options.options.forEach(function(opt) {
                    let selected = opt == option.value ? "selected" : ""
                    options += `<option value="${opt}" ${selected}>${opt}</option>`
                })
                options += `</select>`
            } else if (option.options.type == "bool") {
                console.log("It's a boolean")
                let checked = option.value == "YES" ? "checked" : ""
                console.log("checked: " + option.value + " " + checked)
                options += `<input type="checkbox" class="dfconfigbool" id="${option.field}${basicConfigAddOn}" value="${option.field}" ${checked}>`
            } else if (option.options.type == "string") {
                console.log("It's a string")
                options += `<input ${disabled} type="text" class="dfconfigstring" id="${option.field}${basicConfigAddOn}" value="${option.value}">`
            } else {
                console.error("option.options.type is neither num, multi, or string!")
            }
            options += `<span class="option-info-span ${option.field}${basicConfigAddOn}-info" id="${option.field}${basicConfigAddOn}-info"><i class="option-info fa fa-info-circle" aria-hidden="true" title="${option.description}"></i></span><br></span>`
        }
    })
    if (where === true) {
        dfconfigOptions.innerHTML = options
    } else if (where === false) {
        dfdconfigOptions.innerHTML = options
    } else {
        where.innerHTML = options
    }
    checkboxToggle()
}

function updateConfigs(init) {
    console.log("Update configs")
    if (init) {
        // let newConfigs = require(`${pathToData}/config.json`)
        let newConfigs = dfConfig
        let options = [...dfconfigOptions.getElementsByTagName("*")].map(function(option, i) {
            // convert HTMLCollection to JSON string
            // then convert the JSON string to JSON
            return JSON.parse(JSON.stringify({
                tag: option.tagName,
                type: option.type,
                checked: option.checked,
                field: option.id,
                value: option.value
            }))
        })

        let optionFieldMap = newConfigs.map(function(el) {
            return el.field
        })

        for(let i of interator(options)) {
            if(options[i].tag == "BR" || options[i].tag == "SPAN" || options[i].tag == "OPTION" || options[i].tag == "I" || options[i].tag == "LABEL") {
                options.splice(i, 1)
            }
        }

        options.forEach(function(option, index) {
            let i = optionFieldMap.indexOf(option.field)
            if (newConfigs[i].meta !== undefined) {
                if (newConfigs[i].meta.manyArgs) {
                    let configValue = ""
                    for (let j = 0; j < newConfigs[i].meta.args.length; j++) {
                        if (option.type == "checkbox") {
                            // console.log(option.field + " " + option.value + " " + option.type)
                            // console.log(option.checked)
                            newConfigs[i].meta.args[j].value = options[index].checked ? "YES" : "NO"
                            configValue += (options[index].checked ? "YES" : "NO") + ":"
                                // console.log(newConfigs[i].value)
                        } else {
                            // console.log(option.field + " " + option.value + " " + option.type)
                            newConfigs[i].meta.args[j].value = options[index].value
                            configValue += options[index].value + ":"
                                // console.log(newConfigs[i].value)
                        }
                        options.splice(index + j, 1)
                    }
                    configValue = configValue.substr(0, configValue.length - 1)
                    newConfigs[i].value = configValue
                } else {
                    if (option.type == "checkbox") {
                        // console.log(option.field + " " + option.value + " " + option.type)
                        // console.log(option.checked)
                        newConfigs[i].value = option.checked ? "YES" : "NO"
                            // console.log(newConfigs[i].value)
                    } else {
                        // console.log(option.field + " " + option.value + " " + option.type)
                        newConfigs[i].value = option.value
                            // console.log(newConfigs[i].value)
                    }
                }
            } else {
                if (option.type == "checkbox") {
                    // console.log(option.field + " " + option.value + " " + option.type)
                    // console.log(option.checked)
                    newConfigs[i].value = option.checked ? "YES" : "NO"
                        // console.log(newConfigs[i].value)
                } else {
                    // console.log(option.field + " " + option.value + " " + option.type)
                    newConfigs[i].value = option.value
                        // console.log(newConfigs[i].value)
                }
            }
        })
        return newConfigs
    } else {
        // let newConfigs = require(`${pathToData}/config.json`)
        let newConfigs = dfdConfig
        let options = [...dfdconfigOptions.getElementsByTagName("*")].map(function(option) {
            // convert HTMLCollection to JSON string
            // then convert the JSON string to JSON
            return JSON.parse(JSON.stringify({
                tag: option.tagName,
                type: option.type,
                checked: option.checked,
                field: option.id,
                value: option.value
            }))
        })

        let optionFieldMap = newConfigs.map(function(el) {
            return el.field
        })

        for(let i of interator(options)) {
            if(options[i].tag == "BR" || options[i].tag == "SPAN" || options[i].tag == "OPTION" || options[i].tag == "I" || options[i].tag == "LABEL") {
                options.splice(i, 1)
            }
        }

        options.forEach(function(option, index) {
            let i = optionFieldMap.indexOf(option.field)
            if (newConfigs[i].meta !== undefined) {
                if (newConfigs[i].meta.manyArgs) {
                    let configValue = ""
                    for (let j = 0; j < newConfigs[i].meta.args.length; j++) {
                        if (option.type == "checkbox") {
                            // console.log(option.field + " " + option.value + " " + option.type)
                            // console.log(option.checked)
                            newConfigs[i].meta.args[j].value = options[index].checked ? "YES" : "NO"
                            configValue += (options[index].checked ? "YES" : "NO") + ":"
                                // console.log(newConfigs[i].value)
                        } else {
                            // console.log(option.field + " " + option.value + " " + option.type)
                            newConfigs[i].meta.args[j].value = options[index].value
                            configValue += options[index].value + ":"
                                // console.log(newConfigs[i].value)
                        }
                        options.splice(index + j, 1)
                    }
                    configValue = configValue.substr(0, configValue.length - 1)
                    newConfigs[i].value = configValue
                } else {
                    if (option.type == "checkbox") {
                        // console.log(option.field + " " + option.value + " " + option.type)
                        // console.log(option.checked)
                        newConfigs[i].value = option.checked ? "YES" : "NO"
                            // console.log(newConfigs[i].value)
                    } else {
                        // console.log(option.field + " " + option.value + " " + option.type)
                        newConfigs[i].value = option.value
                            // console.log(newConfigs[i].value)
                    }
                }
            } else {
                if (option.type == "checkbox") {
                    // console.log(option.field + " " + option.value + " " + option.type)
                    // console.log(option.checked)
                    newConfigs[i].value = option.checked ? "YES" : "NO"
                        // console.log(newConfigs[i].value)
                } else {
                    // console.log(option.field + " " + option.value + " " + option.type)
                    newConfigs[i].value = option.value
                        // console.log(newConfigs[i].value)
                }
            }
        })

        console.log(newConfigs)

        return newConfigs
    }
}

function updateBasicSettings() {
    let newConfigs = dfConfig
    let newDConfigs = dfdConfig

    let options = [...basicdfconfigOptions.getElementsByTagName("*")].map(function(option, i) {
        // convert HTMLCollection to JSON string
        // then convert the JSON string to JSON
        return JSON.parse(JSON.stringify({
            tag: option.tagName,
            type: option.type,
            checked: option.checked,
            field: option.id.substr(0, option.id.length - 6),
            value: option.value
        }))
    })

    let optionFieldMapInit = newConfigs.map(function(el) {
        return el.field
    })
    let optionFieldMapD_Init = newDConfigs.map(function(el) {
        return el.field
    })

    for(let i of interator(options)) {
        if(options[i].tag == "BR" || options[i].tag == "SPAN" || options[i].tag == "OPTION" || options[i].tag == "I" || options[i].tag == "LABEL") {
            options.splice(i, 1)
        }
    }

    console.log(options)

    options.forEach(function(option, index) {
        newConfigs.forEach(function(el) {
            if (option.field == el.field) {
                console.log(option.field)
                let i = optionFieldMapInit.indexOf(option.field)
                console.log(i)
                if (newConfigs[i].meta !== undefined) {
                    if (newConfigs[i].meta.manyArgs) {
                        let configValue = ""
                        for (let j = 0; j < newConfigs[i].meta.args.length; j++) {
                            if (option.type == "checkbox") {
                                // console.log(option.field + " " + option.value + " " + option.type)
                                // console.log(option.checked)
                                newConfigs[i].meta.args[j].value = options[index].checked ? "YES" : "NO"
                                configValue += (options[index].checked ? "YES" : "NO") + ":"
                                    // console.log(newConfigs[i].value)
                            } else {
                                // console.log(option.field + " " + option.value + " " + option.type)
                                newConfigs[i].meta.args[j].value = options[index].value
                                configValue += options[index].value + ":"
                                    // console.log(newConfigs[i].value)
                            }
                            options.splice(index + j, 1)
                        }
                        configValue = configValue.substr(0, configValue.length - 1)
                        newConfigs[i].value = configValue
                    } else {
                        if (option.type == "checkbox") {
                            // console.log(option.field + " " + option.value + " " + option.type)
                            // console.log(option.checked)
                            newConfigs[i].value = option.checked ? "YES" : "NO"
                                // console.log(newConfigs[i].value)
                        } else {
                            // console.log(option.field + " " + option.value + " " + option.type)
                            newConfigs[i].value = option.value
                                // console.log(newConfigs[i].value)
                        }
                    }
                } else {
                    if (option.type == "checkbox") {
                        // console.log(option.field + " " + option.value + " " + option.type)
                        // console.log(option.checked)
                        newConfigs[i].value = option.checked ? "YES" : "NO"
                            // console.log(newConfigs[i].value)
                    } else {
                        // console.log(option.field + " " + option.value + " " + option.type)
                        newConfigs[i].value = option.value
                            // console.log(newConfigs[i].value)
                    }
                }
            }
        })
        newDConfigs.forEach(function(el) {
            if (option.field == el.field) {
                let i = optionFieldMapD_Init.indexOf(option.field)
                if (newDConfigs[i].meta !== undefined) {
                    if (newDConfigs[i].meta.manyArgs) {
                        let configValue = ""
                        for (let j = 0; j < newDConfigs[i].meta.args.length; j++) {
                            if (option.type == "checkbox") {
                                // console.log(option.field + " " + option.value + " " + option.type)
                                // console.log(option.checked)
                                newDConfigs[i].meta.args[j].value = options[index].checked ? "YES" : "NO"
                                configValue += (options[index].checked ? "YES" : "NO") + ":"
                                    // console.log(newConfigs[i].value)
                            } else {
                                // console.log(option.field + " " + option.value + " " + option.type)
                                newDConfigs[i].meta.args[j].value = options[index].value
                                configValue += options[index].value + ":"
                                    // console.log(newConfigs[i].value)
                            }
                            options.splice(index + j, 1)
                        }
                        configValue = configValue.substr(0, configValue.length - 1)
                        newDConfigs[i].value = configValue
                    } else {
                        if (option.type == "checkbox") {
                            // console.log(option.field + " " + option.value + " " + option.type)
                            // console.log(option.checked)
                            newDConfigs[i].value = option.checked ? "YES" : "NO"
                                // console.log(newConfigs[i].value)
                        } else {
                            // console.log(option.field + " " + option.value + " " + option.type)
                            newDConfigs[i].value = option.value
                                // console.log(newConfigs[i].value)
                        }
                    }
                } else {
                    if (option.type == "checkbox") {
                        // console.log(option.field + " " + option.value + " " + option.type)
                        // console.log(option.checked)
                        newDConfigs[i].value = option.checked ? "YES" : "NO"
                            // console.log(newConfigs[i].value)
                    } else {
                        // console.log(option.field + " " + option.value + " " + option.type)
                        newDConfigs[i].value = option.value
                            // console.log(newConfigs[i].value)
                    }
                }
            }
        })
    })

    console.log(options)
    console.log(newConfigs)
    ipc.send("update-configs", "init", newConfigs)
    console.log(newDConfigs)
    ipc.send("update-configs", "d_init", newDConfigs)
}

function showOptionsIfOptionChecked(trigger, options) {
    if(!trigger.checked) {
        options.forEach(function (option) {
            option.classList.add("hidden")
        })
    }
    trigger.addEventListener("click", function () {
        if(!trigger.checked) {
            options.forEach(function (option) {
                option.classList.add("hidden")
            })
        } else {
            options.forEach(function (option) {
                option.classList.remove("hidden")
            })
        }
    })
}

function displayCategories(init) {
    if (init) {
        console.log(dfconfigCategory.value)
        let configs = []
        if (dfconfigCategory.value == "all") {
            configs = dfConfig
            console.log(configs)
            configOptions(init, configs)
            dfconfigbtn.disabled = false
        } else if (dfconfigCategory.value == "0") {
            dfconfigOptions.innerHTML = ""
            dfconfigbtn.disabled = true
        } else {
            dfConfig.forEach(function(config) {
                for (let i = 0; i < config.categories.length; i++) {
                    if (config.categories[i] == dfconfigCategory.value) {
                        configs.push(config)
                        break;
                    }
                }
            })
            console.log(configs)
            configOptions(init, configs)
            dfconfigbtn.disabled = false
        }
        console.log(configs)
    } else {
        console.log(dfdconfigCategory.value)
        let configs = []
        if (dfdconfigCategory.value == "all") {
            configs = dfdConfig
            console.log(configs)
            configOptions(init, configs)
            dfdconfigbtn.disabled = false
        } else if (dfdconfigCategory.value == "0") {
            dfdconfigOptions.innerHTML = ""
            dfdconfigbtn.disabled = true
        } else {
            dfdConfig.forEach(function(config) {
                for (let i = 0; i < config.categories.length; i++) {
                    if (config.categories[i] == dfdconfigCategory.value) {
                        configs.push(config)
                        break;
                    }
                }
            })
            console.log(configs)
            configOptions(init, configs)
            dfdconfigbtn.disabled = false
        }
        console.log(configs)
    }
}

function toggleAdvancedMode() {
    if (dfconfigDiv.className == "dfconfig-div hidden") {
        console.log("Advanced Mode On")
        dfconfigDiv.className = "dfconfig-div"
        dfdconfigDiv.className = "dfdconfig-div"
        basicdfconfigDiv.className = "dfconfig-div hidden"
        populateConfigCategories()
    } else {
        console.log("Advanced Mode Off")
        dfconfigDiv.className = "dfconfig-div hidden"
        dfdconfigDiv.className = "dfdconfig-div hidden"
        basicdfconfigDiv.className = "dfconfig-div"

        reloadContents.parentNode.classList.remove("hidden")
    }
}

ipc.on("backup-and-restore-menu", function () {
    backupToggle.classList.add("active")
    ftToggle.classList.remove("active")
    settingsToggle.classList.remove("active")

    backupControl.classList.remove("hidden")
    ftControl.classList.add("hidden")
    settingsControl.classList.add("hidden")
    description.classList.add("hidden")
    reloadContents.parentNode.classList.remove("hidden")
})
ipc.on("fonts-and-tilesets-menu", function () {
    backupToggle.classList.remove("active")
    ftToggle.classList.add("active")
    settingsToggle.classList.remove("active")

    backupControl.classList.add("hidden")
    ftControl.classList.remove("hidden")
    settingsControl.classList.add("hidden")
    description.classList.add("hidden")
    reloadContents.parentNode.classList.remove("hidden")
})
ipc.on("settings-menu", function () {
    backupToggle.classList.remove("active")
    ftToggle.classList.remove("active")
    settingsToggle.classList.add("active")

    backupControl.classList.add("hidden")
    ftControl.classList.add("hidden")
    settingsControl.classList.remove("hidden")
    description.classList.add("hidden")
    reloadContents.parentNode.classList.add("hidden")
})
ipc.on("update-basic-settings-menu", function() {
    updateBasicSettings()
})
ipc.on("update-init-settings-menu", function() {
    ipc.send("update-configs", "init", updateConfigs(true))
})
ipc.on("update-d_init-settings-menu", function() {
    ipc.send("update-configs", "d_init", updateConfigs(false))
})
ipc.on("toggle-advanced-menu", function () {
    toggleAdvancedMode()

    backupToggle.classList.remove("active")
    ftToggle.classList.remove("active")
    settingsToggle.classList.add("active")

    backupControl.classList.add("hidden")
    ftControl.classList.add("hidden")
    settingsControl.classList.remove("hidden")
    reloadContents.parentNode.classList.add("hidden")
})

launchDFbtn.addEventListener("click", function() {
    ipc.send("launch-DF")
})
backupSavesbtn.addEventListener("click", function() {
    ipc.send("backup-saves")
})
restoreSavesbtn.addEventListener("click", function() {
    ipc.send("restore-saves")
})
backupConfigbtn.addEventListener("click", function() {
    ipc.send("backup-config", saveSelect.value)
})
restoreConfigbtn.addEventListener("click", function() {
    ipc.send("restore-config", configSelect.value)
})
chooseFontbtn.addEventListener("click", function(event) {
    event.preventDefault()
    ipc.send("choose-font", fontoptions.value)
})
chooseTilesetbtn.addEventListener("click", function(event) {
    event.preventDefault()
    ipc.send("choose-tileset", tilesetoptions.value)
})
dfconfigbtn.addEventListener("click", function(event) {
    event.preventDefault()
    ipc.send("update-configs", "init", updateConfigs(true))
})
dfdconfigbtn.addEventListener("click", function(event) {
    event.preventDefault()
    ipc.send("update-configs", "d_init", updateConfigs(false))
})
dfconfigCategory.addEventListener("change", function() {
    displayCategories(true)
})
dfdconfigCategory.addEventListener("change", function() {
    displayCategories(false)
})
reloadContents.addEventListener("click", function() {
    ipc.send("reload-contents")
    location.reload()
})
toggleAdvanced.addEventListener("click", function () {
    toggleAdvancedMode()

    backupToggle.classList.remove("active")
    ftToggle.classList.remove("active")
    settingsToggle.classList.add("active")

    backupControl.classList.add("hidden")
    ftControl.classList.add("hidden")
    settingsControl.classList.remove("hidden")
    description.classList.add("hidden")
    reloadContents.parentNode.classList.add("hidden")
})
basicdfconfigbtn.addEventListener("click", function(event) {
    event.preventDefault()
    updateBasicSettings()
})
backupToggle.addEventListener("click", function () {
    backupToggle.classList.add("active")
    ftToggle.classList.remove("active")
    settingsToggle.classList.remove("active")

    backupControl.classList.remove("hidden")
    ftControl.classList.add("hidden")
    settingsControl.classList.add("hidden")
    description.classList.add("hidden")
    reloadContents.parentNode.classList.remove("hidden")
})
ftToggle.addEventListener("click", function () {
    backupToggle.classList.remove("active")
    ftToggle.classList.add("active")
    settingsToggle.classList.remove("active")

    backupControl.classList.add("hidden")
    ftControl.classList.remove("hidden")
    settingsControl.classList.add("hidden")
    description.classList.add("hidden")
    reloadContents.parentNode.classList.remove("hidden")
})
settingsToggle.addEventListener("click", function () {
    backupToggle.classList.remove("active")
    ftToggle.classList.remove("active")
    settingsToggle.classList.add("active")

    backupControl.classList.add("hidden")
    ftControl.classList.add("hidden")
    settingsControl.classList.remove("hidden")
    description.classList.add("hidden")
    reloadContents.parentNode.classList.add("hidden")
})

populateOptions()
populateConfigCategories()
basicSettings()
