import express from "express";
import db from "../models/index.js";
import auth from "../middleware/auth.js";

const router = express.Router();
const ML_API_URL = (process.env.ML_API_URL || "http://127.0.0.1:8001").replace(
  /\/+$/,
  "",
);
const SQM_PER_ACRE = 4046.8564224;

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toNumber = (value, fieldName, { min = null } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (min !== null && parsed < min) {
    throw new Error(`${fieldName} must be >= ${min}`);
  }
  return parsed;
};

const normalizeLocationKey = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const SUBCOUNTY_MODEL_CODE_MAP = {
  DAGORETTINORTH: "1",
  DAGORETTISOUTH: "1",
  DAGORETTINORTHDAGORETTISOUTH: "1",
  EMBAKASISOUTH: "2",
  EMBAKASINORTH: "2",
  EMBAKASICENTRAL: "2",
  EMBAKASIEAST: "2",
  EMBAKASIWEST: "2",
  KASARANI: "4",
  ROYSAMBU: "4",
  KIBRA: "5",
  LANGATA: "6",
  MAKADARA: "7",
  RUARAKA: "9",
  MATHARE: "9",
  NJIRU: "9",
  STAREHE: "10",
  KAMUKUNJI: "10",
  WESTLANDS: "11",
};

const encodeCountyForModel = (county) => {
  const normalized = normalizeLocationKey(county);
  if (normalized === "NAIROBI" || normalized === "NAIROBICITY") {
    return "Nairobi City";
  }
  return String(county || "").trim();
};

const encodeSubcountyForModel = (subcounty) => {
  const raw = String(subcounty || "").trim();
  if (!raw) return raw;
  if (/^\d+$/.test(raw) || raw === ".A") return raw;

  const normalized = normalizeLocationKey(raw);
  const mappedCode = SUBCOUNTY_MODEL_CODE_MAP[normalized];
  return mappedCode || raw;
};

const amenityPatterns = {
  parking_lot_present: ["parking", "car park"],
  designated_servant_quarter_present: ["servant quarter", "dsq", "servant room"],
  cctvs_present: ["cctv", "camera", "surveillance"],
  elevator_present: ["elevator", "lift"],
  garden_backyard_play_area_present: ["garden", "backyard", "play area", "playground"],
  swimming_pool_present: ["swimming pool", "pool"],
  backup_generator_present: ["backup generator", "generator"],
  fixed_internet_infrastructure_present: ["internet", "fiber", "wifi", "wi fi"],
  solar_water_heating_system_present: ["solar water heating", "solar water"],
  solar_lighting_system_present: ["solar lighting"],
  gym_present: ["gym", "fitness"],
  fire_safety_precautions_present: ["fire safety", "fire alarm", "sprinkler"],
  solar_security_lighting: ["solar security lighting", "security lighting"],
  access_ramp_present: ["access ramp", "ramp"],
};

const hasMatchingAmenity = (normalizedAmenityNames, patterns) =>
  patterns.some((pattern) => {
    const normalizedPattern = normalizeText(pattern);
    return normalizedAmenityNames.some((name) => name.includes(normalizedPattern));
  });

const buildFastApiPayload = (source, amenityNames = []) => {
  const normalizedAmenityNames = amenityNames.map((name) => normalizeText(name));
  const landSizeSqm = toNumber(source.land_size_sqm, "land_size_sqm", { min: 0 });

  return {
    property_type: String(source.property_type || "").trim(),
    bedrooms: toNumber(source.bedrooms, "bedrooms", { min: 0 }),
    bathrooms: toNumber(source.bathrooms, "bathrooms", { min: 0 }),
    parking_lot_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.parking_lot_present,
    )
      ? 1
      : 0,
    designated_servant_quarter_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.designated_servant_quarter_present,
    )
      ? 1
      : 0,
    cctvs_present: hasMatchingAmenity(normalizedAmenityNames, amenityPatterns.cctvs_present)
      ? 1
      : 0,
    elevator_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.elevator_present,
    )
      ? 1
      : 0,
    garden_backyard_play_area_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.garden_backyard_play_area_present,
    )
      ? 1
      : 0,
    swimming_pool_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.swimming_pool_present,
    )
      ? 1
      : 0,
    backup_generator_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.backup_generator_present,
    )
      ? 1
      : 0,
    fixed_internet_infrastructure_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.fixed_internet_infrastructure_present,
    )
      ? 1
      : 0,
    solar_water_heating_system_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.solar_water_heating_system_present,
    )
      ? 1
      : 0,
    solar_lighting_system_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.solar_lighting_system_present,
    )
      ? 1
      : 0,
    gym_present: hasMatchingAmenity(normalizedAmenityNames, amenityPatterns.gym_present) ? 1 : 0,
    fire_safety_precautions_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.fire_safety_precautions_present,
    )
      ? 1
      : 0,
    solar_security_lighting: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.solar_security_lighting,
    )
      ? 1
      : 0,
    access_ramp_present: hasMatchingAmenity(
      normalizedAmenityNames,
      amenityPatterns.access_ramp_present,
    )
      ? 1
      : 0,
    county: encodeCountyForModel(source.county),
    subcounty: encodeSubcountyForModel(source.subcounty),
    floor_area_square_meters: toNumber(source.size_sqm, "size_sqm", { min: 0 }),
    year_property_was_advertised:
      source.year_property_was_advertised ??
      source.year_advertised ??
      new Date().getFullYear(),
    land_size_acres: landSizeSqm / SQM_PER_ACRE,
    year_of_house_construction_completion: toNumber(source.year_built, "year_built", {
      min: 1800,
    }),
  };
};

