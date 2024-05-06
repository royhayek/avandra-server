const OpenAI = require("openai");
const mongoose = require("mongoose");
const wss = require("../../websocket");
const path = require("path");

const Trip = mongoose.model("Trip");
const Budget = mongoose.model("Budget");
const Traveler = mongoose.model("Traveler");
const Language = mongoose.model("Language");
const Destination = mongoose.model("Destination");

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

const generateCompletion = async (content, model, temperature = 0.5, top_p = 0.9) => {
  try {
    return await openai.chat.completions.create({
      messages: [{ role: "system", content }],
      model,
      top_p: top_p, // Control diversity of responses, narrower slice of the probability distribution
      temperature: temperature, // Control randomness (0 is deterministic, 1 is more random)
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

  return { ...data.result, photo_url };
};

const fetchPlacesDetails = async (places, apiKey, updateProgress) => {
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

    updateProgress("Generating places to visit...", 1);

    results.push({ ...place, details });
  }

  return results;
};

module.exports.generate = (io) => async (req, res) => {
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
    const socket = io.to(socketId);

    // Initialize progress
    let progress = 0;

    function updateProgress(message, increment) {
      progress += increment;
      socket.emit("progress", { message, percent: Math.min(progress, 100) });
    }

    // Emit initial progress
    updateProgress("Starting itinerary generation...", 1);

    // Generate summary and tips
    const chosenTraveler = await Traveler.findById(traveler);
    updateProgress("Generating summary and tips...", 2);

    const chosenBudget = await Budget.findById(budget);
    updateProgress("Generating summary and tips...", 2);

    const placeId = await findPlaceId(destination?.name, destination?.country, process.env.GOOGLE_API_KEY);
    updateProgress("Generating summary and tips...", 3);

    const google_details = await getPlaceDetailsAndPhoto(placeId, "photo", process.env.GOOGLE_API_KEY);
    updateProgress("Generating summary and tips...", 2);

    const googleImage = google_details?.photo_url;

    updateProgress("Generating summary and tips...", 2);

    const infoPrompt = `Provide a brief summary, a few tips (array of string), a country flag for a trip to ${destination?.name}, ${destination?.country}, and location (city center coordinates lat and lng) in JSON format`;
    console.debug("[TripController - generate info prompt] :: ", infoPrompt);

    const infoChatCompletion = await generateCompletion(infoPrompt, "gpt-3.5-turbo-1106");
    for (let i = 0; i < 20; i++) {
      // Artificially creating smaller steps
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulating some work
      updateProgress("Generating summary and tips...", 1);
    }

    // Generate places to visit
    const placesPrompt =
      `Create a complete JSON itinerary to ${destination?.name}, ${destination?.country} ` +
      (byDate
        ? `from ${fromDate} to ${toDate} (${duration + 1} days) ${chosenTraveler?.title}.`
        : `for ${duration} in ${selectedMonth} as ${chosenTraveler}.`) +
      ` Focusing on ${interests} ` +
      `with a ${chosenBudget?.title} budget. ` +
      "Include three meals daily and three interest-based activities. " +
      "Format: [{'d':'','p':[{'t':'','n':'','a':'','c':{'lat':'','lng':''}}]}]. " +
      "d: date, p: places (array), t: type (restaurant/landmark), n: name, a: address, c: coordinates";

    console.debug("[TripController - generate places prompt] :: ", placesPrompt);

    updateProgress("Generating places to visit...", 2);
    const placesChatCompletion = await generateCompletion(placesPrompt, "gpt-4-turbo", 0.5, 0.5);
    for (let i = 0; i < 30; i++) {
      // Artificially creating smaller steps
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulating some work
      updateProgress("Generating places to visit....", 1);
    }

    // Parse info and places JSON objects
    const parsedInfoObject = JSON.parse(infoChatCompletion.choices[0].message.content);
    const parsedPlacesObject = JSON.parse(placesChatCompletion.choices[0].message.content);

    let placeDetails = [];
    const placesMap = (Array.isArray(parsedPlacesObject) ? parsedPlacesObject : parsedPlacesObject?.itinerary)?.flatMap(
      (place) => place.p
    );

    try {
      placeDetails = await fetchPlacesDetails(placesMap, process.env.GOOGLE_API_KEY, updateProgress);
    } catch (error) {
      console.error("Error fetching place details:", error);
    }

    //rating,user_ratings_total,international_phone_number,opening_hours,price_level,photo
    const places = parsedPlacesObject?.itinerary.map((place) => {
      updateProgress("Generating places to visit...", 3);

      return {
        date: place.d,
        list: place.p.map((p, i) => {
          const details = placeDetails.find((detail) => detail.n === p.n && detail.a === p.a)?.details;
          return {
            order: i,
            type: p.t,
            name: p.n,
            address: p.a,
            coordinates: p.c,
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

    let image = googleImage;
    const existingDestination = await Destination.findOne({ name: destination.name, country: destination.country });
    if (existingDestination) {
      image = `${req.protocol}://${req.headers.host}/uploads/destination/image/${existingDestination?.image}`;
    }

    // Creating a new document in the collection
    const tripData = {
      user,
      image,
      toDate,
      budget,
      places,
      fromDate,
      traveler,
      status: "upcoming",
      language: languageId,
      name: destination.name,
      country: destination.country,
      flag: parsedInfoObject.flag,
      tips: parsedInfoObject.tips,
      location: parsedInfoObject.location,
      description: parsedInfoObject.summary,
    };

    // Finalizing and saving the trip details
    updateProgress("Finalizing details...", 5);

    const savedTrip = await new Trip(tripData).save();
    const result = await Trip.findById(savedTrip._id).populate("language").populate("traveler").populate("budget");

    updateProgress("Itinerary generation complete.", 2);

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (err) {
    console.error(err);
    socket.emit("progress", { message: "Error generating itinerary", percent: progress });
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.socketTest = (io) => {
  return async (req, res) => {
    const socketId = req.body.socketId;
    const socket = io.to(socketId);

    // Initial progress update
    socket.emit("progress", { message: "Started generating your trip...", percent: 0 });

    // Generate summary and tips
    socket.emit("progress", { message: "Generating summary and tips...", percent: 25 });

    // Generate places to visit
    socket.emit("progress", { message: "Generating places to visit...", percent: 50 });

    // Parse info and places JSON objects
    socket.emit("progress", { message: "Finalizing details...", percent: 75 });

    // Creating a new document in the collection
    socket.emit("progress", { message: "Itinerary generation complete.", percent: 100 });

    return res.status(200).json({
      success: true,
      result: null,
    });
  };
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

module.exports.readTripPlaces = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id).select("places");

    return res.status(200).json({
      success: true,
      result: trip.places,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.saveAdditional = async (req, res) => {
  try {
    const { id } = req.params;
    // console.debug("id", id);
    // console.debug("req.params", req.params);
    // const { gallery } = req.body;
    // console.debug("req.body", req.body);

    // get itineraries of a trip by its id and add to it the array of places coming from req.body
    const { date, list } = req.body;

    const currentTripPlaces = await Trip.findById(id).select("places");
    const currentDayPlaces = currentTripPlaces.places.find((place) => place.date === date)?.list;
    // console.debug("currentDayPlaces", currentDayPlaces);

    const newlyAddedPlaces = list.map((place, index) => ({
      order: currentDayPlaces?.length + index,
      name: place?.name,
      rating: place?.rating,
      priceLevel: place?.price_level,
      address: place?.formatted_address,
      openingHours: place?.opening_hours,
      userRatingsTotal: place?.user_ratings_total,
      description: place?.editorial_summary?.overview,
      internationalPhone: place?.international_phone_number,
      type: place?.type?.includes("restaurant") ? "restaurant" : "landmark",
      coordinates: { lat: place?.geometry?.location?.lat, lng: place?.geometry?.location?.lng },
      photoUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1024&photoreference=${place?.photos[0]?.photo_reference}&key=${process.env.GOOGLE_API_KEY}`,
    }));

    const formattedPlaces = [...currentDayPlaces, ...newlyAddedPlaces];

    currentTripPlaces.places[currentTripPlaces.places.findIndex((place) => place.date === date)].list = formattedPlaces;
    await currentTripPlaces.save();

    return res.status(200).json({
      success: true,
      result: formattedPlaces,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.deletePlace = async (req, res) => {
  try {
    const { id, placeId, date } = req.params;

    const currentTripPlaces = await Trip.findById(id).select("places");
    const currentDayPlaces = currentTripPlaces.places.find((place) => place.date === date)?.list;

    const updatedPlaces = currentDayPlaces.filter((place) => place._id.toString() !== placeId);

    currentTripPlaces.places[currentTripPlaces.places.findIndex((place) => place.date === date)].list = updatedPlaces;
    await currentTripPlaces.save();

    return res.status(200).json({
      success: true,
      result: currentTripPlaces,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.updateTripPlaces = async (req, res) => {
  try {
    const { id } = req.params;
    const { places } = req.body;

    const currentTripPlaces = await Trip.findById(id).select("places");
    console.debug("[updateTripPlaces] :: ", places);
    currentTripPlaces.places = places;
    await currentTripPlaces.save();

    return res.status(200).json({
      success: true,
      result: currentTripPlaces,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.getPopularPlaces = async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.GOOGLE_API_KEY; // Replace with your actual API key
    const radius = 5000; // Radius in meters
    const type = "establishment"; // Type to filter places

    const trip = await Trip.findById(id).select("location");
    const { lat, lng } = trip.location;

    // Construct API URL
    const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${apiKey}&rankby=prominence&type=${type}`;

    const response = await fetch(apiUrl);
    const data = await response.json();
    const places = data.results;

    return res.status(200).json({
      success: true,
      result: places,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
