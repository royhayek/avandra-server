const { server } = require("../../app");
const OpenAI = require("openai");
const mongoose = require("mongoose");
const io = require("socket.io")(server);
const wss = require("../../websocket");

const Trip = mongoose.model("Trip");
const Budget = mongoose.model("Budget");
const Traveler = mongoose.model("Traveler");
const Language = mongoose.model("Language");

const methods = require("./crudController");
module.exports = methods.crudController("Trip");

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const handleOpenAIError = (err) => {
  if (err instanceof OpenAI.APIError) {
    console.error("OpenAI API Error:");
    console.error("Status:", err.status);
    console.error("Message:", err.message);
    console.error("Name:", err.name);
    console.error("Headers:", err.headers);

    // Return an error response to the client
    return res.status(500).json({ success: false, error: "OpenAI API Error: " + err.message });
  } else {
    console.error("An unexpected error occurred:", err);

    return res.status(500).json({ success: false, error: "An unexpected error occurred" });
  }
};

const generateCompletion = async (content, model) => {
  try {
    return await openai.chat.completions.create({
      messages: [{ role: "system", content }],
      model,
      response_format: { type: "json_object" },
    });
  } catch (err) {
    handleOpenAIError(err);
  }
};

const findPlaceId = async (placeName, placeAddress, apiKey) => {
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
    `${placeName}, ${placeAddress}`
  )}&inputtype=textquery&fields=place_id&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  console.debug("[findPlaceId] :: ", { placeName, placeAddress });
  return data.candidates.length > 0 ? data.candidates[0].place_id : null;
};

