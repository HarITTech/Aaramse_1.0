const fs = require('fs');
const readline = require('readline');

const src = `C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\9b167876-4386-4210-bc56-1610e75cfe55\\scratch\\full_decompressed_log.txt`;
const dest = `C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\9b167876-4386-4210-bc56-1610e75cfe55\\scratch\\gradle_output.txt`;

const writeStream = fs.createWriteStream(dest);

const rl = readline.createInterface({
  input: fs.createReadStream(src),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const logObj = JSON.parse(line);
    if (logObj.phase === 'RUN_GRADLEW') {
      writeStream.write((logObj.msg || '') + '\n');
    }
  } catch (err) {
    // Not JSON or parse error, just ignore
  }
});

rl.on('close', () => {
  writeStream.end();
  console.log('Finished extracting gradlew phase logs.');
});
