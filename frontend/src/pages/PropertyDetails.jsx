import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "pannellum/build/pannellum.css";
import "pannellum/build/pannellum.js";
import {
  buildMediaUrl,
  getPanoramicTourByProperty,
  getPropertyById,
} from "../api/apiService";

const DEFAULT_LAT = -1.2921;
const DEFAULT_LNG = 36.8219;
const YAW_EDGE_LIMIT = 179;

const PannellumViewer = ({ panoramaUrl }) => {
  const viewerRef = useRef(null);
  const pannellumInstanceRef = useRef(null);

  useEffect(() => {
    if (!viewerRef.current) return;
    const pannellum = window.pannellum;
    if (!pannellum?.viewer) return;

    pannellumInstanceRef.current = pannellum.viewer(viewerRef.current, {
      type: "equirectangular",
      panorama: panoramaUrl,
      autoLoad: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      pitch: 10,
      yaw: 180,
      hfov: 110,
      minYaw: -YAW_EDGE_LIMIT,
      maxYaw: YAW_EDGE_LIMIT,
    });

    return () => {
      if (pannellumInstanceRef.current) {
        pannellumInstanceRef.current.destroy();
      }
    };
  }, [panoramaUrl]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: "100%",
        height: "420px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
};

const PannellumTourViewer = ({ scenes }) => {
  const viewerRef = useRef(null);
  const pannellumInstanceRef = useRef(null);

  useEffect(() => {
    if (!viewerRef.current || scenes.length === 0) return;
    const pannellum = window.pannellum;
    if (!pannellum?.viewer) return;

    const sortedScenes = [...scenes].sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0),
    );
    const sceneConfig = {};

    sortedScenes.forEach((scene) => {
      const hotSpots = (scene.hotspots || [])
        .map((hotspot) => {
          const type = hotspot.type || "scene";
          const base = {
            pitch: hotspot.pitch,
            yaw: hotspot.yaw,
            type,
            text: hotspot.text || "",
          };

          if (type === "scene" && hotspot.target_scene_id) {
            return {
              ...base,
              sceneId: String(hotspot.target_scene_id),
            };
          }

          if (type !== "scene") {
            return base;
          }

          return null;
        })
        .filter(Boolean);

      sceneConfig[String(scene.id)] = {
        type: "equirectangular",
        panorama: buildMediaUrl(scene.image_url),
        pitch: scene.pitch ?? 0,
        yaw: scene.yaw ?? 0,
        hfov: scene.hfov ?? 110,
        minYaw: -YAW_EDGE_LIMIT,
        maxYaw: YAW_EDGE_LIMIT,
        hotSpots,
      };
    });

    pannellumInstanceRef.current = pannellum.viewer(viewerRef.current, {
      autoLoad: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      default: {
        firstScene: String(sortedScenes[0]?.id),
        sceneFadeDuration: 1000,
      },
      scenes: sceneConfig,
    });

    return () => {
      if (pannellumInstanceRef.current) {
        pannellumInstanceRef.current.destroy();
      }
    };
  }, [scenes]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: "100%",
        height: "420px",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
};

const PropertyDetailsPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panoramicScenes, setPanoramicScenes] = useState([]);

  const mapMarkerIcon = useMemo(
    () =>
      L.icon({
        iconUrl: "/MapMarker/TranparentBGMapMarker.png",
        iconSize: [55, 85],
        iconAnchor: [27, 80],
      }),
    [],
  );

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getPropertyById(id);
        const details = response.data?.data;
        if (!details) {
          setError("Property not found.");
          setProperty(null);
          return;
        }
        setProperty(details);
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to load property details.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  useEffect(() => {
    const loadPanoramicScenes = async () => {
      try {
        const response = await getPanoramicTourByProperty(id);
        setPanoramicScenes(response.data?.data || []);
      } catch {
        setPanoramicScenes([]);
      }
    };

    loadPanoramicScenes();
  }, [id]);

  const images = property?.images || [];
  const panoramicImages = images.filter(
    (image) => String(image.image_type || "").toLowerCase() === "panoramic",
  );
  const normalImages = images.filter(
    (image) => String(image.image_type || "").toLowerCase() !== "panoramic",
  );
  const coverImage =
    buildMediaUrl(images[0]?.image_url) || "/images/House1.jpg";

  const lat = Number(property?.latitude);
  const lng = Number(property?.longitude);
  const mapCenter =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? [lat, lng]
      : [DEFAULT_LAT, DEFAULT_LNG];

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <Link to="/Buy" className="btn btn-outline-primary rounded-4">
          Back to Buy
        </Link>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">{property.property_type}</h2>
            <p className="text-muted m-0">
              {property.county}, {property.subcounty}
            </p>
          </div>
          <Link to="/Buy" className="btn btn-outline-primary rounded-4">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Buy
          </Link>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="card border-primary shadow-sm mb-4">
              <img
                src={coverImage}
                alt="Property"
                className="card-img-top"
                style={{ height: "260px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h5 className="card-title fw-semibold text-primary text-opacity-75 fs-3">
                  Ksh. {Number(property.price || 0).toLocaleString()}
                </h5>
                <p className="mb-2">{property.description}</p>
                <div className="d-flex flex-wrap gap-2 small text-muted">
                  <span>{property.bedrooms} beds</span>
                  <span>{property.bathrooms} baths</span>
                  <span>
                    {Number(property.size_sqm || 0).toLocaleString()} sqm
                  </span>
                  <span>
                    Land {Number(property.land_size_sqm || 0).toLocaleString()}{" "}
                    sqm
                  </span>
                </div>
              </div>
            </div>

            {property.seller && (
              <div className="card border-primary shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="fw-semibold mb-3">Contact the Owner</h5>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    {property.seller.profile_picture_url ? (
                      <img
                        src={buildMediaUrl(property.seller.profile_picture_url)}
                        alt="Owner profile"
                        className="rounded-circle"
                        style={{ width: "52px", height: "52px", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center border border-primary"
                        style={{ width: "52px", height: "52px" }}
                      >
                        <i className="bi bi-person-fill text-primary fs-4" />
                      </div>
                    )}
                    <div>
                      <div className="fw-semibold">
                        {`${property.seller.first_name || ""} ${property.seller.last_name || ""}`.trim() ||
                          property.seller.username ||
                          "Owner"}
                      </div>
                      {property.seller.email && (
                        <a
                          href={`mailto:${property.seller.email}`}
                          className="text-primary text-decoration-none small"
                        >
                          {property.seller.email}
                        </a>
                      )}
                    </div>
                  </div>
                  {property.seller.email && (
                    <a
                      href={`mailto:${property.seller.email}`}
                      className="btn btn-outline-primary rounded-4 w-100"
                    >
                      Email Owner
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="card border-primary shadow-sm">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Quick Details</h5>
                <div className="row g-2 small">
                  <div className="col-6">Floors: {property.floors}</div>
                  <div className="col-6">Year Built: {property.year_built}</div>
                  <div className="col-6">Condition: {property.condition}</div>
                  <div className="col-6">Status: {property.status}</div>
                  <div className="col-6">
                    Predicted: Ksh.{" "}
                    {Number(property.predicted_price || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card border-primary shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Location</h5>
                <div
                  className="border rounded-3 border-primary"
                  style={{ height: "320px", width: "100%", overflow: "hidden" }}
                >
                  <MapContainer
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
                    {Number.isFinite(lat) && Number.isFinite(lng) && (
                      <Marker position={[lat, lng]} icon={mapMarkerIcon} />
                    )}
                  </MapContainer>
                </div>
              </div>
            </div>

            <div className="card border-primary shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Property Images</h5>
                <div className="row g-3">
                  {normalImages.length === 0 ? (
                    <div className="col-12 text-muted">No images uploaded.</div>
                  ) : (
                    normalImages.map((image) => (
                      <div className="col-md-6" key={image.id}>
                        <img
                          src={buildMediaUrl(image.image_url)}
                          alt="Property"
                          className="w-100 rounded-3"
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="card border-primary shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Virtual Tour</h5>
                {panoramicScenes.length > 0 ? (
                  <PannellumTourViewer scenes={panoramicScenes} />
                ) : panoramicImages.length > 0 ? (
                  <div className="d-flex flex-column gap-4">
                    {panoramicImages.map((image) => (
                      <PannellumViewer
                        key={image.id}
                        panoramaUrl={buildMediaUrl(image.image_url)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted">
                    No panoramic tour available.
                  </div>
                )}
              </div>
            </div>

            <div className="card border-primary shadow-sm">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Amenities</h5>
                {property.amenities?.length ? (
                  <div className="d-flex flex-wrap gap-2">
                    {property.amenities.map((amenity) => (
                      <span key={amenity.id} className="badge text-bg-primary">
                        {amenity.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted">No amenities listed.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
