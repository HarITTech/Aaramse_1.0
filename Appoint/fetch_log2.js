const fs = require('fs');
const https = require('https');
const zlib = require('zlib');

const url = `https://storage.googleapis.com/eas-workflows-production/logs/7d2bb5b1-fc67-46a0-87a3-e49248660333/d7792e22-9994-4def-9392-e558eeebb3fa/2026-06-16T10%3A12%3A53Z-7e6ce09f-0fed-48cf-a990-2761dd099072.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260616%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260616T101900Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=4c069fcea57031e73c44f5694b353567b09d4946aa436e64d23322cb5d0ec6677c8411dc5f24ec4292220ed569c52f6cb3d32bbbb4fe4142d35d6f82ad3cc4c1a70aec69814d9bb0793c20ca5e79f21662a8c4e113490fff2cda7ae64b1dee3890e5622b18cdc7ddf3580038d1f0f88d6fb0563a7339b8176da3bbed433ead69925f0e60bc17960c12ee3db4c2df4bd717708080f743d82830aa5eb0808681311453087566273d0720bdbae7af64969fd1bd45c77aa1311e667d27220c3e56fd47efbe589dfa305154ae2a4996bdd16864d6c341437e5d418f2d27b615e6157135e4b006c70c2a35663590661fa7a7de5d3e5c5bcaff073084aa797830b196df`;

https.get(url, (res) => {
  let stream = res;
  const ce = res.headers['content-encoding'];
  if (ce === 'br') stream = res.pipe(zlib.createBrotliDecompress());
  else if (ce === 'gzip') stream = res.pipe(zlib.createGunzip());

  const chunks = [];
  stream.on('data', c => chunks.push(c));
  stream.on('end', () => {
    const text = Buffer.concat(chunks).toString('utf8');
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
    const output = gradleLines.join('\n');
    fs.writeFileSync('gradle_log2.txt', output);
    // Print just the failure section
    const idx = output.indexOf('FAILURE:');
    if (idx >= 0) {
      console.log(output.substring(idx > 3000 ? idx - 3000 : 0));
    } else {
      console.log('No FAILURE: found. Last 3000 chars:\n', output.slice(-3000));
    }
  });
}).on('error', e => console.error('Error:', e.message));
