const cron = require('node-cron');
const { runMonthlyInterestJob } = require('../services/interestService');

// ⭐ በየወሩ ቀን 1 ላይ በራስ-ሰር ይሰራል (ሰዓት 12:00 AM)
// ለመፈተሽ: በየደቂቃው ለማስኬድ: '*/1 * * * *'
const schedule = '0 0 1 * *'; // በየወሩ ቀን 1, ሰዓት 12:00 AM

console.log('⏰ Monthly interest job scheduled');
console.log(`📅 Schedule: ${schedule}`);

cron.schedule(schedule, async () => {
    console.log('🔄 Running scheduled monthly interest job...');
    await runMonthlyInterestJob();
});

// ⭐ ለሙከራ: በየደቂቃው ለማስኬድ (አስተያየት አውጣ)
// const testSchedule = '*/1 * * * *';
// cron.schedule(testSchedule, async () => {
//     console.log('🔄 Running test interest job...');
//     await runMonthlyInterestJob();
// });

module.exports = cron;