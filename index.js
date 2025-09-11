const express = require("express");
const PORT = 5174;
const cors = require("cors");
const bodyParser = require("body-parser");
const signup = require("./models/signup");
const donate = require("./models/donate");
const contact = require("./models/contact");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome Nk ");
});

app.post("/donate", async(req, res) => {
    try {
        const donation = await donate.create(req.body);
        // console.log("Donation saved:", donation);
        res.status(201).json({ message: "Donation saved successfully!", donation });
      } catch (err) {
        // console.error("Error saving donation:", err);
        res.status(400).json({ message: "Error saving donation", error: err.message });
      }
});

app.post("/signup", async(req, res) => {
    try {
        const sign = await signup.create(req.body);
        // console.log("Signup saved:", sign);
        res.status(201).json({ message: "Signup saved successfully!", sign });
      } catch (err) {
        // console.error("Error saving Signup:", err);
        res.status(400).json({ message: "Error saving Signup", error: err.message});
      }
});

app.post("/contactus", async(req,res)=>{
  try{
    const contactus = await contact.create(req.body);
    // console.log("Contact Saved",contactus);
    res.status(201).json({message:"ContactUs Saved SuccessFully!",contactus});
  }catch(err){
    // console.log("Error saving contactus: ",err);
    res.status(400).json({message:"Error saving contactus", error: err.message});
  }
})

app.get("/login", async(req,res)=>{
  try{
    const detail = await signup.find();
    res.status(200).json(detail);
  }catch(err){
    // console.log("Error occured while fetching data",err);
    res.status(500).json(false);
  }
})

app.get("/search", async(req,res)=>{
  try{
    const detail = await signup.find();
    res.status(200).json(detail);
  }catch(err){
    // console.log("Error occured while fetching data",err.message);
    res.status(500).json(false);
  }
})

app.get("/amount", async(req,res)=>{
  try{
    const result = await donate.find();
    res.status(200).json(result);
  }catch(err){
    // console.log("Error While Fetching Data : ",err.message)
    res.status(500).json(false);
  }
})

app.listen(PORT, () => {
  console.log(`Server is running in PORT ${PORT}`);
});
