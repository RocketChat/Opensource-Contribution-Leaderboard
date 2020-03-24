const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
	username: {
		type: String,
		required: true
    },
    avatarUrl: String,
    openPRs: [String],
    mergedPRs: [String],
    issues: [String],
}, { collection: 'Contributors' });

module.exports = mongoose.model('User', UserSchema);