import { useEffect, useState } from "react";
import {
  ensureMlModelAmenities,
  predictPriceEstimate,
} from "../api/apiService";

const PriceEstimatorPage = () => {
  const [formData, setFormData] = useState({
    property_type: "",
    bedrooms: "",
    bathrooms: "",
    size_sqm: "",
    land_size_sqm: "",
    year_built: "",
    county: "",
    subcounty: "",
    selectedAmenities: [],
  });
  const [amenities, setAmenities] = useState([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadAmenities = async () => {
      try {
        const loadedAmenities = await ensureMlModelAmenities();
        setAmenities(loadedAmenities);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load amenities.");
      }
    };

    loadAmenities();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenityId) => {
    setFormData((prev) => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenityId)
        ? prev.selectedAmenities.filter((idValue) => idValue !== amenityId)
        : [...prev.selectedAmenities, amenityId],
    }));
  };

  const handlePredict = async () => {
    setError("");
    setSuccessMessage("");

    const hasMissingRequiredField = [
      formData.property_type,
      formData.bedrooms,
      formData.bathrooms,
      formData.size_sqm,
      formData.land_size_sqm,
      formData.year_built,
      formData.county,
      formData.subcounty,
    ].some((value) => !String(value || "").trim());

    const numericValues = {
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      size_sqm: Number(formData.size_sqm),
      land_size_sqm: Number(formData.land_size_sqm),
      year_built: Number(formData.year_built),
    };

    const hasInvalidNumericField = [
      !Number.isFinite(numericValues.bedrooms) || numericValues.bedrooms < 0,
      !Number.isFinite(numericValues.bathrooms) || numericValues.bathrooms < 0,
      !Number.isFinite(numericValues.size_sqm) || numericValues.size_sqm <= 0,
      !Number.isFinite(numericValues.land_size_sqm) ||
        numericValues.land_size_sqm <= 0,
      !Number.isFinite(numericValues.year_built) ||
        numericValues.year_built < 1800,
    ].some(Boolean);

    if (hasMissingRequiredField || hasInvalidNumericField) {
      setError(
        "Fill in valid property type, bedrooms, bathrooms, size, land size, year built, county and subcounty before predicting.",
      );
      return;
    }

    try {
      setIsPredicting(true);
      const response = await predictPriceEstimate({
        property_type: formData.property_type,
        bedrooms: numericValues.bedrooms,
        bathrooms: numericValues.bathrooms,
        size_sqm: numericValues.size_sqm,
        land_size_sqm: numericValues.land_size_sqm,
        year_built: numericValues.year_built,
        county: formData.county,
        subcounty: formData.subcounty,
        year_property_was_advertised: new Date().getFullYear(),
        amenity_ids: formData.selectedAmenities,
      });

      const predicted = Number(response.data?.data?.predicted_price);
      if (!Number.isFinite(predicted)) {
        throw new Error("Prediction response is missing a valid price.");
      }

      setPredictedPrice(predicted);
      setSuccessMessage("Prediction updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          "Failed to predict price right now.",
      );
    } finally {
      setIsPredicting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      property_type: "",
      bedrooms: "",
      bathrooms: "",
      size_sqm: "",
      land_size_sqm: "",
      year_built: "",
      county: "",
      subcounty: "",
      selectedAmenities: [],
    });
    setPredictedPrice(null);
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <div className="mb-4">
          <h2 className="fw-bold mb-1">Price Estimator</h2>
          <p className="text-muted mb-0">
            Get an instant estimate based on property details and amenities.
          </p>
        </div>

        {(error || successMessage) && (
          <div
            className={`alert ${error ? "alert-danger" : "alert-success"}`}
            role="alert"
          >
            {error || successMessage}
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card border-primary shadow-sm">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Property Details</h5>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Property Type
                    </label>
                    <select
                      name="property_type"
                      className="form-select"
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

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Bedrooms</label>
                    <input
                      type="number"
                      min="0"
                      name="bedrooms"
                      className="form-control"
                      placeholder="e.g. 3"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Bathrooms</label>
                    <input
                      type="number"
                      min="0"
                      name="bathrooms"
                      className="form-control"
                      placeholder="e.g. 2"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
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
                      placeholder="e.g. 120"
                      value={formData.size_sqm}
                      onChange={handleInputChange}
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
                      placeholder="e.g. 240"
                      value={formData.land_size_sqm}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Year Built</label>
                    <input
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      name="year_built"
                      className="form-control"
                      placeholder={`e.g. ${new Date().getFullYear()}`}
                      value={formData.year_built}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">County</label>
                    <select
                      name="county"
                      className="form-select"
                      value={formData.county}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select County</option>
                      <option value="Nairobi">Nairobi</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Subcounty</label>
                    <select
                      name="subcounty"
                      className="form-select"
                      value={formData.subcounty}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Sub-County</option>
                      <option value="Westlands">Westlands</option>
                      <option value="Dagoretti North">Dagoretti North</option>
                      <option value="Dagoretti South">Dagoretti South</option>
                      <option value="Langata">Langata</option>
                      <option value="Kibra">Kibra</option>
                      <option value="Roysambu">Roysambu</option>
                      <option value="Kasarani">Kasarani</option>
                      <option value="Ruaraka">Ruaraka</option>
                      <option value="Embakasi South">Embakasi South</option>
                      <option value="Embakasi North">Embakasi North</option>
                      <option value="Embakasi Central">Embakasi Central</option>
                      <option value="Embakasi East">Embakasi East</option>
                      <option value="Embakasi West">Embakasi West</option>
                      <option value="Makadara">Makadara</option>
                      <option value="Kamukunji">Kamukunji</option>
                      <option value="Starehe">Starehe</option>
                      <option value="Mathare">Mathare</option>
                    </select>
                  </div>
                </div>

                <hr className="my-4" />

                <h5 className="fw-semibold mb-3">Amenities</h5>
                <div className="row">
                  {amenities.map((amenity) => (
                    <div className="col-md-6 col-xl-4 mb-2" key={amenity.id}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`amenity-${amenity.id}`}
                          checked={formData.selectedAmenities.includes(amenity.id)}
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

                <div className="d-flex flex-wrap gap-2 justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePredict}
                    disabled={isPredicting}
                  >
                    {isPredicting ? "Predicting..." : "Get Estimate"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card border-primary shadow-sm">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Estimated Price</h5>
                <div className="p-4 bg-light rounded-3 text-center">
                  <p className="text-muted mb-2">Estimated listing price</p>
                  <h2 className="fw-bold text-primary mb-0">
                    {Number.isFinite(predictedPrice)
                      ? `Ksh. ${predictedPrice.toLocaleString()}`
                      : "Ksh. --"}
                  </h2>
                </div>
                <p className="text-muted small mt-3 mb-0">
                  The estimate is based on your inputs and the ML model. Adjust
                  amenities and features to see how the value changes.
                </p>
              </div>
            </div>
            <div className="card border-primary shadow-sm mt-4">
              <div className="card-body">
                <h6 className="fw-semibold">How it works</h6>
                <ul className="text-muted small mb-0">
                  <li>Enter accurate property details and location.</li>
                  <li>Select amenities that match your listing.</li>
                  <li>Click “Get Estimate” to view the prediction.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceEstimatorPage;