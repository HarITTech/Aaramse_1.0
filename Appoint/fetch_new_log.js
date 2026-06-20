const fs = require('fs');
const https = require('https');
const zlib = require('zlib');

const url = `https://storage.googleapis.com/eas-workflows-production/logs/7d2bb5b1-fc67-46a0-87a3-e49248660333/3e2fcb79-6a0f-4e48-9862-9c0503ccfb22/2026-06-16T10%3A01%3A48Z-2ab9c9c9-cab9-45e5-a262-76816301ddcf.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260616%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260616T100355Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=7725f89047b5b750366ee2709cdeef1c88908ba2c0e7ead99347e420cffd83b6cdd15a83a6c96b6ddf1bdbd32e1c1320886df7922e51969fa06df4399438e6664fcb96600bc55998b1a1d85d63a47f1262fb350eb446f95cf9dcefe4be86deb6551f70243f0e49eeaf1df48d8cf8104303a166c6f8d7ba61be4cce1ee965025fb2ccaba68b4311a87aa51400ce95547a3e26af2fdfcef4630ce6e08dbc4c7b878698d7f57fc585e8f7adbe717b80fb1394e9adf44c5bffd85bcc6d7fddddd7fb756b0f7b762778f990fe3d38c411fd0876d70cf98e71b6a78c1de750bc909d64022e60cfa8df3f66c0f1ddcd46ae7ba1b17f953a6b09274fca1b5dd5033f90dc`;
const dest = `C:\\Users\\hp\\Desktop\\Desktop\\Product\\Aaramse\\AaramSe\\Appoint\\new_build_log.txt`;

https.get(url, (res) => {
  let stream = res;
  const ce = res.headers['content-encoding'];
  if (ce === 'br') stream = res.pipe(zlib.createBrotliDecompress());
  else if (ce === 'gzip') stream = res.pipe(zlib.createGunzip());

  const chunks = [];
  stream.on('data', c => chunks.push(c));
  stream.on('end', () => {
    const text = Buffer.concat(chunks).toString('utf8');
    // Extract just RUN_GRADLEW phase messages + error context
    const lines = text.split('\n');
    let gradleLines = [];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.phase === 'RUN_GRADLEW') {
          gradleLines.push(obj.msg || '');
        }
      } catch(e) {}
    }
    fs.writeFileSync(dest, gradleLines.join('\n'));
    console.log('Done. Lines extracted:', gradleLines.length);
  });
  stream.on('error', e => console.error('Stream error:', e.message));
}).on('error', e => console.error('Request error:', e.message));
