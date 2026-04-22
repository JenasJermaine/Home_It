import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  addBasicHouseInfo,
  addHouseAmenities,
  addHouseImages,
  getAllAmenities,
} from "../api/apiService";

const DEFAULT_LAT = -1.2921;
const DEFAULT_LNG = 36.8219;
const MAX_IMAGES = 15;

const SellPage = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [amenities, setAmenities] = useState([]);
  const navigate = useNavigate();

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
    latitude: String(DEFAULT_LAT),
    longitude: String(DEFAULT_LNG),
    predicted_price: "",
    price: "",
    status: "For Sale",
    selectedAmenities: [],
  });

  const [markerPosition, setMarkerPosition] = useState([
    DEFAULT_LAT,
    DEFAULT_LNG,
  ]);
  const [images, setImages] = useState([]);

  const MapMarker = useMemo(
    () =>
      L.icon({
        iconUrl: "/MapMarker/TranparentBGMapMarker.png",
        iconSize: [55, 85],
        iconAnchor: [27, 80],
      }),
    [],
  );

  useEffect(() => {
    const loadAmenities = async () => {
      try {
        const response = await getAllAmenities();
        setAmenities(response.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load amenities.");
      }
    };

    loadAmenities();
  }, []);

  useEffect(
    () => () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    },
    [images],
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLatitudeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, latitude: value }));
    const lat = Number(value);
    const lng = Number(formData.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMarkerPosition([lat, lng]);
    }
  };

  const handleLongitudeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, longitude: value }));
    const lat = Number(formData.latitude);
    const lng = Number(value);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMarkerPosition([lat, lng]);
    }
  };

  const handleAmenityToggle = (amenityId) => {
    setFormData((prev) => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenityId)
        ? prev.selectedAmenities.filter((id) => id !== amenityId)
        : [...prev.selectedAmenities, amenityId],
    }));
  };

  const handleImageChange = (e) => {
    setError("");
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (images.length + selectedFiles.length > MAX_IMAGES) {
      setError(
        `You can upload a maximum of ${MAX_IMAGES} images. You currently have ${images.length}.`,
      );
      e.target.value = "";
      return;
    }

    const nextImages = selectedFiles.map((file, index) => ({
      id: `${file.name}-${images.length + index}-${Date.now()}`,
      file,
      image_type: "normal",
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...nextImages]);
    e.target.value = "";
  };

  const handleImageTypeChange = (index, imageType) => {
    setImages((prev) =>
      prev.map((image, i) =>
        i === index ? { ...image, image_type: imageType } : image,
      ),
    );
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

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

    return <Marker position={markerPosition} icon={MapMarker}></Marker>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (images.length === 0) {
      setError("Please upload at least one property image.");
      return;
    }

    try {
      setIsSubmitting(true);
      const basicPropertyPayload = {
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
        predicted_price: Number(
          formData.predicted_price || formData.price || 0,
        ),
        price: Number(formData.price),
        status: formData.status,
      };

      const createPropertyResponse =
        await addBasicHouseInfo(basicPropertyPayload);
      const propertyId = createPropertyResponse.data?.property_id;

      if (!propertyId) {
        throw new Error("Property creation failed. Missing property ID.");
      }

      await addHouseAmenities(propertyId, {
        amenity_ids: formData.selectedAmenities,
      });

      const imageFormData = new FormData();
      images.forEach((image) => {
        imageFormData.append("images", image.file);
      });
      imageFormData.append(
        "image_types",
        JSON.stringify(images.map((image) => image.image_type)),
      );

      await addHouseImages(propertyId, imageFormData);

      setSuccessMessage("Property listing submitted successfully.");
      setStep(1);
      setImages([]);
      setFormData({
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
        latitude: String(DEFAULT_LAT),
        longitude: String(DEFAULT_LNG),
        predicted_price: "",
        price: "",
        status: "For Sale",
        selectedAmenities: [],
      });
      setMarkerPosition([DEFAULT_LAT, DEFAULT_LNG]);
      navigate("/Mylistings");
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to submit listing.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card mb-4 shadow-sm border rounded-4 border-primary">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="step-indicator-item">
                    <div
                      className={`step-number ${step >= 1 ? "step-number-active" : ""}`}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        margin: "0 auto 8px",
                      }}
                    >
                      1
                    </div>
                    <div className="small text-center">Basic Info</div>
                  </div>
                  <div
                    className={`step-line ${step >= 2 ? "step-line-active" : ""}`}
                  ></div>
                  <div className="step-indicator-item">
                    <div
                      className={`step-number ${step >= 2 ? "step-number-active" : ""}`}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        margin: "0 auto 8px",
                      }}
                    >
                      2
                    </div>
                    <div className="small text-center">Amenities</div>
                  </div>
                  <div
                    className={`step-line ${step >= 3 ? "step-line-active" : ""}`}
                  ></div>
                  <div className="step-indicator-item">
                    <div
                      className={`step-number ${step >= 3 ? "step-number-active" : ""}`}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        margin: "0 auto 8px",
                      }}
                    >
                      3
                    </div>
                    <div className="small text-center">Images</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow border rounded-4 border-primary">
              <div className="card-body p-4">
                {(error || successMessage) && (
                  <div
                    className={`alert ${error ? "alert-danger" : "alert-success"} mb-4`}
                    role="alert"
                  >
                    {error || successMessage}
                  </div>
                )}

                <form onSubmit={step === 3 ? handleSubmit : handleNext}>
                  {step === 1 && (
                    <div className="step-content">
                      <h3 className="mb-4 fw-bold">Property Details</h3>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Property Description{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control rounded-4"
                          rows="4"
                          placeholder="Describe your property..."
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                        ></textarea>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Property Type <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select rounded-4"
                            name="property_type"
                            value={formData.property_type}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select type</option>
                            <option value="Bungalow">Bungalow</option>
                            <option value="Apartment">Flat/Apartment</option>
                            <option value="Mansionette">Mansionette</option>
                            <option value="Town House">Town House</option>
                          </select>
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Status <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select rounded-4"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="For Sale">For Sale</option>
                            <option value="For Rent">Sold</option>
                            <option value="For Rent">Pending</option>
                          </select>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label fw-semibold">
                            Bedrooms <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control rounded-4"
                            placeholder="e.g. 3"
                            min="0"
                            name="bedrooms"
                            value={formData.bedrooms}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label fw-semibold">
                            Bathrooms <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control rounded-4"
                            placeholder="e.g. 2"
                            min="0"
                            name="bathrooms"
                            value={formData.bathrooms}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label fw-semibold">
                            Floors <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control rounded-4"
                            placeholder="e.g. 2"
                            min="1"
                            name="floors"
                            value={formData.floors}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Property Size (sqm){" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control rounded-4"
                            placeholder="e.g. 250.50"
                            min="0"
                            name="size_sqm"
                            value={formData.size_sqm}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Land Size (sqm){" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control rounded-4"
                            placeholder="e.g. 500.00"
                            min="0"
                            name="land_size_sqm"
                            value={formData.land_size_sqm}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Year Built <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control rounded-4"
                            placeholder={`e.g. ${new Date().getFullYear()}`}
                            min="1900"
                            max={new Date().getFullYear()}
                            name="year_built"
                            value={formData.year_built}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Condition <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select rounded-4"
                            name="condition"
                            value={formData.condition}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select condition</option>
                            <option value="New">New</option>
                            <option value="Renovated">Renovated</option>
                            <option value="Old">Old</option>
                          </select>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            County <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select rounded-4"
                            name="county"
                            value={formData.county}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select County</option>
                            <option value="Nairobi">Nairobi</option>
                          </select>
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Sub-County <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select rounded-4"
                            name="subcounty"
                            value={formData.subcounty}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select Sub-County</option>
                            <option value="Westlands">Westlands</option>
                            <option value="Dagoretti North">
                              Dagoretti North
                            </option>
                            <option value="Dagoretti South">
                              Dagoretti South
                            </option>
                            <option value="Langata">Langata</option>
                            <option value="Kibra">Kibra</option>
                            <option value="Roysambu">Roysambu</option>
                            <option value="Kasarani">Kasarani</option>
                            <option value="Ruaraka">Ruaraka</option>
                            <option value="Embakasi South">
                              Embakasi South
                            </option>
                            <option value="Embakasi North">
                              Embakasi North
                            </option>
                            <option value="Embakasi Central">
                              Embakasi Central
                            </option>
                            <option value="Embakasi East">Embakasi East</option>
                            <option value="Embakasi West">Embakasi West</option>
                            <option value="Makadara">Makadara</option>
                            <option value="Kamukunji">Kamukunji</option>
                            <option value="Starehe">Starehe</option>
                            <option value="Mathare">Mathare</option>
                          </select>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Latitude <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            className="form-control rounded-4"
                            placeholder="e.g. -1.2921"
                            value={formData.latitude}
                            onChange={handleLatitudeChange}
                            min="-90"
                            max="90"
                            required
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Longitude <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            className="form-control rounded-4"
                            placeholder="e.g., 36.8219"
                            value={formData.longitude}
                            onChange={handleLongitudeChange}
                            min="-180"
                            max="180"
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-semibold">
                          Select Property Location{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <p className="text-primary small mb-2">
                          <i className="bi bi-info-circle me-1 text-primary"></i>
                          Click on the map to set your property location
                        </p>
                        <div
                          className="border rounded-3 border-primary"
                          style={{
                            height: "400px",
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

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Predicted Price (KES)
                          </label>
                          <input
                            type="text"
                            className="form-control rounded-4 bg-light"
                            value={
                              formData.predicted_price ||
                              "Will use listing price"
                            }
                            readOnly
                            disabled
                          />
                          <small className="text-primary">
                            Sent to backend; defaults to your listing price for
                            now.
                          </small>
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Listing Price (KES){" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            step="1000"
                            className="form-control rounded-4"
                            placeholder="e.g. 18000000"
                            min="0"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                          />
                          <small className="text-primary">
                            Your asking price
                          </small>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="step-content">
                      <h3 className="mb-4 fw-bold">Property Amenities</h3>
                      <p className="text-muted mb-4">
                        Select all amenities available in your property
                      </p>

                      <div className="row">
                        {amenities.map((amenity) => (
                          <div
                            key={amenity.id}
                            className="col-md-6 col-lg-4 mb-3"
                          >
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`amenity-${amenity.id}`}
                                onChange={() => handleAmenityToggle(amenity.id)}
                                checked={formData.selectedAmenities.includes(
                                  amenity.id,
                                )}
                              />
                              <label
                                className="form-check-label w-100"
                                htmlFor={`amenity-${amenity.id}`}
                              >
                                <div
                                  className="amenity-card p-3 rounded-3 border"
                                  style={{
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  {amenity.name}
                                </div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="alert alert-primary mt-4" role="alert">
                        <i className="bi bi-info-circle me-2"></i>
                        Selected {formData.selectedAmenities.length} amenities
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="step-content">
                      <h3 className="mb-4 fw-bold">Property Images</h3>
                      <p className="text-muted mb-4">
                        Upload high-quality images of your property
                      </p>

                      <div className="mb-4">
                        <label className="form-label fw-semibold">
                          Upload Images <span className="text-danger">*</span>
                        </label>
                        <div
                          className="border border-2 border-dashed rounded-3 p-5 text-center"
                          style={{ backgroundColor: "#f8f9fa" }}
                        >
                          <i className="bi bi-cloud-upload fs-1 text-primary mb-3 d-block"></i>
                          <p className="mb-2 fw-semibold">
                            Select up to {MAX_IMAGES} images
                          </p>
                          <p className="mb-2">
                            <span className="badge text-bg-primary">
                              Selected: {images.length}/{MAX_IMAGES}
                            </span>
                          </p>
                          <p className="text-muted small">
                            Supported formats: JPEG, PNG, WEBP, GIF, TIFF, HEIC,
                            HEIF (Max 50MB per image)
                          </p>
                          <input
                            type="file"
                            className="d-none"
                            id="imageUpload"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                          <label
                            htmlFor="imageUpload"
                            className="btn btn-primary rounded-3 mt-2"
                            style={{ cursor: "pointer" }}
                          >
                            <i className="bi bi-upload me-2"></i>
                            {images.length > 0
                              ? "Add More Images"
                              : "Choose Images"}
                          </label>
                        </div>
                      </div>

                      <div className="row g-3 mb-4">
                        {images.length === 0 && (
                          <div className="col-md-4">
                            <div
                              className="border rounded-3 p-4 text-center"
                              style={{ backgroundColor: "#f8f9fa" }}
                            >
                              <i className="bi bi-image fs-1 text-muted"></i>
                              <p className="text-muted small mt-2 mb-0">
                                No images uploaded yet
                              </p>
                            </div>
                          </div>
                        )}

                        {images.map((image, index) => (
                          <div className="col-md-6" key={image.id}>
                            <div className="card border rounded-3 h-100">
                              <img
                                src={image.previewUrl}
                                alt={`Selected ${index + 1}`}
                                className="card-img-top"
                                style={{ height: "190px", objectFit: "cover" }}
                              />
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <small className="text-muted">
                                    {image.file.name}
                                  </small>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeImage(index)}
                                  >
                                    Remove
                                  </button>
                                </div>
                                <label className="form-label fw-semibold mb-1">
                                  Image Type
                                </label>
                                <select
                                  className="form-select"
                                  value={image.image_type}
                                  onChange={(e) =>
                                    handleImageTypeChange(index, e.target.value)
                                  }
                                >
                                  <option value="normal">Normal</option>
                                  <option value="panoramic">Panoramic</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="alert alert-warning" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        The backend pairs image types by index: first selected
                        image gets first type, second gets second type, and so
                        on.
                      </div>
                    </div>
                  )}

                  <div className="d-flex justify-content-between mt-4 pt-3 border-top border-primary">
                    {step > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-4 px-4"
                        onClick={handleBack}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back
                      </button>
                    )}

                    {step < 3 ? (
                      <button
                        type="submit"
                        className="btn btn-primary rounded-4 px-4 ms-auto"
                      >
                        Next
                        <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="btn btn-success rounded-4 px-4 ms-auto"
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        {isSubmitting ? "Submitting..." : "Submit Listing"}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellPage;
