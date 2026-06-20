const fs = require('fs');
const https = require('https');
const zlib = require('zlib');

const url = `https://storage.googleapis.com/eas-workflows-production/logs/7d2bb5b1-fc67-46a0-87a3-e49248660333/8739ea55-eeb2-470d-bf4b-e94fbfb60b6a/2026-06-16T09%3A37%3A36Z-074596d8-e6fa-4a71-8e97-08cf4fcaed45.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260616%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260616T094002Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=6276883cfdfbcf1a40a2ea23535250cfd4574a3f7023bb12f050913605d51695083eaf563415b5c5e4d97ecb8f7101ba0905bdc2a1bba3e7a1ad09f1fd09b5d641bbd0ea328fa1a4922db7855425d09eb07803f3ef38de99ae545a35509efaeb9569f4e09e1da9e99d098038a50be6a392f3a1b793fe3795987f220ace471591543f8ee382d28bf47fd002d5d7f9f7fcef01e1f43274344b193fe5e77e80366ad6c87cac01a564051470862c490639ecab06630a1fdad81ac0caaac0ad04c5223a0e6e1a9a8371d6cf91b179a10060d3db0a2e13edfc45e34bf4babc7ad022fbf76e163603700d9761c2b4b64b5590947faddcfcbe19dfd493937c8cd277ab54`;
const dest = `C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\9b167876-4386-4210-bc56-1610e75cfe55\\scratch\\full_decompressed_log.txt`;

https.get(url, (res) => {
  console.log('Headers:', res.headers);
  
  let stream = res;
  const contentEncoding = res.headers['content-encoding'];
  
  if (contentEncoding === 'gzip') {
    stream = res.pipe(zlib.createGunzip());
  } else if (contentEncoding === 'deflate') {
    stream = res.pipe(zlib.createInflate());
  } else if (contentEncoding === 'br') {
    stream = res.pipe(zlib.createBrotliDecompress());
  }
  
  const file = fs.createWriteStream(dest);
  stream.pipe(file);
  
  file.on('finish', () => {
    file.close();
    console.log('Saved log file. Size:', fs.statSync(dest).size);
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err.message);
});
