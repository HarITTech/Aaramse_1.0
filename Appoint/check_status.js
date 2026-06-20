const https = require('https');
const zlib = require('zlib');

const url = `https://expo.dev/accounts/mahesh140/projects/Aaramse/builds/cab669e3-ec87-4a82-8860-d9dd13af0ef3`;
// We can't directly access this without auth — let's check via eas CLI
// Instead, let's just verify task-1285 and task-1288 are uploading

console.log('Checking build task status...');
