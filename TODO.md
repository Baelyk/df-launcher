# Dwarf Fortress Launcher To Do

## Features

-   Choose which configs are "basic"
-   Install DF through the launcher
-   Manage multiple versions
-   Hide/quit launcher when DF is launched, show/reopen when it quits (as an option)

## Fixes

-   Handle font/tileset/backup names being too long (currently its a mess)
- Get rid of the directory selection
- Fix font/tileset selection after adding one

## Ideas

-   Change the restart to use `app.relaunch()`

## Other

-   Move all file paths to the main config
-   **Conform to standard.js**
-   Split `main.js` into multiple files (e.g. Menu, fonts + tilesets, functions)
-   Update to the newest version of Electron (1.6.5 right now)
-   Move all the data dir setup to `initData()` in the main process

## Done

-   Move all paths to use the `path` module
-   Use `app.getPath("appData")` instead of a manual data folder.
-   Add fonts and tilesets to the data directory through the launcher (not manually moving them there)
-   Make it `data/configs` not `data/config`
