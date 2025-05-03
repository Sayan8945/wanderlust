const express = require("express");
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const port = 8080;
const methodOverride = require('method-override')
const Listing = require("./Models/listing");
const Review = require("./Models/review.js");
engine = require('ejs-mate');
const wrapAsync = require("./utills/wrapAsync");
const ExpressError = require("./utills/expressError");
const {listingValidate , reviewValidate} = require("./schema.js");
const { rmSync } = require("fs");


app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(express.urlencoded({extended: true}));
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "/public")));
app.engine('ejs', engine);

main(() => console.log("connected with wanderlust")).catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

const validateListing = (req,res,next) => {
  let result = listingValidate.validate(req.body);
  if(result.error){
    throw new ExpressError(400, result.error);
  } else {
    next();
  }
}
const validateReview = (req,res,next) => {
  let result = reviewValidate.validate(req.body);
  if(result.error){
    throw new ExpressError(400, result.error);
  } else {
    next();
  }
}


app.get("/", (req,res) => {
  
})

//index route
app.get("/listings", wrapAsync(async (req,res)=>{
  let allListings = await Listing.find({}).sort({title:1});
  res.render("listings/index.ejs", {allListings});
}))

//new route
app.get("/listings/new", (req,res)=> {
  res.render("listings/new");
})
app.post("/listings",
  validateListing,
  wrapAsync(async (req,res,next)=>{
  let newlisting = req.body.listing;
  await Listing.insertOne(newlisting);
  res.redirect("/listings");
}))

//show route
app.get("/listings/:id", wrapAsync(async (req,res)=>{
  let {id} = req.params;
  let listing = await Listing.findById(id).populate("reviews");
  res.render("listings/show", {listing});
}))

//update route
app.get("/listings/:id/edit",
  validateListing, 
  wrapAsync(async (req,res)=>{
  let {id} = req.params;
  let listing = await Listing.findById(id);
  res.render("listings/edit", {listing});
}))
app.put("/listings/:id", wrapAsync(async(req,res)=>{
  let {id} = req.params;
  let listing = await Listing.findById(id);
  let editedlisting = req.body.listing;
  await Listing.findByIdAndUpdate(id , editedlisting);
  res.redirect(`/listings/${id}`);
}))

//delete route
app.delete("/listings/:id", wrapAsync(async (req,res)=>{
  let {id} = req.params;
  let deletedlist = await Listing.findByIdAndDelete(id);
  console.log(deletedlist);
  res.redirect(`/listings`);
}))

// review route
app.post("/listings/:id/reviews",validateReview, wrapAsync(async (req,res)=>{
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);  //convert into schema format
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();  //existing document change
  res.redirect(`/listings/${listing._id}`);
}))
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req,res) => {
  let {id,reviewId} = req.params;
  await Review.findByIdAndDelete(reviewId);
  await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
  res.redirect(`/listings/${id}`)
}))

// error handling
app.use("/", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"))
})
app.use((err, req, res, next) => {
  let {statusCode = 500, message = "Something went wrong !"} = err;
  console.log(err);
  res.status(statusCode).render("error.ejs", {message});
})

app.listen(port, (req,res)=>{
  console.log("listening to port 8080...");
})
