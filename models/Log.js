const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Log = new Schema({ lastUpdated: Number }, { collection: 'Log' });

module.exports = mongoose.model('Log', Log);