const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../Models/listing");

main(() => console.log("connected with wanderlust")).catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

const initDB = async () => {
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log("data insertion successful");
}

initDB();