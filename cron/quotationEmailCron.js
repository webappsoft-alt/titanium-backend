const cron = require('node-cron');
const { processScheduledQuotationEmails } = require('../controllers/quotationController');

// Run every 10 minutes
const startQuotationEmailCron = () => {
    cron.schedule('*/10 * * * *', async () => {
        console.log('Running scheduled quotation email cron job...');
        await processScheduledQuotationEmails();
    });
    console.log('Quotation email cron job scheduled to run every 10 minutes');
};

module.exports = { startQuotationEmailCron };
