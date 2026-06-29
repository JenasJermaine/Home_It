import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "pannellum/build/pannellum.css";
import "pannellum/build/pannellum.js";
import {
  buildMediaUrl,
  createPanoramicHotspot,
  createPanoramicScene,
  deletePanoramicHotspot,
  deletePanoramicScene,
  deleteAllHouseImages,
  deleteSingleHouseImage,
  ensureMlModelAmenities,
  getMyProfile,
  getPanoramicTourByProperty,
  getPropertyById,
  modifyBasicHouseInfo,
  modifyHouseAmenities,
  modifyHouseImages,
  predictPriceEstimate,
  updatePanoramicHotspot,
  updatePanoramicScene,
} from "../api/apiService";

const MAX_TOTAL_IMAGES = 15;
const DEFAULT_LAT = -1.2921;
const DEFAULT_LNG = 36.8219;
const YAW_EDGE_LIMIT = 179;

const PannellumTourPreview = ({ scenes, onCoordinatePick }) => {
  const viewerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!viewerRef.current || scenes.length === 0) return;
    const pannellum = window.pannellum;
    if (!pannellum?.viewer) return;

    const toNumber = (value, fallback = 0) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const sceneConfig = {};
    scenes.forEach((scene) => {
      const hotSpots = (scene.hotspots || [])
        .map((hotspot) => {
          const pitch = toNumber(hotspot.pitch, null);
          const yaw = toNumber(hotspot.yaw, null);
          if (pitch === null || yaw === null) return null;

          return {
            pitch,
            yaw,
            type: "scene",
            text: hotspot.text || "",
            sceneId: hotspot.target_scene_id
              ? String(hotspot.target_scene_id)
              : undefined,
          };
        })
        .filter(Boolean);

      sceneConfig[String(scene.id)] = {
        type: "equirectangular",
        panorama: buildMediaUrl(scene.image_url),
        pitch: toNumber(scene.pitch),
        yaw: toNumber(scene.yaw),
        hfov: toNumber(scene.hfov, 110),
        minYaw: -YAW_EDGE_LIMIT,
        maxYaw: YAW_EDGE_LIMIT,
        hotSpots,
      };
    });

    instanceRef.current = pannellum.viewer(viewerRef.current, {
      autoLoad: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      default: {
        firstScene: String(scenes[0]?.id),
        sceneFadeDuration: 1000,
      },
      scenes: sceneConfig,
    });

    const container = instanceRef.current.getContainer();
    const handleClick = (event) => {
      if (!instanceRef.current) return;
      const coords = instanceRef.current.mouseEventToCoords
        ? instanceRef.current.mouseEventToCoords(event)
        : [instanceRef.current.getPitch(), instanceRef.current.getYaw()];
      if (coords && onCoordinatePick) {
        onCoordinatePick(coords);
      }
    };

    container.addEventListener("click", handleClick);

    return () => {
      container.removeEventListener("click", handleClick);
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, [scenes, onCoordinatePick]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: "100%",
        height: "320px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
};

const MyListingDetailsPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPredictingPrice, setIsPredictingPrice] = useState(false);
  const [savingAmenities, setSavingAmenities] = useState(false);
  const [savingImages, setSavingImages] = useState(false);
  const [deletingImages, setDeletingImages] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [coverImage, setCoverImage] = useState("/images/House1.jpg");

  const [allAmenities, setAllAmenities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const newImagesRef = useRef([]);
  const [panoramicScenes, setPanoramicScenes] = useState([]);
  const [showTourPreview, setShowTourPreview] = useState(false);
  const [lastPreviewCoords, setLastPreviewCoords] = useState(null);
  const [newScene, setNewScene] = useState({
    image_url: "",
    name: "",
    pitch: "",
    yaw: "",
    hfov: "",
  });
  const [newHotspots, setNewHotspots] = useState({});
  const [markerPosition, setMarkerPosition] = useState([
    DEFAULT_LAT,
    DEFAULT_LNG,
  ]);

  const [formData, setFormData] = useState({
    description: "",
    property_type: "",
    bedrooms: "",
    bathrooms: "",
    size_sqm: "",
    land_size_sqm: "",
    floors: "",
    year_built: "",
    condition: "",
    county: "",
    subcounty: "",
    latitude: "",
    longitude: "",
    predicted_price: "",
    price: "",
    status: "For Sale",
  });

  const applyPropertyToState = (property) => {
    setCoverImage(
      buildMediaUrl(property.images?.[0]?.image_url) || "/images/House1.jpg",
    );
    setExistingImages(property.images || []);
    setSelectedAmenities(
      (property.amenities || []).map((amenity) => amenity.id),
    );

    setFormData({
      description: property.description || "",
      property_type: property.property_type || "",
      bedrooms: String(property.bedrooms ?? ""),
      bathrooms: String(property.bathrooms ?? ""),
      size_sqm: String(property.size_sqm ?? ""),
      land_size_sqm: String(property.land_size_sqm ?? ""),
      floors: String(property.floors ?? ""),
      year_built: String(property.year_built ?? ""),
      condition: property.condition || "",
      county: property.county || "",
      subcounty: property.subcounty || "",
      latitude: String(property.latitude ?? ""),
      longitude: String(property.longitude ?? ""),
      predicted_price: String(property.predicted_price ?? ""),
      price: String(property.price ?? ""),
      status: property.status || "For Sale",
    });

    const lat = Number(property.latitude);
    const lng = Number(property.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMarkerPosition([lat, lng]);
    }
  };

  const loadPanoramicScenes = useCallback(async () => {
    try {
      const response = await getPanoramicTourByProperty(id);
      setPanoramicScenes(response.data?.data || []);
    } catch (err) {
      setPanoramicScenes([]);
      setError(
        err.response?.data?.error || "Failed to load panoramic tour data.",
      );
    }
  }, [id]);

  const reloadPropertyOnly = async () => {
    const propertyResponse = await getPropertyById(id);
    const property = propertyResponse.data?.data;
    if (property) {
      applyPropertyToState(property);
    }
    await loadPanoramicScenes();
  };

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const [profileResponse, propertyResponse] = await Promise.all([
          getMyProfile(),
          getPropertyById(id),
        ]);

        const currentUserId = profileResponse.data?.data?.id;
        const property = propertyResponse.data?.data;

        if (!property) {
          setError("Property not found.");
          return;
        }

        if (property.seller?.id !== currentUserId) {
          setError("You can only edit your own property listings.");
          return;
        }

        const loadedAmenities = await ensureMlModelAmenities();
        setAllAmenities(loadedAmenities);
        applyPropertyToState(property);
        await loadPanoramicScenes();
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to load property details.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id, loadPanoramicScenes]);

  const panoramicImages = useMemo(
    () => existingImages.filter((image) => image.image_type === "panoramic"),
    [existingImages],
  );

  const availablePanoramicImages = useMemo(() => {
    const usedImages = new Set(panoramicScenes.map((scene) => scene.image_url));
    return panoramicImages.filter((image) => !usedImages.has(image.image_url));
  }, [panoramicImages, panoramicScenes]);

  const handlePreviewCoordPick = useCallback((coords) => {
    if (!Array.isArray(coords)) return;
    const [pitch, yaw] = coords;
    if (!Number.isFinite(pitch) || !Number.isFinite(yaw)) return;
    setLastPreviewCoords({ pitch, yaw });
  }, []);

  useEffect(() => {
    newImagesRef.current = newImages;
  }, [newImages]);

  useEffect(
    () => () => {
      newImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
    },
    [],
  );

  useEffect(() => {
    if (panoramicScenes.length === 0) {
      setShowTourPreview(false);
      setLastPreviewCoords(null);
    }
  }, [panoramicScenes.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toNumberOrNull = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const updateSceneField = (sceneId, field, value) => {
    setPanoramicScenes((prev) =>
      prev.map((scene) =>
        scene.id === sceneId ? { ...scene, [field]: value } : scene,
      ),
    );
  };

  const saveScene = async (scene) => {
    setError("");
    setSuccessMessage("");
    try {
      await updatePanoramicScene(scene.id, {
        name: scene.name,
        image_url: scene.image_url,
        pitch: toNumberOrNull(scene.pitch),
        yaw: toNumberOrNull(scene.yaw),
        hfov: toNumberOrNull(scene.hfov),
        display_order: scene.display_order ?? 0,
      });
      await loadPanoramicScenes();
      setSuccessMessage("Scene updated successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update scene.");
    }
  };

  const removeScene = async (sceneId) => {
    const confirmed = window.confirm("Delete this scene and its hotspots?");
    if (!confirmed) return;
    setError("");
    setSuccessMessage("");
    try {
      await deletePanoramicScene(sceneId);
      await loadPanoramicScenes();
      setSuccessMessage("Scene deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete scene.");
    }
  };

  const updateHotspotField = (sceneId, hotspotId, field, value) => {
    setPanoramicScenes((prev) =>
      prev.map((scene) => {
        if (scene.id !== sceneId) return scene;
        return {
          ...scene,
          hotspots: (scene.hotspots || []).map((hotspot) =>
            hotspot.id === hotspotId
              ? { ...hotspot, [field]: value }
              : hotspot,
          ),
        };
      }),
    );
  };

  const saveHotspot = async (sceneId, hotspot) => {
    setError("");
    setSuccessMessage("");
    const pitch = Number(hotspot.pitch);
    const yaw = Number(hotspot.yaw);
    if (!hotspot.target_scene_id) {
      setError("Select a target scene for the hotspot.");
      return;
    }
    if (!Number.isFinite(pitch) || !Number.isFinite(yaw)) {
      setError("Enter valid pitch and yaw values for the hotspot.");
      return;
    }
    try {
      await updatePanoramicHotspot(hotspot.id, {
        target_scene_id: Number(hotspot.target_scene_id),
        type: "scene",
        text: String(hotspot.text || "").trim() || null,
        pitch,
        yaw,
      });
      await loadPanoramicScenes();
      setSuccessMessage("Hotspot updated successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update hotspot.");
    }
  };

  const removeHotspot = async (hotspotId) => {
    setError("");
    setSuccessMessage("");
    try {
      await deletePanoramicHotspot(hotspotId);
      await loadPanoramicScenes();
      setSuccessMessage("Hotspot deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete hotspot.");
    }
  };

  const updateNewSceneField = (field, value) => {
    setNewScene((prev) => ({ ...prev, [field]: value }));
  };

  const createScene = async () => {
    if (!newScene.image_url) {
      setError("Select a panoramic image for the new scene.");
      return;
    }
    setError("");
    setSuccessMessage("");
    try {
      await createPanoramicScene(id, {
        name: newScene.name || "New Scene",
        image_url: newScene.image_url,
        pitch: toNumberOrNull(newScene.pitch),
        yaw: toNumberOrNull(newScene.yaw),
        hfov: toNumberOrNull(newScene.hfov),
        display_order: panoramicScenes.length,
      });
      setNewScene({
        image_url: "",
        name: "",
        pitch: "",
        yaw: "",
        hfov: "",
      });
      await loadPanoramicScenes();
      setSuccessMessage("Scene added successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add scene.");
    }
  };

  const updateNewHotspot = (sceneId, field, value) => {
    setNewHotspots((prev) => ({
      ...prev,
      [sceneId]: {
        ...prev[sceneId],
        [field]: value,
      },
    }));
  };

  const addHotspot = async (sceneId) => {
    const draft = newHotspots[sceneId];
    if (!draft?.target_scene_id) {
      setError("Choose a target scene for the hotspot.");
      return;
    }
    const pitch = Number(draft.pitch);
    const yaw = Number(draft.yaw);
    if (!Number.isFinite(pitch) || !Number.isFinite(yaw)) {
      setError("Enter valid pitch and yaw values for the hotspot.");
      return;
    }
    setError("");
    setSuccessMessage("");
    try {
      await createPanoramicHotspot(sceneId, {
        target_scene_id: Number(draft.target_scene_id),
        type: "scene",
        text: String(draft.text || "").trim() || null,
        pitch,
        yaw,
      });
      setNewHotspots((prev) => ({
        ...prev,
        [sceneId]: { target_scene_id: "", pitch: "", yaw: "", text: "" },
      }));
      await loadPanoramicScenes();
      setSuccessMessage("Hotspot added successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add hotspot.");
    }
  };

  const mapMarkerIcon = L.icon({
    iconUrl: "/MapMarker/TranparentBGMapMarker.png",
    iconSize: [55, 85],
    iconAnchor: [27, 80],
  });

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        setFormData((prev) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lng),
        }));
      },
    });

    return <Marker position={markerPosition} icon={mapMarkerIcon}></Marker>;
  };

  const requestPredictedPrice = async ({ showSuccess = true } = {}) => {
    setError("");

    const requiredFields = [
      "property_type",
      "bedrooms",
      "bathrooms",
      "size_sqm",
      "land_size_sqm",
      "year_built",
      "county",
      "subcounty",
    ];

    const hasMissingRequiredField = requiredFields.some(
      (field) => String(formData[field] ?? "").trim() === "",
    );

    if (hasMissingRequiredField) {
      setError(
        "Fill in property type, bedrooms, bathrooms, size, land size, year built, county and subcounty before predicting.",
      );
      return null;
    }

    try {
      setIsPredictingPrice(true);
      const response = await predictPriceEstimate({
        property_id: Number(id),
        property_type: formData.property_type,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        size_sqm: Number(formData.size_sqm),
        land_size_sqm: Number(formData.land_size_sqm),
        year_built: Number(formData.year_built),
        county: formData.county,
        subcounty: formData.subcounty,
        year_property_was_advertised: new Date().getFullYear(),
        amenity_ids: selectedAmenities,
      });

      const predictedPrice = Number(response.data?.data?.predicted_price);
      if (!Number.isFinite(predictedPrice)) {
        throw new Error("Prediction response is missing a valid price.");
      }

      setFormData((prev) => ({
        ...prev,
        predicted_price: String(predictedPrice),
      }));

      if (showSuccess) {
        setSuccessMessage("Predicted price updated from the ML model.");
      }

      return predictedPrice;
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to predict price right now.",
      );
      return null;
    } finally {
      setIsPredictingPrice(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      setSaving(true);
      const predictedPrice = await requestPredictedPrice({ showSuccess: false });
      if (predictedPrice === null) {
        return;
      }

      await modifyBasicHouseInfo(id, {
        description: formData.description,
        property_type: formData.property_type,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        size_sqm: Number(formData.size_sqm),
        land_size_sqm: Number(formData.land_size_sqm),
        floors: Number(formData.floors),
        year_built: Number(formData.year_built),
        condition: formData.condition,
        county: formData.county,
        subcounty: formData.subcounty,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        predicted_price: predictedPrice,
        price: Number(formData.price),
        status: formData.status,
      });

      setSuccessMessage("Basic information updated successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update listing.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (amenityId) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((idValue) => idValue !== amenityId)
        : [...prev, amenityId],
    );
  };

  const saveAmenities = async () => {
    setError("");
    setSuccessMessage("");

    try {
      setSavingAmenities(true);
      await modifyHouseAmenities(id, { amenity_ids: selectedAmenities });
      setSuccessMessage("Amenities updated successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update amenities.");
    } finally {
      setSavingAmenities(false);
    }
  };

  const handleNewImagesChange = (e) => {
    setError("");
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (
      existingImages.length + newImages.length + selectedFiles.length >
      MAX_TOTAL_IMAGES
    ) {
      setError(
        `Maximum ${MAX_TOTAL_IMAGES} images allowed. You currently have ${existingImages.length + newImages.length}.`,
      );
      e.target.value = "";
      return;
    }

    const mapped = selectedFiles.map((file, index) => ({
      id: `${file.name}-${index}-${Date.now()}`,
      file,
      image_type: "normal",
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const changePendingImageType = (index, typeValue) => {
    setNewImages((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, image_type: typeValue } : item,
      ),
    );
  };

  const removePendingImage = (index) => {
    setNewImages((prev) => {
      const image = prev[index];
      if (image) URL.revokeObjectURL(image.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadNewImages = async () => {
    if (newImages.length === 0) {
      setError("Select image(s) first.");
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      setSavingImages(true);
      const payload = new FormData();
      newImages.forEach((image) => {
        payload.append("images", image.file);
      });
      payload.append(
        "image_types",
        JSON.stringify(newImages.map((image) => image.image_type)),
      );

      await modifyHouseImages(id, payload);
      newImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setNewImages([]);
      await reloadPropertyOnly();
      setSuccessMessage("New image(s) uploaded successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload images.");
    } finally {
      setSavingImages(false);
    }
  };

  const deleteOneImage = async (imageId) => {
    setError("");
    setSuccessMessage("");
    try {
      setDeletingImages(true);
      await deleteSingleHouseImage(id, imageId);
      await reloadPropertyOnly();
      setSuccessMessage("Image deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete image.");
    } finally {
      setDeletingImages(false);
    }
  };

  const deleteAllImages = async () => {
    if (existingImages.length === 0) return;
    const confirmed = window.confirm("Delete all images for this listing?");
    if (!confirmed) return;

    setError("");
    setSuccessMessage("");
    try {
      setDeletingImages(true);
      await deleteAllHouseImages(id);
      await reloadPropertyOnly();
      setSuccessMessage("All images deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete all images.");
    } finally {
      setDeletingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Edit Listing</h2>
            <p className="text-muted m-0">
              Update details, amenities and images.
            </p>
          </div>
          <Link to="/Mylistings">
            <i
              className="bi bi-arrow-left me-2 text-primary"
              style={{ fontSize: "30px" }}
            ></i>
          </Link>
        </div>

        {(error || successMessage) && (
          <div
            className={`alert ${error ? "alert-danger" : "alert-success"}`}
            role="alert"
          >
            {error || successMessage}
          </div>
        )}

        {!error && (
          <div className="row g-4">
            <div className="col-7 col-lg-3 mx-auto">
              <div className="card border-primary shadow-sm">
                <img
                  src={coverImage}
                  alt="Property"
                  className="card-img-top"
                  style={{ height: "250px", objectFit: "cover" }}
                />
                <div className="card-body">
                  <h5 className="fw-semibold text-primary mb-1">
                    Ksh. {Number(formData.price || 0).toLocaleString()}
                  </h5>
                  <p className="mb-1">{formData.county}</p>
                  <p className="text-muted">{formData.subcounty}</p>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-8">
              <div className="card border-primary shadow-sm mb-4">
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Description
                      </label>
                      <textarea
                        name="description"
                        rows="4"
                        className="form-control"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Property Type
                        </label>
                        <input
                          name="property_type"
                          className="form-control"
                          value={formData.property_type}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Status</label>
                        <select
                          name="status"
                          className="form-select"
                          value={formData.status}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="For Sale">For Sale</option>
                          <option value="For Rent">Sold</option>
                          <option value="For Rent">Pending</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-semibold">
                          Bedrooms
                        </label>
                        <input
                          type="number"
                          min="0"
                          name="bedrooms"
                          className="form-control"
                          value={formData.bedrooms}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">
                          Bathrooms
                        </label>
                        <input
                          type="number"
                          min="0"
                          name="bathrooms"
                          className="form-control"
                          value={formData.bathrooms}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Floors</label>
                        <input
                          type="number"
                          min="1"
                          name="floors"
                          className="form-control"
                          value={formData.floors}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Size (sqm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="size_sqm"
                          className="form-control"
                          value={formData.size_sqm}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Land Size (sqm)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="land_size_sqm"
                          className="form-control"
                          value={formData.land_size_sqm}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Year Built
                        </label>
                        <input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          name="year_built"
                          className="form-control"
                          value={formData.year_built}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Condition
                        </label>
                        <input
                          name="condition"
                          className="form-control"
                          value={formData.condition}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">County</label>
                        <input
                          name="county"
                          className="form-control"
                          value={formData.county}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Subcounty
                        </label>
                        <input
                          name="subcounty"
                          className="form-control"
                          value={formData.subcounty}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Property Location on Map
                        </label>
                        <p className="text-primary small mb-2">
                          <i className="bi bi-info-circle me-1 text-primary"></i>
                          Click the map to update exact coordinates. The values
                          are saved automatically.
                        </p>
                        <div
                          className="border rounded-3 border-primary"
                          style={{
                            height: "320px",
                            width: "100%",
                            overflow: "hidden",
                          }}
                        >
                          <MapContainer
                            center={markerPosition}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={true}
                          >
                            <TileLayer
                              url="https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png"
                              attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              minZoom={0}
                              maxZoom={20}
                            />
                            <LocationMarker />
                          </MapContainer>
                        </div>
                        <small className="text-primary small">
                          Current location:{" "}
                          {Number(formData.latitude).toFixed(6)},{" "}
                          {Number(formData.longitude).toFixed(6)}
                        </small>
                      </div>

                      <div className="col-12">
                        <div className="border rounded-3 p-3">
                          <h5 className="mb-3 fw-semibold">Amenities</h5>

                          <div className="row">
                            {allAmenities.map((amenity) => (
                              <div className="col-md-6 col-xl-4 mb-2" key={amenity.id}>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`amenity-${amenity.id}`}
                                    checked={selectedAmenities.includes(amenity.id)}
                                    onChange={() => toggleAmenity(amenity.id)}
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor={`amenity-${amenity.id}`}
                                  >
                                    {amenity.name}
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 d-flex justify-content-end">
                            <button
                              type="button"
                              className="btn btn-outline-primary rounded-4 px-4"
                              onClick={saveAmenities}
                              disabled={savingAmenities}
                            >
                              {savingAmenities ? "Saving..." : "Save Amenities"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Predicted Price
                        </label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={
                            formData.predicted_price || "Will use listing price"
                          }
                          readOnly
                          disabled
                        />
                        <small className="text-primary d-block mt-1">
                          Uses the ML prediction endpoint with your current
                          details and selected amenities.
                        </small>
                        <div className="mt-2">
                          <button
                            type="button"
                            className="btn btn-outline-primary rounded-4 px-3"
                            onClick={() => requestPredictedPrice()}
                            disabled={isPredictingPrice}
                          >
                            {isPredictingPrice
                              ? "Predicting..."
                              : "Get Predicted Price"}
                          </button>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Listing Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          name="price"
                          className="form-control"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4 d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn btn-primary rounded-4 px-4"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Basic Info"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card border-primary shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 fw-semibold">Images</h5>
                    <button
                      type="button"
                      className="btn btn-outline-danger rounded-4"
                      onClick={deleteAllImages}
                      disabled={deletingImages || existingImages.length === 0}
                    >
                      Delete All Current Images
                    </button>
                  </div>

                  <p className="text-muted small">
                    Current images: {existingImages.length} / {MAX_TOTAL_IMAGES}
                  </p>

                  <div className="row g-3 mb-4">
                    {existingImages.length === 0 && (
                      <div className="col-12">
                        <div className="border rounded-3 p-3 text-muted text-center">
                          No current images.
                        </div>
                      </div>
                    )}

                    {existingImages.map((image) => (
                      <div className="col-md-6 col-xl-4" key={image.id}>
                        <div className="card h-100">
                          <img
                            src={buildMediaUrl(image.image_url)}
                            alt="Property"
                            className="card-img-top"
                            style={{ height: "140px", objectFit: "cover" }}
                          />
                          <div className="card-body py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="badge text-bg-primary">
                                {image.image_type}
                              </span>
                              <button
                                type="button"
                                className="btn btn-outline-danger rounded-4"
                                onClick={() => deleteOneImage(image.id)}
                                disabled={deletingImages}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr />

                  <h6 className="fw-semibold">Add New Images</h6>
                  <input
                    type="file"
                    className="form-control mb-3"
                    multiple
                    accept="image/*"
                    onChange={handleNewImagesChange}
                    disabled={savingImages}
                  />

                  <p className="text-muted small mb-3">
                    Pending upload: {newImages.length} image(s)
                  </p>

                  <div className="row g-3">
                    {newImages.map((image, index) => (
                      <div className="col-md-6 col-xl-4" key={image.id}>
                        <div className="card h-100">
                          <img
                            src={image.previewUrl}
                            alt="Pending"
                            className="card-img-top"
                            style={{ height: "140px", objectFit: "cover" }}
                          />
                          <div className="card-body py-2">
                            <label className="form-label small mb-1">
                              Type
                            </label>
                            <select
                              className="form-select form-select-sm mb-2"
                              value={image.image_type}
                              onChange={(e) =>
                                changePendingImageType(index, e.target.value)
                              }
                            >
                              <option value="normal">normal</option>
                              <option value="panoramic">panoramic</option>
                            </select>
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-4 w-100"
                              onClick={() => removePendingImage(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-primary rounded-4 px-4"
                      onClick={uploadNewImages}
                      disabled={savingImages || newImages.length === 0}
                    >
                      {savingImages ? "Uploading..." : "Upload New Images"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card border-primary shadow-sm mt-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 fw-semibold">Virtual Tour</h5>
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-4"
                      onClick={() => setShowTourPreview((prev) => !prev)}
                      disabled={panoramicScenes.length === 0}
                    >
                      {showTourPreview ? "Hide Preview" : "Preview Tour"}
                    </button>
                  </div>

                  <p className="text-muted small mb-3">
                    Upload panoramic images first, then create scenes and link them
                    with hotspots.
                  </p>

                  <div className="alert alert-info small mb-4" role="alert">
                    <div className="fw-semibold mb-1">
                      What do Pitch, Yaw, HFOV, and Hotspots mean?
                    </div>
                    <div>
                      Pitch controls up/down tilt, yaw controls left/right
                      rotation, and HFOV is the zoom level (field of view).
                      Hotspots are clickable points that jump visitors to another
                      scene (for example, a door to the next room).
                    </div>
                  </div>

                  {panoramicScenes.length === 0 ? (
                    <div className="text-muted">
                      No panoramic scenes yet. Add one below.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {panoramicScenes.map((scene) => (
                        <div key={scene.id} className="border rounded-3 p-3">
                          <div className="row g-3">
                            <div className="col-md-4">
                              <img
                                src={buildMediaUrl(scene.image_url)}
                                alt="Panoramic scene"
                                className="w-100 rounded-3"
                                style={{ height: "140px", objectFit: "cover" }}
                              />
                            </div>
                            <div className="col-md-8">
                              <div className="row g-3">
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">
                                    Scene Name
                                  </label>
                                  <input
                                    className="form-control"
                                    value={scene.name || ""}
                                    onChange={(e) =>
                                      updateSceneField(
                                        scene.id,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">
                                    Scene Image
                                  </label>
                                  <select
                                    className="form-select"
                                    value={scene.image_url}
                                    onChange={(e) =>
                                      updateSceneField(
                                        scene.id,
                                        "image_url",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    {!panoramicImages.some(
                                      (image) => image.image_url === scene.image_url,
                                    ) &&
                                      scene.image_url && (
                                        <option value={scene.image_url}>
                                          {scene.image_url.split("/").pop()}
                                        </option>
                                      )}
                                    {panoramicImages.map((image) => (
                                      <option
                                        key={image.id}
                                        value={image.image_url}
                                      >
                                        {image.image_url.split("/").pop()}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fw-semibold">
                                    Pitch
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    className="form-control"
                                    placeholder="e.g. 5"
                                    value={scene.pitch ?? ""}
                                    onChange={(e) =>
                                      updateSceneField(
                                        scene.id,
                                        "pitch",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fw-semibold">
                                    Yaw
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    className="form-control"
                                    placeholder="e.g. 120"
                                    value={scene.yaw ?? ""}
                                    onChange={(e) =>
                                      updateSceneField(
                                        scene.id,
                                        "yaw",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fw-semibold">
                                    HFOV
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    className="form-control"
                                    placeholder="e.g. 110"
                                    value={scene.hfov ?? ""}
                                    onChange={(e) =>
                                      updateSceneField(
                                        scene.id,
                                        "hfov",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              <div className="d-flex gap-2 mt-3">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary rounded-4"
                                  onClick={() => saveScene(scene)}
                                >
                                  Save Scene
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger rounded-4"
                                  onClick={() => removeScene(scene.id)}
                                >
                                  Delete Scene
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <h6 className="fw-semibold mb-2">Hotspots</h6>
                            {(scene.hotspots || []).length === 0 && (
                              <p className="text-muted small mb-2">
                                No hotspots added yet.
                              </p>
                            )}

                            {(scene.hotspots || []).map((hotspot) => (
                              <div
                                key={hotspot.id}
                                className="border rounded-3 p-3 mb-2"
                              >
                                <div className="row g-3 align-items-end">
                                  <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                      Target Scene
                                    </label>
                                    <select
                                      className="form-select"
                                      value={hotspot.target_scene_id || ""}
                                      onChange={(e) =>
                                        updateHotspotField(
                                          scene.id,
                                          hotspot.id,
                                          "target_scene_id",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      <option value="">Select scene</option>
                                      {panoramicScenes
                                        .filter((item) => item.id !== scene.id)
                                        .map((item) => (
                                          <option key={item.id} value={item.id}>
                                            {item.name || `Scene ${item.id}`}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                  <div className="col-md-2">
                                    <label className="form-label fw-semibold">
                                      Pitch
                                    </label>
                                    <input
                                      type="number"
                                      step="any"
                                      className="form-control"
                                      placeholder="e.g. -5"
                                      value={hotspot.pitch ?? ""}
                                      onChange={(e) =>
                                        updateHotspotField(
                                          scene.id,
                                          hotspot.id,
                                          "pitch",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="col-md-2">
                                    <label className="form-label fw-semibold">
                                      Yaw
                                    </label>
                                    <input
                                      type="number"
                                      step="any"
                                      className="form-control"
                                      placeholder="e.g. 140"
                                      value={hotspot.yaw ?? ""}
                                      onChange={(e) =>
                                        updateHotspotField(
                                          scene.id,
                                          hotspot.id,
                                          "yaw",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                      Label
                                    </label>
                                    <input
                                      className="form-control"
                                      placeholder="e.g. Go to Kitchen"
                                      value={hotspot.text || ""}
                                      onChange={(e) =>
                                        updateHotspotField(
                                          scene.id,
                                          hotspot.id,
                                          "text",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="d-flex gap-2 mt-3">
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary rounded-4"
                                    onClick={() => saveHotspot(scene.id, hotspot)}
                                  >
                                    Save Hotspot
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger rounded-4"
                                    onClick={() => removeHotspot(hotspot.id)}
                                  >
                                    Delete Hotspot
                                  </button>
                                </div>
                              </div>
                            ))}

                            <div className="border rounded-3 p-3">
                              <h6 className="fw-semibold mb-2">Add Hotspot</h6>
                              {panoramicScenes.length < 2 ? (
                                <p className="text-muted small mb-0">
                                  Add at least two scenes to create hotspots.
                                </p>
                              ) : (
                                <div className="row g-3 align-items-end">
                                  <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                      Target Scene
                                    </label>
                                    <select
                                      className="form-select"
                                      value={newHotspots[scene.id]?.target_scene_id || ""}
                                      onChange={(e) =>
                                        updateNewHotspot(
                                          scene.id,
                                          "target_scene_id",
                                          e.target.value,
                                        )
                                      }
                                    >
                                      <option value="">Select scene</option>
                                      {panoramicScenes
                                        .filter((item) => item.id !== scene.id)
                                        .map((item) => (
                                          <option key={item.id} value={item.id}>
                                            {item.name || `Scene ${item.id}`}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                  <div className="col-md-2">
                                    <label className="form-label fw-semibold">
                                      Pitch
                                    </label>
                                    <input
                                      type="number"
                                      step="any"
                                      className="form-control"
                                      placeholder="e.g. -5"
                                      value={newHotspots[scene.id]?.pitch || ""}
                                      onChange={(e) =>
                                        updateNewHotspot(
                                          scene.id,
                                          "pitch",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="col-md-2">
                                    <label className="form-label fw-semibold">
                                      Yaw
                                    </label>
                                    <input
                                      type="number"
                                      step="any"
                                      className="form-control"
                                      placeholder="e.g. 140"
                                      value={newHotspots[scene.id]?.yaw || ""}
                                      onChange={(e) =>
                                        updateNewHotspot(
                                          scene.id,
                                          "yaw",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                      Label
                                    </label>
                                    <input
                                      className="form-control"
                                      placeholder="e.g. Go to Kitchen"
                                      value={newHotspots[scene.id]?.text || ""}
                                      onChange={(e) =>
                                        updateNewHotspot(
                                          scene.id,
                                          "text",
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="col-12 d-flex justify-content-end">
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary rounded-4"
                                      onClick={() => addHotspot(scene.id)}
                                    >
                                      Add Hotspot
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border rounded-3 p-3 mt-4">
                    <h6 className="fw-semibold mb-2">Add New Scene</h6>
                    {availablePanoramicImages.length === 0 ? (
                      <p className="text-muted small mb-0">
                        Upload a panoramic image first to add a new scene.
                      </p>
                    ) : (
                      <div className="row g-3 align-items-end">
                        <div className="col-md-5">
                          <label className="form-label fw-semibold">
                            Panoramic Image
                          </label>
                          <select
                            className="form-select"
                            value={newScene.image_url}
                            onChange={(e) =>
                              updateNewSceneField("image_url", e.target.value)
                            }
                          >
                            <option value="">Select image</option>
                            {availablePanoramicImages.map((image) => (
                              <option key={image.id} value={image.image_url}>
                                {image.image_url.split("/").pop()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">
                            Scene Name
                          </label>
                          <input
                            className="form-control"
                            placeholder="e.g. Living Room"
                            value={newScene.name}
                            onChange={(e) =>
                              updateNewSceneField("name", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-1">
                          <label className="form-label fw-semibold">Pitch</label>
                          <input
                            type="number"
                            step="any"
                            className="form-control"
                            placeholder="5"
                            value={newScene.pitch}
                            onChange={(e) =>
                              updateNewSceneField("pitch", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-1">
                          <label className="form-label fw-semibold">Yaw</label>
                          <input
                            type="number"
                            step="any"
                            className="form-control"
                            placeholder="120"
                            value={newScene.yaw}
                            onChange={(e) =>
                              updateNewSceneField("yaw", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-1">
                          <label className="form-label fw-semibold">HFOV</label>
                          <input
                            type="number"
                            step="any"
                            className="form-control"
                            placeholder="110"
                            value={newScene.hfov}
                            onChange={(e) =>
                              updateNewSceneField("hfov", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-12 d-flex justify-content-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary rounded-4"
                            onClick={createScene}
                          >
                            Add Scene
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {showTourPreview && panoramicScenes.length > 0 && (
                    <div className="mt-4">
                      <PannellumTourPreview
                        scenes={panoramicScenes}
                        onCoordinatePick={handlePreviewCoordPick}
                      />
                      <div className="text-muted small mt-2">
                        {lastPreviewCoords ? (
                          <>
                            Last click — Pitch:{" "}
                            {lastPreviewCoords.pitch.toFixed(2)}°, Yaw:{" "}
                            {lastPreviewCoords.yaw.toFixed(2)}°
                          </>
                        ) : (
                          "Click inside the preview to capture pitch/yaw values."
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListingDetailsPage;
