const fs = require('fs-jetpack')
const path = require('path')

const config = {
  'ui': {
    'categories': {
      'init': [
        {
          'name': 'All',
          'tag': 'all'
        },
        {
          'name': 'Sound',
          'tag': 'sound'
        },
        {
          'name': 'Startup',
          'tag': 'startup'
        },
        {
          'name': 'Fullscreen',
          'tag': 'fullscreen'
        },
        {
          'name': 'Window',
          'tag': 'window'
        },
        {
          'name': 'Font',
          'tag': 'font'
        },
        {
          'name': 'Miscellaneous',
          'tag': 'misc'
        },
        {
          'name': 'Graphics',
          'tag': 'graphics'
        },
        {
          'name': 'Miscellaneous',
          'tag': 'misc'
        },
        {
          'name': 'FPS',
          'tag': 'fps'
        },
        {
          'name': 'Performance',
          'tag': 'performance'
        },
        {
          'name': 'Mouse',
          'tag': 'mouse'
        },
        {
          'name': 'Keys',
          'tag': 'keys'
        },
        {
          'name': 'Timing',
          'tag': 'timing'
        }
      ],
      'd_init': [
        {
          'name': 'All',
          'tag': 'all'
        },
        {
          'name': 'Save',
          'tag': 'save'
        },
        {
          'name': 'Display',
          'tag': 'display'
        },
        {
          'name': 'Load',
          'tag': 'load'
        },
        {
          'name': 'Options',
          'tag': 'options'
        },
        {
          'name': 'Miscellaneous',
          'tag': 'misc'
        },
        {
          'name': 'World Generation',
          'tag': 'worldgen'
        },
        {
          'name': 'Fortress Mode',
          'tag': 'fortress'
        },
        {
          'name': 'Adventurer Mode',
          'tag': 'adventurer'
        },
        {
          'name': 'Legends Mode',
          'tag': 'legends'
        },
        {
          'name': 'Nickname',
          'tag': 'nickname'
        }
      ]
    },
    'usedFont': '',
    'usedTileset': ''
  },
  'basicSettings': {
    'init': [
      2,
      24,
      25,
      26,
      32
    ],
    'd_init': [
      0,
      5,
      7,
      51
    ]
  },
  'settings': {
    'log': {
      'fileLogLevel': 'debug',
      'infoMode': true,
      'verboseMode': true,
      'debugMode': true,
      'sillyMode': false
    },
    'data': {
      'dir': {
        'path': '',
        'name': ''
      }
    },
    'df': {
      'dir': {
        'path': '',
        'name': ''
      },
      'downloads': {
        'newest': '0.43.05'
      }
    }
  },
  'startups': 0
}

fs.write(path.join(__dirname, 'assets', 'config', 'config.json'), config, {
  jsonIndent: 4
})

console.log('Cleaned and ready to commit!')
