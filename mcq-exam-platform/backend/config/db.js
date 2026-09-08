// ================== config/db.js ==================
// MongoDB এর সাথে কানেকশন তৈরি করার ফাংশন
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB কানেক্ট হয়েছে');
  } catch (err) {
    console.error('❌ MongoDB কানেকশন ব্যর্থ:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
