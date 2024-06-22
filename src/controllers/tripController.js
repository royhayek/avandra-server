const axios = require("axios");
const OpenAI = require("openai");
const mongoose = require("mongoose");

const Trip = mongoose.model("Trip");
const Budget = mongoose.model("Budget");
const Traveler = mongoose.model("Traveler");
const Language = mongoose.model("Language");
const Destination = mongoose.model("Destination");

const methods = require("./crudController");
const { formatDateToYYYYMMD } = require("../helpers");

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

const getPlaceDetailsAndPhoto = async (placeId, fields, apiKey, language) => {
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=${language?.value}`;
  const response = await fetch(detailsUrl);
  const data = await response.json();

  if (!data.result.photos) {
    return { ...data.result, photo_url: null };
  }

  const photoReference = data.result.photos[0].photo_reference;
  const photo_url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1024&photoreference=${photoReference}&key=${apiKey}`;

  return { ...data.result, photo_url };
};

const fetchPlacesDetails = async (places, apiKey, language) => {
  const results = [];

  for (const place of places) {
    const placeId = await findPlaceId(place.n, place.a, apiKey); // Using address to find the place ID
    if (!placeId) {
      console.log(`No Place ID found for: ${place.n}, ${place.a}`);
      continue;
    }

    const details = await getPlaceDetailsAndPhoto(
      placeId,
      "name,rating,user_ratings_total,website,type,international_phone_number,opening_hours,price_level,photo,photos,icon,geometry",
      apiKey,
      language
    );

    results.push({ ...place, details });
  }

  return results;
};

