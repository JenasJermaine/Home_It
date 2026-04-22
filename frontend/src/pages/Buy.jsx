import { useCallback, useEffect, useMemo, useState } from "react";
import { IoBedOutline } from "react-icons/io5";
import { PiBathtub } from "react-icons/pi";
import { SlSizeFullscreen } from "react-icons/sl";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  buildMediaUrl,
  getAllAmenities,
  getFilteredProperties,
} from "../api/apiService";

const DEFAULT_LAT = -1.2921;
const DEFAULT_LNG = 36.8219;
const BUYABLE_STATUSES = ["for sale", "pending"];

const initialFilters = {
  property_type: "",
  min_bedrooms: "",
  max_bedrooms: "",
  min_bathrooms: "",
  max_bathrooms: "",
  min_size_sqm: "",
  max_size_sqm: "",
  min_land_size_sqm: "",
  max_land_size_sqm: "",
  min_floors: "",
  max_floors: "",
  county: "",
  subcounty: "",
  location: "",
  min_price: "",
  max_price: "",
  amenity_ids: [],
  lat: "",
  lng: "",
  radius_km: "5",
};

const BuyPage = () => {
  const iconToggleStyle = {
    width: "42px",
    height: "42px",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const [viewMode, setViewMode] = useState("cards");
  const [filters, setFilters] = useState(initialFilters);
  const [amenities, setAmenities] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const mapMarkerIcon = useMemo(
    () =>
      L.icon({
        iconUrl: "/MapMarker/TranparentBGMapMarker.png",
        iconSize: [55, 85],
        iconAnchor: [27, 80],
      }),
    [],
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAmenityFilter = (amenityId) => {
    setFilters((prev) => ({
      ...prev,
      amenity_ids: prev.amenity_ids.includes(amenityId)
        ? prev.amenity_ids.filter((id) => id !== amenityId)
        : [...prev.amenity_ids, amenityId],
    }));
  };

  const buildFilterParams = useCallback((includeMapFields) => {
    const params = {};
    const addIfValue = (key, value) => {
      if (value !== undefined && value !== null && value !== "") {
        params[key] = value;
      }
    };

    addIfValue("property_type", filters.property_type);
    addIfValue("min_bedrooms", filters.min_bedrooms);
    addIfValue("max_bedrooms", filters.max_bedrooms);
    addIfValue("min_bathrooms", filters.min_bathrooms);
    addIfValue("max_bathrooms", filters.max_bathrooms);
    addIfValue("min_size_sqm", filters.min_size_sqm);
    addIfValue("max_size_sqm", filters.max_size_sqm);
    addIfValue("min_land_size_sqm", filters.min_land_size_sqm);
    addIfValue("max_land_size_sqm", filters.max_land_size_sqm);
    addIfValue("min_floors", filters.min_floors);
    addIfValue("max_floors", filters.max_floors);
    addIfValue("county", filters.county);
    addIfValue("subcounty", filters.subcounty);
    addIfValue("location", filters.location);
    addIfValue("min_price", filters.min_price);
    addIfValue("max_price", filters.max_price);

    if (filters.amenity_ids.length > 0) {
      params.amenity_ids = filters.amenity_ids.join(",");
    }

    if (includeMapFields) {
      addIfValue("lat", filters.lat);
      addIfValue("lng", filters.lng);
      addIfValue("radius_km", filters.radius_km);
    }

    return params;
  }, [filters]);

  const fetchFilteredProperties = useCallback(async (includeMapFields) => {
    setLoading(true);
    setError("");
    try {
      let page = 1;
      let pages = 1;
      const collected = [];
      const baseParams = buildFilterParams(includeMapFields);

      do {
        const response = await getFilteredProperties({
          ...baseParams,
          page,
          limit: 50,
        });
        const rows = response.data?.data || [];
        pages = response.data?.pages || 1;
        collected.push(...rows);
        page += 1;
      } while (page <= pages);

      const buyable = collected.filter((property) =>
        BUYABLE_STATUSES.includes(String(property.status || "").toLowerCase()),
      );

      setProperties(buyable);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const amenitiesResponse = await getAllAmenities();
        setAmenities(amenitiesResponse.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load filter amenities.");
      }
    };

    loadInitialData();
    fetchFilteredProperties(false);
  }, [fetchFilteredProperties]);

  const applyFilters = () => {
    fetchFilteredProperties(viewMode === "map");
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    fetchFilteredProperties(false);
  };

  const switchToCards = () => {
    setViewMode("cards");
  };

  const switchToMap = () => {
    setViewMode("map");
  };

  const mapCenter = useMemo(() => {
    if (filters.lat && filters.lng) {
      const lat = Number(filters.lat);
      const lng = Number(filters.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return [lat, lng];
      }
    }
    if (properties.length > 0) {
      const firstLat = Number(properties[0].latitude);
      const firstLng = Number(properties[0].longitude);
      if (Number.isFinite(firstLat) && Number.isFinite(firstLng)) {
        return [firstLat, firstLng];
      }
    }
    return [DEFAULT_LAT, DEFAULT_LNG];
  }, [filters.lat, filters.lng, properties]);

  return (
    <div className="min-vh-100">
      <div className="container-fluid py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1">Buy Properties</h2>
            <p className="text-muted m-0">
              Discover homes that are currently For Sale.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className={`btn ${isFiltersOpen ? "btn-primary" : "btn-outline-primary"} rounded-circle`}
              style={iconToggleStyle}
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              title="Toggle Filters"
              aria-label="Toggle Filters"
            >
              <i className="bi bi-funnel-fill"></i>
            </button>
            <button
              type="button"
              className={`btn ${viewMode === "cards" ? "btn-primary" : "btn-outline-primary"} rounded-circle`}
              style={iconToggleStyle}
              onClick={switchToCards}
              title="Cards View"
              aria-label="Cards View"
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>
            <button
              type="button"
              className={`btn ${viewMode === "map" ? "btn-primary" : "btn-outline-primary"} rounded-circle`}
              style={iconToggleStyle}
              onClick={switchToMap}
              title="Map View"
              aria-label="Map View"
            >
              <i className="bi bi-map-fill"></i>
            </button>
          </div>
        </div>

        {isFiltersOpen && (
          <div className="mb-3 border border-primary rounded-4 p-3">
            <div className="row g-3">
              <div className="col-lg-6">
                <label className="form-label fw-semibold mb-1">Location & Type</label>
                <div className="row g-2">
                  <div className="col-md-6">
                    <input
                      className="form-control rounded-4"
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      placeholder="Search location text"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      className="form-control rounded-4"
                      name="county"
                      value={filters.county}
                      onChange={handleFilterChange}
                      placeholder="County"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      className="form-control rounded-4"
                      name="subcounty"
                      value={filters.subcounty}
                      onChange={handleFilterChange}
                      placeholder="Subcounty"
                    />
                  </div>
                  <div className="col-md-6">
                    <select
                      className="form-select rounded-4"
                      name="property_type"
                      value={filters.property_type}
                      onChange={handleFilterChange}
                    >
                      <option value="">Property type</option>
                      <option value="Bungalow">Bungalow</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Mansionette">Mansionette</option>
                      <option value="Town House">Town House</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <label className="form-label fw-semibold mb-1">Range Filters</label>
                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="small text-muted">Bedrooms</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control rounded-4" name="min_bedrooms" value={filters.min_bedrooms} onChange={handleFilterChange} placeholder="Min" />
                      <input type="number" className="form-control rounded-4" name="max_bedrooms" value={filters.max_bedrooms} onChange={handleFilterChange} placeholder="Max" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted">Bathrooms</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control rounded-4" name="min_bathrooms" value={filters.min_bathrooms} onChange={handleFilterChange} placeholder="Min" />
                      <input type="number" className="form-control rounded-4" name="max_bathrooms" value={filters.max_bathrooms} onChange={handleFilterChange} placeholder="Max" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted">Size (sqm)</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control rounded-4" name="min_size_sqm" value={filters.min_size_sqm} onChange={handleFilterChange} placeholder="Min" />
                      <input type="number" className="form-control rounded-4" name="max_size_sqm" value={filters.max_size_sqm} onChange={handleFilterChange} placeholder="Max" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted">Land Size (sqm)</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control rounded-4" name="min_land_size_sqm" value={filters.min_land_size_sqm} onChange={handleFilterChange} placeholder="Min" />
                      <input type="number" className="form-control rounded-4" name="max_land_size_sqm" value={filters.max_land_size_sqm} onChange={handleFilterChange} placeholder="Max" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted">Floors</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control rounded-4" name="min_floors" value={filters.min_floors} onChange={handleFilterChange} placeholder="Min" />
                      <input type="number" className="form-control rounded-4" name="max_floors" value={filters.max_floors} onChange={handleFilterChange} placeholder="Max" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="small text-muted">Price (KES)</label>
                    <div className="d-flex gap-2">
                      <input type="number" className="form-control rounded-4" name="min_price" value={filters.min_price} onChange={handleFilterChange} placeholder="Min" />
                      <input type="number" className="form-control rounded-4" name="max_price" value={filters.max_price} onChange={handleFilterChange} placeholder="Max" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {viewMode === "map" && (
              <div className="mt-3">
                <label className="form-label fw-semibold mb-1">Map Radius Filter</label>
                <div className="row g-2">
                  <div className="col-md-3">
                    <input
                      type="number"
                      step="any"
                      className="form-control rounded-4"
                      name="lat"
                      value={filters.lat}
                      onChange={handleFilterChange}
                      placeholder="Latitude"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      step="any"
                      className="form-control rounded-4"
                      name="lng"
                      value={filters.lng}
                      onChange={handleFilterChange}
                      placeholder="Longitude"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      step="0.1"
                      className="form-control rounded-4"
                      name="radius_km"
                      value={filters.radius_km}
                      onChange={handleFilterChange}
                      placeholder="Radius (km)"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3">
              <p className="mb-1 fw-semibold">Amenities</p>
              <div className="d-flex flex-wrap gap-3">
                {amenities.map((amenity) => (
                  <div className="form-check" key={amenity.id}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`buy-amenity-${amenity.id}`}
                      checked={filters.amenity_ids.includes(amenity.id)}
                      onChange={() => toggleAmenityFilter(amenity.id)}
                    />
                    <label className="form-check-label" htmlFor={`buy-amenity-${amenity.id}`}>
                      {amenity.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 d-flex gap-2 justify-content-end">
              <button className="btn btn-outline-secondary rounded-4" type="button" onClick={resetFilters}>
                Reset
              </button>
              <button className="btn btn-primary rounded-4 px-4" type="button" onClick={applyFilters}>
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mb-3" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="min-vh-100 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : viewMode === "cards" ? (
          <div className="row g-4">
            {properties.length === 0 ? (
              <div className="col-12">
                <div className="card border-primary rounded-4 shadow-sm">
                  <div className="card-body text-center py-5">
                    <i className="bi bi-search fs-1 text-primary d-block mb-3"></i>
                    <h5 className="fw-semibold">No properties match your filters</h5>
                  </div>
                </div>
              </div>
            ) : (
              properties.map((listing) => {
                const coverImage =
                  buildMediaUrl(listing.images?.[0]?.image_url) || "/images/House1.jpg";

                return (
                  <div className="col-7 col-md-5 col-xl-3" key={listing.id}>
                    <div
                      className="card border-primary p-1 h-100 shadow-sm"
                      style={{ transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
                    >
                      <img
                        src={coverImage}
                        className="card-img-top"
                        alt="Listing"
                        style={{ height: "210px", objectFit: "cover" }}
                      />
                      <div className="card-body pb-0">
                        <h5 className="card-title fw-semibold text-primary text-opacity-75 fs-3">
                          Ksh. {Number(listing.price || 0).toLocaleString()}
                        </h5>
                        <h5 className="card-title">{listing.county}</h5>
                        <p className="card-text">{listing.subcounty}</p>
                        <hr />
                        <div className="d-flex flex-row justify-content-between">
                          <div className="d-flex flex-row">
                            <IoBedOutline className="text-primary" style={{ fontSize: "20px" }} />
                            <p className="ps-2">{listing.bedrooms}</p>
                          </div>
                          <div className="d-flex flex-row">
                            <PiBathtub className="text-primary" style={{ fontSize: "20px" }} />
                            <p className="ps-2">{listing.bathrooms}</p>
                          </div>
                          <div className="d-flex flex-row">
                            <SlSizeFullscreen className="text-primary" style={{ fontSize: "20px" }} />
                            <p className="ps-2">
                              {Number(listing.size_sqm || 0).toLocaleString()} m<sup>2</sup>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div
            className="border rounded-3 border-primary"
            style={{ height: "calc(100vh - 230px)", minHeight: "75vh", overflow: "hidden" }}
          >
            <MapContainer
              key={`${mapCenter[0]}-${mapCenter[1]}-${properties.length}`}
              center={mapCenter}
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

              {properties
                .filter(
                  (house) =>
                    Number.isFinite(Number(house.latitude)) &&
                    Number.isFinite(Number(house.longitude)),
                )
                .map((house) => (
                  <Marker
                    key={house.id}
                    position={[Number(house.latitude), Number(house.longitude)]}
                    icon={mapMarkerIcon}
                  >
                    <Popup>
                      <div>
                        <p className="fw-semibold m-0">
                          Ksh. {Number(house.price || 0).toLocaleString()}
                        </p>
                        <p className="m-0">
                          {house.county}, {house.subcounty}
                        </p>
                        <small>
                          {house.bedrooms} bed • {house.bathrooms} bath
                        </small>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyPage;
