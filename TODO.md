# Dwarf Fortress Launcher To Do

## Features

- Choose which configs are "basic"
- Install DF through the launcher
- Manage multiple versions
- Add fonts and tilesets to the data directory through the launcher (not manually moving them there)
- Hide/quit launcher when DF is launched, show/reopen when it quits (as an option)

## Fixes

- Make it `data/configs` not `data/config`
- Handle font/tileset/backup names being too long (currently its a mess)

## Ideas

- Change the restart to use `app.relaunch()`

## Other

- Move all file paths to the main config
- Conform to standard.js
- Split `main.js` into multiple files (e.g. Menu, fonts + tilesets, functions)
