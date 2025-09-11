const mongoose = require("mongoose");
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.MONGO_URL
mongoose
  .connect(
    url,{dbName:"Donation"}
  )
  .then(() => console.log("Connected to Signup MongoDB Successfully"))
  .catch((err) => console.log("MongoDB Connection Error : ",err));

  const signupSchema = new mongoose.Schema({
    name : {type:String ,required : true},
    blood : {type:String ,required : true},
    mail : {type:String ,required : true,unique:true},
    password : {type:String ,required : true},
    mobile : {type:Number ,required : true},
    birth : {type:String ,required : true},
    gender : {type:String ,required : true},
    address : {type:String ,required : true},
    country : {type:String ,required : true},
    pincode : {type:Number ,required : true},
  })

module.exports = mongoose.model("signup",signupSchema,"signup")