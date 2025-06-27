const moongoose = require('mongoose');
const { ref } = require('process');

const linkSchema = new moongoose.Schema({
    compaignTitle: {
        type: String,
        required: true
    },
    orginalUrl: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: false
    },
    clickcount: {
        type: Number,
        default: 0
    },
    user: {
        type: moongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },

},{timestamps: true});

module.exports = moongoose.model('LinkShare', linkSchema);
