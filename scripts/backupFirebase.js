require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  const config = {
    type: process.env.TYPE,
    project_id: process.env.PROJECTID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENTID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URL,
    auth_provider_x509_cert_url: process.env.AUTHPROVIDER,
    client_x509_cert_url: process.env.CLIENT_CERT,
    universe_domain: process.env.DOMAIN,
  };

  admin.initializeApp({
    credential: admin.credential.cert(config),
    storageBucket: 'gs://task-connect-app.appspot.com',
  });
}

const bucket = admin.storage().bucket();
const BACKUP_DIR = path.join(__dirname, '../backup');

const downloadFile = (file, destPath) => {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const writeStream = fs.createWriteStream(destPath);
    file.createReadStream()
      .on('error', reject)
      .pipe(writeStream)
      .on('finish', resolve)
      .on('error', reject);
  });
};

const FOLDER = 'audio';

const run = async () => {
  console.log(`Fetching files from Firebase Storage folder: ${FOLDER}/...`);
  const [files] = await bucket.getFiles({ prefix: `${FOLDER}/` });

  if (!files.length) {
    console.log(`No files found in folder: ${FOLDER}/`);
    return;
  }

  console.log(`Found ${files.length} files. Starting download to: ${BACKUP_DIR}\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const destPath = path.join(BACKUP_DIR, file.name);
    try {
      await downloadFile(file, destPath);
      console.log(`✔  ${file.name}`);
      success++;
    } catch (err) {
      console.error(`✘  ${file.name} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} downloaded, ${failed} failed.`);
  console.log(`Files saved to: ${BACKUP_DIR}`);
};

run().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
