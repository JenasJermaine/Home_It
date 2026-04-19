import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  buildMediaUrl,
  deleteAllHouseImages,
  deleteSingleHouseImage,
  getAllAmenities,
  getMyProfile,
  getPropertyById,
  modifyBasicHouseInfo,
  modifyHouseAmenities,
  modifyHouseImages,
} from "../api/apiService";

const MAX_TOTAL_IMAGES = 15;
const DEFAULT_LAT = -1.2921;
const DEFAULT_LNG = 36.8219;

const MyListingDetailsPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [markerPosition, setMarkerPosition] = useState([DEFAULT_LAT, DEFAULT_LNG]);

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
    setCoverImage(buildMediaUrl(property.images?.[0]?.image_url) || "/images/House1.jpg");
    setExistingImages(property.images || []);
    setSelectedAmenities((property.amenities || []).map((amenity) => amenity.id));

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

  const reloadPropertyOnly = async () => {
    const propertyResponse = await getPropertyById(id);
    const property = propertyResponse.data?.data;
    if (property) {
      applyPropertyToState(property);
    }
  };

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const [profileResponse, propertyResponse, amenitiesResponse] = await Promise.all([
          getMyProfile(),
          getPropertyById(id),
          getAllAmenities(),
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

        setAllAmenities(amenitiesResponse.data?.data || []);
        applyPropertyToState(property);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load property details.");
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  useEffect(
    () => () => {
      newImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    },
    [newImages],
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "latitude" || name === "longitude") {
        const lat = Number(next.latitude);
        const lng = Number(next.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setMarkerPosition([lat, lng]);
        }
      }
      return next;
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      setSaving(true);
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
        predicted_price: Number(formData.predicted_price || formData.price || 0),
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

    if (existingImages.length + newImages.length + selectedFiles.length > MAX_TOTAL_IMAGES) {
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
            <p className="text-muted m-0">Update details, amenities and images.</p>
          </div>
          <Link to="/Mylistings">
            <i className="bi bi-arrow-left me-2 text-primary" style={{ fontSize: "30px" }}></i>
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
                      <label className="form-label fw-semibold">Description</label>
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
                        <label className="form-label fw-semibold">Property Type</label>
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
                          <option value="For Rent">For Rent</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Bedrooms</label>
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
                        <label className="form-label fw-semibold">Bathrooms</label>
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
                        <label className="form-label fw-semibold">Size (sqm)</label>
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
                        <label className="form-label fw-semibold">Land Size (sqm)</label>
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
                        <label className="form-label fw-semibold">Year Built</label>
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
                        <label className="form-label fw-semibold">Condition</label>
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
                        <label className="form-label fw-semibold">Subcounty</label>
                        <input
                          name="subcounty"
                          className="form-control"
                          value={formData.subcounty}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          min="-90"
                          max="90"
                          name="latitude"
                          className="form-control"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          min="-180"
                          max="180"
                          name="longitude"
                          className="form-control"
                          value={formData.longitude}
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
                          Click the map to update exact coordinates.
                        </p>
                        <div
                          className="border rounded-3 border-primary"
                          style={{ height: "320px", width: "100%", overflow: "hidden" }}
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
                          Current location: {Number(formData.latitude).toFixed(6)},{" "}
                          {Number(formData.longitude).toFixed(6)}
                        </small>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Predicted Price</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={formData.predicted_price || "Will use listing price"}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Listing Price</label>
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

              <div className="card border-primary shadow-sm mb-4">
                <div className="card-body">
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
                          <label className="form-check-label" htmlFor={`amenity-${amenity.id}`}>
                            {amenity.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-primary rounded-4 px-4"
                      onClick={saveAmenities}
                      disabled={savingAmenities}
                    >
                      {savingAmenities ? "Saving..." : "Save Amenities"}
                    </button>
                  </div>
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
                              <span className="badge text-bg-primary">{image.image_type}</span>
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
                            <label className="form-label small mb-1">Type</label>
                            <select
                              className="form-select form-select-sm mb-2"
                              value={image.image_type}
                              onChange={(e) => changePendingImageType(index, e.target.value)}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListingDetailsPage;
