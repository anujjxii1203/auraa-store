const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Colors[colorScheme]')) {
        content = content.replace(/Colors\[colorScheme\]/g, "Colors[colorScheme ?? 'light']");
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed:', fullPath);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'app'));