const getPlaceDetailsAndPhoto = async (placeId, fields, apiKey) => {
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
  const response = await fetch(detailsUrl);
  const data = await response.json();

  if (!data.result.photos) {
    return { ...data.result, photo_url: null };
  }

  const photoReference = data.result.photos[0].photo_reference;
  const photo_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1024&photoreference=${photoReference}&key=${apiKey}`;
  console.debug("[getPlaceDetailsAndPhoto] :: ", { placeId, fields, photo_url });
  return { ...data.result, photo_url };
};

const fetchPlacesDetails = async (places, apiKey) => {
  const results = [];

  for (const place of places) {
    const placeId = await findPlaceId(place.n, place.a, apiKey); // Using address to find the place ID
    if (!placeId) {
      console.log(`No Place ID found for: ${place.n}`);
      continue;
    }

    const details = await getPlaceDetailsAndPhoto(
      placeId,
      "rating,user_ratings_total,international_phone_number,opening_hours,price_level,photo",
      apiKey
    );
    console.debug("[fetchPlacesDetails - placeId]", { placeId, place, details });

    results.push({ ...place, details });
  }

  return results;
};

module.exports.generate = async (req, res) => {
  try {
    // Get request body
    const {
      user,
      destination,
      country,
      byDate,
      fromDate,
      toDate,
      duration,
      selectedMonth,
      traveler,
      budget,
      interests,
    } = req.body;
    const lang = req.headers["accept-language"];
    const languageId = await Language.findOne({ value: lang });

    // Assuming each client connects with a unique socket ID
    const socketId = req.body.socketId;
    const socket = io;

    // Initial progress update
    socket.emit("progress", { message: "Starting itinerary generation...", progress: 0 });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("Starting itinerary generation...");
      }
    });

    // Generate summary and tips
    socket.emit("progress", { message: "Generating summary and tips...", progress: 25 });
    const chosenTraveler = await Traveler.findById(traveler);
    const chosenBudget = await Budget.findById(budget);

    const placeId = await findPlaceId(destination?.name, destination?.country, process.env.GOOGLE_API_KEY);
    const google_details = await getPlaceDetailsAndPhoto(placeId, "photo", process.env.GOOGLE_API_KEY);
    const google_image = google_details?.photo_url;

    const infoPrompt = `Provide a brief summary, a few tips (array of string), and a flag emoji (from emojipedia) for a trip to ${destination?.name}, ${destination?.country} in JSON format`;
    console.debug("[TripController - generate info prompt] :: ", infoPrompt);

    const infoChatCompletion = await generateCompletion(infoPrompt, "gpt-3.5-turbo-1106");

    // Generate places to visit
    socket.emit("progress", { message: "Generating places to visit...", progress: 50 });

    const placesPrompt =
      `Create a complete JSON itinerary to ${destination?.name}, ${destination?.country} ` +
      (byDate
        ? `from ${fromDate} to ${toDate} (${duration + 1} days) ${chosenTraveler?.title}.`
        : `for ${duration} in ${selectedMonth} as ${chosenTraveler}.`) +
      ` Focusing on ${interests} ` +
      `with a ${chosenBudget?.title} budget. ` +
      "Include three meals daily and three interest-based activities. " +
      "Format: [{ 'd': '', 'p': [{ 't': '',  'n': '', 'a': '', 'c': { 'lat': '', 'lng': '' }, 'i': ''} ]}]. " +
      "d: date, p: places (array), t: type (restaurant/landmark), n: name, a: address, c: coordinates, i: description";

    console.debug("[TripController - generate places prompt] :: ", placesPrompt);

    const placesChatCompletion = await generateCompletion(placesPrompt, "gpt-4-turbo");

    // Parse info and places JSON objects
    socket.emit("progress", { message: "Finalizing details...", progress: 75 });
    const parsedInfoObject = JSON.parse(infoChatCompletion.choices[0].message.content);
    const parsedPlacesObject = JSON.parse(placesChatCompletion.choices[0].message.content);

    let placeDetails = [];
    const placesMap = (Array.isArray(parsedPlacesObject) ? parsedPlacesObject : parsedPlacesObject?.itinerary)?.flatMap(
      (place) => place.p
    );
    console.debug("placesMap", placesMap);
    try {
      placeDetails = await fetchPlacesDetails(placesMap, process.env.GOOGLE_API_KEY);
    } catch (error) {
      console.error("Error fetching place details:", error);
    }

    //rating,user_ratings_total,international_phone_number,opening_hours,price_level,photo
    const places = parsedPlacesObject?.itinerary.map((place) => {
      return {
        date: place.d,
        list: place.p.map((p) => {
          const details = placeDetails.find((detail) => detail.n === p.n && detail.a === p.a)?.details;
          return {
            type: p.t,
            name: p.n,
            address: p.a,
            coordinates: p.c,
            description: p.i,
            userRatingsTotal: details?.user_ratings_total,
            internationalPhone: details?.international_phone_number,
            rating: details?.rating,
            openingHours: details?.opening_hours,
            photoUrl: details?.photo_url,
            priceLevel: details?.price_level,
          };
        }),
      };
    });

    console.debug("[generate] :: ", { parsedPlacesObject, placeDetails, places });

    // Creating a new document in the collection
    const tripData = {
      image: google_image,
      language: languageId,
      name: destination.name,
      country: destination.country,
      flag: parsedInfoObject.flag,
      tips: parsedInfoObject.tips,
      description: parsedInfoObject.summary,
      fromDate,
      toDate,
      traveler,
      budget,
      user,
      places,
      status: "upcoming",
    };

    const savedTrip = await new Trip(tripData).save();
    const result = await Trip.findById(savedTrip._id).populate("language").populate("traveler").populate("budget");

    socket.emit("progress", { message: "Itinerary generation complete.", progress: 100 });

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.socketTest = async (req, res) => {
  // const socketId = req.body.socketId;
  // console.debug('socketId', socketId)
  // const socket = io.of("/");

  // Initial progress update
  io.of("/").emit("progress", { message: "Starting itinerary generation...", progress: 0 });

  // Generate summary and tips
  io.of("/").emit("progress", { message: "Generating summary and tips...", progress: 25 });

  // Generate places to visit
  io.of("/").emit("progress", { message: "Generating places to visit...", progress: 50 });

  // Parse info and places JSON objects
  io.of("/").emit("progress", { message: "Finalizing details...", progress: 75 });

  // Creating a new document in the collection
  io.of("/").emit("progress", { message: "Itinerary generation complete.", progress: 100 });

  return res.status(200).json({
    success: true,
    result: null,
  });
};

module.exports.tripsByUser = async (req, res) => {
  try {
    const user = req.params.id;
    const trips = await Trip.find({ user }).populate("language").populate("traveler").populate("budget");

    // Check if today is between one of the trip dates (fromDate and toDate), if yes make modify its status to "active"
    // and if today exceeds toDate, make its status "expired"
    const today = new Date();
    trips.forEach((trip) => {
      const fromDate = new Date(trip.fromDate);
      const toDate = new Date(trip.toDate);
      if (today >= fromDate && today <= toDate) {
        trip.status = "active";
      } else if (today > toDate) {
        trip.status = "expired";
      }
    });

    return res.status(200).json({
      success: true,
      result: trips,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