module.exports.generate = (io) => async (req, res) => {
  try {
    const regenerating = req.body.regenerate;
    const tripId = req.body._id;
    let tripData;

    // if Regenerating, take the payload from the existing trip and format data
    if (regenerating) {
      const trip = await Trip.findById(tripId)
        .populate("language")
        .populate("payload.traveler")
        .populate("payload.budget");

      if (!trip) {
        return res.status(404).send("Trip not found");
      }

      // Extract the necessary fields from the trip object
      const { user, payload: tripPayload } = trip;
      const { name, country, byDate, duration, fromDate, toDate, selectedMonth, traveler, budget, interests } =
        tripPayload;

      tripData = {
        user,
        destination: {
          name,
          country,
        },
        byDate,
        fromDate,
        toDate,
        duration,
        selectedMonth,
        traveler: traveler?._id,
        budget: budget?._id,
        interests,
      };
    } else {
      tripData = req.body;
    }

    // Get request body
    const { user, destination, byDate, fromDate, toDate, duration, selectedMonth, traveler, budget, interests } =
      tripData;
    const lang = req.headers["accept-language"];
    const language = await Language.findOne({ value: lang });

    // Generate summary and tips
    const chosenTraveler = await Traveler.findById(traveler);
    const chosenBudget = await Budget.findById(budget);
    const placeId = await findPlaceId(destination?.name, destination?.country, process.env.GOOGLE_API_KEY);

    const infoPrompt = `Provide a brief summary (300 char max), a few tips (array of string), a country flag for a trip to ${destination?.name}, ${destination?.country}, and location (city center coordinates lat and lng) in JSON format and in ${language?.label}`;
    console.debug("[TripController - generate info prompt] :: ", infoPrompt);

    const infoChatCompletion = await generateCompletion(infoPrompt, "gpt-4o");

    // Generate places to visit
    const placesPrompt =
      `Create a complete JSON itinerary in ${language?.label} to ${destination?.name}, ${destination?.country} ` +
      (byDate
        ? `from ${fromDate} to ${toDate} (${duration + 1} days) for ${chosenTraveler?.title}.`
        : `for ${duration} days in ${selectedMonth} as ${chosenTraveler?.title}.`) +
      ` Focusing on ${interests} ` +
      `with a ${chosenBudget?.title} budget. ` +
      "Include three meals daily and three fixed interest-based activities. " +
      "Format: [{d:'',p:[{n:'',a:''}]}]. " +
      "d: date, p: places (array), n: place name, a: address";

    console.debug("[TripController - generate places prompt] :: ", placesPrompt);

    const placesChatCompletion = await generateCompletion(placesPrompt, "gpt-4o", 0.5, 0.5);

    // Parse info and places JSON objects
    const parsedInfoObject = JSON.parse(infoChatCompletion.choices[0].message.content);
    const parsedPlacesObject = JSON.parse(placesChatCompletion.choices[0].message.content);
    console.debug("parsedPlacesObject", parsedPlacesObject);

    let placeDetails = [];
    const placesMap = (Array.isArray(parsedPlacesObject) ? parsedPlacesObject : parsedPlacesObject?.itinerary)?.flatMap(
      (place) => place.p
    );

    try {
      placeDetails = await fetchPlacesDetails(placesMap, process.env.GOOGLE_API_KEY, lang);
    } catch (error) {
      console.error("Error fetching place details:", error);
    }

    //rating,user_ratings_total,international_phone_number,opening_hours,price_level,photo
    const places = parsedPlacesObject?.itinerary.map((place) => ({
      date: place.d,
      list: place.p.map((p, i) => {
        const details = placeDetails.find((detail) => detail.n === p.n && detail.a === p.a)?.details;
        if (details) {
          return {
            type: p.t,
            name: p.n,
            address: p.a,
            types: details?.types,
            photos: details?.photos,
            rating: details?.rating,
            website: details?.website,
            displayName: details?.name,
            photoUrl: details?.photo_url,
            priceLevel: details?.price_level,
            openingHours: details?.opening_hours,
            coordinates: details?.geometry?.location,
            userRatingsTotal: details?.user_ratings_total,
            internationalPhone: details?.international_phone_number,
          };
        }
      }),
    }));

    let image = "",
      imagePath = "trip";
    const existingDestination = await Destination.findOne({ name: destination.name, country: destination.country });
    if (existingDestination) {
      image = existingDestination?.image;
      imagePath = "destination";
    } else {
      const google_details = await getPlaceDetailsAndPhoto(placeId, "photo", process.env.GOOGLE_API_KEY);
      image = google_details?.photo_url;
    }

    // Creating a new document in the collection
    const payload = {
      name: destination.name,
      country: destination.country,
      traveler,
      fromDate,
      toDate,
      byDate,
      selectedMonth,
      duration,
      interests,
      budget,
    };

    const data = {
      payload,
      user,
      image,
      places,
      imagePath,
      status: "upcoming",
      language: language,
      flag: parsedInfoObject.flag,
      tips: parsedInfoObject.tips,
      location: parsedInfoObject.location,
      description: parsedInfoObject.summary,
    };

    // Finalizing and saving the trip details
    const savedTrip =
      regenerating && tripId
        ? await Trip.findByIdAndUpdate(tripId, data, { new: true }) // Update existing trip
        : await new Trip(data).save(); // Store new trip

    return res.status(200).json({
      success: true,
      result: {
        _id: savedTrip?._id,
      },
    });
  } catch (err) {
    console.error(err);
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
    const trips = await Trip.find({ user })
      .populate("language")
      .populate("payload.traveler")
      .populate("payload.budget");

    // Check if today is between one of the trip dates (fromDate and toDate), if yes make modify its status to "active"
    // and if today exceeds toDate, make its status "expired"
    const today = new Date();
    trips.forEach((trip) => {
      const fromDate = new Date(trip.payload.fromDate);
      const toDate = new Date(trip.payload.toDate);
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
    const { date, list } = req.body;

    const currentTripPlaces = await Trip.findById(id).select("places");
    const currentDayPlaces = currentTripPlaces.places.find((place) => place.date === date)?.list;

    const formattedPlaces = [...currentDayPlaces, ...list];

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
    const types = ["restaurant", "bar", "cafe", "park", "museum", "shopping_mall"]; // Type to filter places
    const radius = 1000.0; // Radius in meters
    const maxResultCount = 10; // Limit the nmumber of results to 10

    const trip = await Trip.findById(id).select("location");
    const { lat, lng } = trip.location;

    const apiUrl = "https://places.googleapis.com/v1/places:searchNearby";

    // Construct request body
    const requestBody = {
      includedTypes: types,
      maxResultCount,
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng,
          },
          radius,
        },
      },
      rankPreference: "POPULARITY",
    };

    // Make POST request to Nearby Search (New) API
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
        "X-Goog-FieldMask":
          "places.displayName,places.location,places.photos,places.id,places.rating,places.internationalPhoneNumber,places.types,places.editorialSummary,places.formattedAddress,places.currentOpeningHours,places.photos,places.userRatingCount,places.priceLevel,places.types",
      },
    });

    // Extract places from the response
    const places = response.data.places;
    const formattedPlaces = places.map((place, index) => ({
      placeId: place?.id,
      types: place?.types,
      photos: place?.photos,
      rating: place?.rating,
      website: place?.website,
      priceLevel: place?.priceLevel,
      name: place?.displayName?.text,
      address: place?.formattedAddress,
      displayName: place?.displayName?.text,
      userRatingsTotal: place?.userRatingCount,
      description: place?.editorialSummary?.text,
      internationalPhone: place?.internationalPhoneNumber,
      type: place?.types.includes("restaurant") ? "restaurant" : "landmark",
      coordinates: { lat: place?.location.latitude, lng: place?.location.longitude },
      openingHours: { weekday_text: place?.currentOpeningHours?.weekdayDescriptions },
      photoUrl: `https://places.googleapis.com/v1/${place?.photos?.[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${apiKey}`,
    }));

    return res.status(200).json({
      success: true,
      result: formattedPlaces,
    });
  } catch (err) {
    // console.error("Error fetching popular establishment places:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.getTripById = async (req, res) => {
  const { id } = req.params;

  try {
    const trip = await Trip.findById(id).populate("language").populate("payload.traveler").populate("payload.budget");

    if (!trip) {
      return res.status(404).json({ success: false, error: "Trip not found" });
    }

    return res.status(200).json({ success: true, result: trip });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.updateTripStatus = async () => {
  try {
    const today = formatDateToYYYYMMD(new Date());

    // Set status to 'active' if today is within fromDate and toDate
    const activateTrips = await Trip.updateMany(
      {
        "payload.fromDate": { $lte: today },
        "payload.toDate": { $gte: today },
        status: "upcoming",
      },
      { $set: { status: "active" } }
    );
    console.log(`Activated ${activateTrips.nModified} trips`);

    // Set status to 'expired' if today is past toDate
    const expireTrips = await Trip.updateMany(
      {
        "payload.toDate": { $lt: today },
        status: { $in: ["upcoming", "active"] },
      },
      { $set: { status: "expired" } }
    );
    console.log(`Expired ${expireTrips.nModified} trips`);
  } catch (error) {
    console.error("Error updating trip statuses:", error);
  }
};
