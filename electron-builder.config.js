const path = require('path');

module.exports = {
  appId: "com.sinpls.dofus-salescraft",
  productName: "Dofus Crafting Tracker",
  directories: {
    output: "release"
  },
  files: [
    "dist/**/*",
    "dist-electron/**/*",
    "package.json"
  ],
  extraResources: [
    {
      from: ".",
      to: ".",
      filter: ["user_data/**/*", "data/**/*"]
    }
  ],
  asar: true,
  asarUnpack: [
    "dist-electron/preload.js"
  ],
  win: {
    target: [
      {
        target: "portable",
        arch: ["x64"]
      }
    ],
    icon: path.resolve(__dirname, 'public', 'Dofus.ico')
  },
  mac: {
    target: ["dmg"],
    icon: path.resolve(__dirname, 'public', 'Dofus.ico')
  },
  linux: {
    target: ["AppImage"],
    icon: path.resolve(__dirname, 'public', 'Dofus.ico')
  }
};