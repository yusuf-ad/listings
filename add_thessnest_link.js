const fs = require('fs');
const path = require('path');

const kleiousDir = path.join(__dirname, 'kleious');
const files = fs.readdirSync(kleiousDir).filter(f => f.endsWith('.json'));

files.forEach(f => {
  const filePath = path.join(kleiousDir, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (data.seo && data.seo.permalink) {
    data.seo.thessnest_link = `https://thessnest.com/listing/${data.seo.permalink}/`;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", 'utf8');
    console.log(`Added thessnest_link to seo in ${f}: ${data.seo.thessnest_link}`);
  } else {
    console.warn(`No seo or permalink found in ${f}`);
  }
});
