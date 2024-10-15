const {Schema, model} = require('mongoose')
const { createHmac, randomBytes } = require('crypto');
const { createTokenForUser } = require('../authentication.js');
const collectorSchema = new Schema({
    firstname: {
        type: String,
        required: true,
      },
      profilePicture:{
        url:String,
        filename:String,
      }
      ,
      lastname: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      date: {
        type: String,
        required: true,
      },
    salt: {
        type: String,
    },
    role: {
        type: String,
        default: 'collector',
    },
    taskCompleted: {
      type: Number,
      default: 0,
    },
    Area:{
      type: String,
      required: true,
    }
    
})



collectorSchema.pre("save", function(next) {
    const collector = this;
    if (!collector.isModified('password')) return next();

    const salt = randomBytes(16).toString('hex');

    const hashedPassword = createHmac("sha256", salt)
        .update(collector.password)
        .digest("hex");

    this.salt = salt;
    this.password = hashedPassword;
    next(); 
});



collectorSchema.statics.matchPassword = async function(email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error('Invalid email or password');

    const hashedPassword = createHmac('sha256', user.salt).update(password).digest("hex");
    if (user.password !== hashedPassword) throw new Error('Invalid email or password');

    const token = createTokenForUser(user);
    return token;
};

const collectorModel = model('collector',collectorSchema)
module.exports = {
    collectorModel
}