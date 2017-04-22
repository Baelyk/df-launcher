# Dwarf Fortress Launcher

Dwarf Fortress Launcher is a launcher that I built with [Electron](http://electron.atom.io), half for fun and half to learn Electron. You can launch Dwarf Fortress (it would kinda suck as a launcher if you couldn't), edit almost all the configs, change fonts and tilesets, and backup saves and configurations.

It's still not done and needs some further work, but it does work. I wouldn't use it with an important DF install though, maybe create an install just for this because although it shouldn't mess anything up, I haven't done extensive enough testing to know for sure.

## Features

- Launch Dwarf Fortress
- Edit basic configs
- Edit almost all of the configs in `init.txt` and `d_init.txt`
- Change fonts and tilesets
- Backup and restore saves and configurations

## Planned

- Choose which configs are "basic"
- Install DF through the launcher
- Manage multiple versions
- Add fonts and tilesets to the data directory through the launcher (not manually moving them there)
- ~~Move all paths to use the `path` module~~
- ~~Use `app.getPath("appData")` instead of a manual data folder.~~
- Move all file paths to the main config
- Conform to standard.js
- Split `main.js` into multiple files (e.g. Menu, fonts + tilesets, functions)

## Documentation

- [Filesystem](FileSystem.md)
