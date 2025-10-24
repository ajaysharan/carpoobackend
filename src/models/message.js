const mongoose = require('mongoose');


const MessageSchema = new mongoose.Schema({     
  senderId      : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId    : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content       : { type: String, required: true, trim: true },
  
  date_time     : { type: Date, default: Date.now },
  read          : { type: Boolean, default: false }
}, { timestamps: true });

MessageSchema.index({ senderId: 1, receiverId: 1, date_time: -1 })
MessageSchema.index({ receiverId: 1, senderId: 1, date_time: -1 })
 
module.exports = mongoose.model('Message', MessageSchema);
  