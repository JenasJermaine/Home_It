import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SellPage = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Custom marker icon using your existing marker
  const MapMarker = L.icon({
    iconUrl: "/MapMarker/TranparentBGMapMarker.png",
    iconSize: [55, 85],
    iconAnchor: [27, 80],
  });

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Info
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
    latitude: -1.2921, // Default Nairobi center
    longitude: 36.8219,
    predicted_price: "",
    price: "",
    status: "For Sale",
    // Amenities
    selectedAmenities: [],
    // Images
    images: [],
  });

  // Map marker position
  const [markerPosition, setMarkerPosition] = useState([-1.2921, 36.8219]);

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Property listing submitted! (Not connected to backend)");
  };

  const handleAmenityToggle = (amenityId) => {
    setFormData((prev) => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenityId)
        ? prev.selectedAmenities.filter((id) => id !== amenityId)
        : [...prev.selectedAmenities, amenityId],
    }));
  };

  // Map click handler component
  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
      },
    });

    return <Marker position={markerPosition} icon={MapMarker}></Marker>;
  }

  // Sample amenities for demonstration
  const sampleAmenities = [
    { id: 1, name: "WiFi" },
    { id: 2, name: "Parking" },
    { id: 3, name: "Swimming Pool" },
    { id: 4, name: "Garden" },
    { id: 5, name: "Security/CCTV" },
    { id: 6, name: "Gym" },
    { id: 7, name: "Balcony" },
    { id: 8, name: "Air Conditioning" },
    { id: 9, name: "Elevator" },
    { id: 10, name: "Generator" },
  ];

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Progress Indicator */}
            <div className="card mb-4 shadow-sm border rounded-4 border-primary">
              <div className="card-body ">
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

            {/* Form Card */}
            <div className="card shadow border rounded-4 border-primary">
              <div className="card-body p-4">
                <form onSubmit={step === 3 ? handleSubmit : handleNext}>
                  {/* Step 1: Basic Property Information */}
                  {step === 1 && (
                    <div className="step-content">
                      <h3 className="mb-4 fw-bold text-primary">
                        Property Details
                      </h3>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Property Description{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control rounded-4"
                          rows="4"
                          placeholder="Describe your property..."
                          required
                        ></textarea>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Property Type <span className="text-danger">*</span>
                          </label>
                          <select className="form-select rounded-4" required>
                            <option value="">Select type</option>
                            <option value="Bungalow">Bungalow</option>
                            <option value="Apartment">Flat/Apartment</option>
                            <option value="Mansionette">Mansionette</option>
                            <option value="Studio">Town House</option>
                          </select>
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Status <span className="text-danger">*</span>
                          </label>
                          <select className="form-select rounded-4" required>
                            <option value="For Sale">For Sale</option>
                            <option value="For Rent">Sold</option>
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
                            placeholder={"e.g. " + new Date().getFullYear()}
                            min="1900"
                            max={new Date().getFullYear()}
                            required
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Condition <span className="text-danger">*</span>
                          </label>
                          <select className="form-select rounded-4" required>
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
                          <select className="form-select rounded-4" required>
                            <option value="">Select County</option>
                            <option value="Nairobi">Nairobi</option>
                          </select>
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold">
                            Sub-County <span className="text-danger">*</span>
                          </label>
                          <select className="form-select rounded-4" required>
                            <option value="">Select Sub-County</option>
                            <option value="Westlands">Weslands</option>
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
                            onChange={(e) => {
                              const lat = parseFloat(e.target.value);
                              setFormData((prev) => ({
                                ...prev,
                                latitude: lat,
                              }));
                              if (!isNaN(lat)) {
                                setMarkerPosition([lat, formData.longitude]);
                              }
                            }}
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
                            onChange={(e) => {
                              const lng = parseFloat(e.target.value);
                              setFormData((prev) => ({
                                ...prev,
                                longitude: lng,
                              }));
                              if (!isNaN(lng)) {
                                setMarkerPosition([formData.latitude, lng]);
                              }
                            }}
                            min="-180"
                            max="180"
                            required
                          />
                        </div>
                      </div>

                      {/* Map for Location Selection */}
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
                          Current location: {formData.latitude.toFixed(6)},{" "}
                          {formData.longitude.toFixed(6)}
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
                            value={formData.predicted_price || 'Calculating...'}
                            readOnly
                            disabled
                          />
                          <small className="text-primary">
                            AI-predicted market value based on your property details
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
                            required
                          />
                          <small className="text-primary">
                            Your asking price
                          </small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Amenities */}
                  {step === 2 && (
                    <div className="step-content">
                      <h3 className="mb-4 fw-bold text-primary">
                        Property Amenities
                      </h3>
                      <p className="text-muted mb-4">
                        Select all amenities available in your property
                      </p>

                      <div className="row">
                        {sampleAmenities.map((amenity) => (
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
                                  <i className="bi bi-check-circle-fill text-primary me-2"></i>
                                  {amenity.name}
                                </div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="alert alert-info mt-4" role="alert">
                        <i className="bi bi-info-circle me-2"></i>
                        Selected {formData.selectedAmenities.length} amenities
                      </div>
                    </div>
                  )}

                  {/* Step 3: Images */}
                  {step === 3 && (
                    <div className="step-content">
                      <h3 className="mb-4 fw-bold text-primary">
                        Property Images
                      </h3>
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
                            Drag and drop images here, or click to browse
                          </p>
                          <p className="text-muted small">
                            Supported formats: JPG, PNG, JPEG (Max 5MB per
                            image)
                          </p>
                          <input
                            type="file"
                            className="d-none"
                            id="imageUpload"
                            multiple
                            accept="image/*"
                          />
                          <label
                            htmlFor="imageUpload"
                            className="btn btn-primary rounded-3 mt-2"
                            style={{ cursor: "pointer" }}
                          >
                            <i className="bi bi-upload me-2"></i>
                            Choose Images
                          </label>
                        </div>
                      </div>

                      <div className="row mb-4">
                        <div className="col-md-12">
                          <label className="form-label fw-semibold">
                            Image Preview
                          </label>
                          <div className="image-preview-container">
                            <div className="row g-3">
                              {/* Placeholder for uploaded images */}
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
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="alert alert-warning" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>Tip:</strong> Add at least 5 images for better
                        visibility. Include exterior, interior, kitchen, and
                        bathroom photos.
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="d-flex justify-content-between mt-4 pt-3 border-top border-primary">
                    {step > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-4 px-4"
                        onClick={handleBack}
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
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        Submit Listing
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