const fetchAmenityNamesByIds = async (amenityIds) => {
  if (!Array.isArray(amenityIds) || amenityIds.length === 0) return [];

  const parsedIds = amenityIds.map((id) => Number(id)).filter(Number.isInteger);
  if (parsedIds.length === 0) return [];

  const amenities = await db.Amenity.findAll({
    where: { id: parsedIds },
    attributes: ["name"],
  });

  return amenities.map((amenity) => amenity.name);
};

const callFastApiPredict = async (payload) => {
  const response = await fetch(`${ML_API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`FastAPI prediction failed (${response.status}): ${errorBody}`);
  }

  return response.json();
};

// Predict from request body, save estimate record (property_id optional)
router.post("/predict", auth, async (req, res) => {
  try {
    const { property_id, amenity_ids = [], ...sourceData } = req.body;
    let sourceForPrediction = { ...sourceData };
    let amenityNames = await fetchAmenityNamesByIds(amenity_ids);
    let property = null;

    if (property_id) {
      property = await db.Property.findByPk(property_id, {
        include: [
          {
            model: db.Amenity,
            as: "amenities",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
      });

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (property.seller_id !== req.user.id) {
        return res.status(403).json({ error: "You can only update your own properties" });
      }

      sourceForPrediction = {
        property_type: property.property_type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        size_sqm: property.size_sqm,
        land_size_sqm: property.land_size_sqm,
        year_built: property.year_built,
        county: property.county,
        subcounty: property.subcounty,
        ...sourceData,
      };

      if (amenityNames.length === 0) {
        amenityNames = (property.amenities || []).map((amenity) => amenity.name);
      }
    }

    const payload = buildFastApiPayload(sourceForPrediction, amenityNames);

    const predictionResult = await callFastApiPredict(payload);
    const predictedPrice = predictionResult.predicted_price;

    const estimate = await db.PriceEstimate.create({
      property_id: property_id || null,
      source_type: "ml_fastapi_et",
      predicted_price: predictedPrice,
      input_features_json: payload,
    });

    if (property) {
      await property.update({ predicted_price: predictedPrice });
    }

    res.status(200).json({
      message: "Price predicted successfully",
      data: {
        price_estimate_id: estimate.id,
        property_id: estimate.property_id,
        predicted_price: Number(predictedPrice),
        model_r2: predictionResult.model_r2 ?? null,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Predict from an existing property + its saved amenities, then persist estimate + property.predicted_price
router.post("/property/:id/predict", auth, async (req, res) => {
  try {
    const property = await db.Property.findByPk(req.params.id, {
      include: [
        {
          model: db.Amenity,
          as: "amenities",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.seller_id !== req.user.id) {
      return res.status(403).json({ error: "You can only predict price for your own properties" });
    }

    const amenityNames = (property.amenities || []).map((amenity) => amenity.name);
    const payload = buildFastApiPayload(property, amenityNames);
    const predictionResult = await callFastApiPredict(payload);
    const predictedPrice = predictionResult.predicted_price;

    const estimate = await db.PriceEstimate.create({
      property_id: property.id,
      source_type: "ml_fastapi_et",
      predicted_price: predictedPrice,
      input_features_json: payload,
    });

    await property.update({ predicted_price: predictedPrice });

    res.status(200).json({
      message: "Price predicted and saved successfully",
      data: {
        price_estimate_id: estimate.id,
        property_id: property.id,
        predicted_price: Number(predictedPrice),
        model_r2: predictionResult.model_r2 ?? null,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;