# Dwarf Fortress Launcher File System

The launcher's main file source (apart from itself) is in the user's located with `path.join(app.getPath("appData"), app.getName())` (e.g. `~/Library/Application Support/Dwarf-Fortress-Launcher`). [More `app.getPath()` info here.](https://electron.atom.io/docs/api/app/#appgetpathname)

## Organization

- `appData folder`/`Dwarf-Fortress-Launcher` (main directory)
    - data (directory)
        - config (directory)
            - any config backups, .tar.gz
        - fonts (directory)
            - any fonts, .ttf
        - saves (directory)
            - any save backups, .tar.gz
        - tilesets (directory)
            - any tilesets, .bmp or .png
        - `contents.json` (keeps track of the contents of the data directory)
        - `config.json` (stores DF config `init.txt` for the launcher)
        - `d_config.json` (stores DF config `d_init.txt` for the launcher)
        - `dconfigsupplement.txt` (addition non-configurable configs for `d_init.txt` generation)
    - `config.json` (launcher settings)
    - `log.log` (electron-log log file)
