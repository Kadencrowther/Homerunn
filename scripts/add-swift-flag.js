const fs = require('fs');
const path = require('path');

const pbxprojPath = path.join(__dirname, '..', 'ios', 'Homerunn.xcodeproj', 'project.pbxproj');

if (fs.existsSync(pbxprojPath)) {
  let contents = fs.readFileSync(pbxprojPath, 'utf8');

  if (!contents.includes('AccessLevelOnImport')) {
    contents = contents.replace(
      /buildSettings = {\n/g,
      `buildSettings = {\n        OTHER_SWIFT_FLAGS = "-enable-experimental-feature AccessLevelOnImport";\n`
    );
    fs.writeFileSync(pbxprojPath, contents, 'utf8');
    console.log('✅ Swift compiler flag added.');
  } else {
    console.log('⚠️ Swift flag already set.');
  }
} else {
  console.log('❌ Xcode project file not found.');
}
