const fs = require('fs');
const path = require('path');

module.exports = {
  commands: [
    {
      name: 'postinstall-swift-flag',
      func: async () => {
        const pbxprojPath = path.join(__dirname, 'ios', 'Homerunn.xcodeproj', 'project.pbxproj');
        if (fs.existsSync(pbxprojPath)) {
          let contents = fs.readFileSync(pbxprojPath, 'utf8');
          if (!contents.includes('AccessLevelOnImport')) {
            contents = contents.replace(
              /OTHER_SWIFT_FLAGS = ".*?";/g,
              match =>
                match.replace(/";/, ' -enable-experimental-feature AccessLevelOnImport";')
            );
            fs.writeFileSync(pbxprojPath, contents);
            console.log('✅ Swift flag injected via react-native.config.js');
          } else {
            console.log('ℹ️ Swift flag already present');
          }
        } else {
          console.warn('❌ Could not find project.pbxproj');
        }
      },
    },
  ],
};
