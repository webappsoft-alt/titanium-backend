require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const ProductData = require('../models/productData');
const CategoryContent = require('../models/categoryContent');
const GeneralContent = require('../models/generalContent');
const Products = require("../models/_product");

const File = require('../models/fileDetail');

const OLD_PREFIX = 'https://storage.googleapis.com/task-connect-app.appspot.com/uploads';
const NEW_PREFIX = process.env.S3_PUBLIC_URL;

const run = async () => {
  if (!NEW_PREFIX) {
    console.error('S3_PUBLIC_URL is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.DB);
  console.log('Connected to MongoDB');

  const docs = await Products.find({ productFile: { $regex: `^${OLD_PREFIX}` } });

  if (!docs.length) {
    console.log('No documents found with the old productFile prefix.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${docs.length} documents to update.\n`);

  let success = 0;
  let failed = 0;

  for (const doc of docs) {
    const oldImage = doc.productFile;
    const newImage = oldImage.replace(OLD_PREFIX, NEW_PREFIX);
    try {
      await Products.updateOne({ _id: doc._id }, { productFile: newImage });
      console.log(`✔  ${oldImage}\n   → ${newImage}`);
      success++;
    } catch (err) {
      console.error(`✘  ${doc._id} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} updated, ${failed} failed.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
