const https = require('https');
const fs = require('fs');
const path = require('path');

const urls = [
  'https://api.dofusdu.de/dofus2/en/items/equipment/all',
  'https://api.dofusdu.de/dofus2/en/items/resources/all',
  'https://api.dofusdu.de/dofus2/en/items/consumables/all'
];

const fileNames = [
  'dofus_equipment.json',
  'dofus_resources.json',
  'dofus_consumables.json'
];

const dataDir = path.join(__dirname, '..', 'public', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

urls.forEach((url, index) => {
  https.get(url, (response) => {
    let data = '';

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      fs.writeFile(path.join(dataDir, fileNames[index]), data, (err) => {
        if (err) throw err;
        console.log(`Downloaded ${fileNames[index]}`);
      });
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${fileNames[index]}: ${err.message}`);
  });
});