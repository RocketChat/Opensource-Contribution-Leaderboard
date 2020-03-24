const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
	username: {
		type: String,
		required: true
	},
	token: {
		type: String,
		required: true
	}
}, { collection: 'Token' });

module.exports = mongoose.model('Token', TokenSchema);