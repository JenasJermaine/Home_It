import { useEffect, useState } from "react";
import { IoBedOutline } from "react-icons/io5";
import { PiBathtub } from "react-icons/pi";
import { SlSizeFullscreen } from "react-icons/sl";
import { useNavigate } from "react-router-dom";
import {
  buildMediaUrl,
  deleteBookmarkByProperty,
  getMyBookmarks,
} from "../api/apiService";

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removingIds, setRemovingIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const loadBookmarks = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setError("Please sign in to view your bookmarks.");
        return;
      }

      try {
        const response = await getMyBookmarks();
        setBookmarks(response.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load bookmarks.");
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  const removeBookmark = async (event, propertyId) => {
    event.stopPropagation();
    setError("");
    setMessage("");
    setRemovingIds((prev) => new Set(prev).add(propertyId));
    try {
      await deleteBookmarkByProperty(propertyId);
      setBookmarks((prev) =>
        prev.filter(
          (bookmark) =>
            (bookmark.property?.id ?? bookmark.property_id) !== propertyId,
        ),
      );
      setMessage("Bookmark removed.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove bookmark.");
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(propertyId);
        return next;
      });
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
        <div className="mb-4">
          <h2 className="fw-bold mb-1">Bookmarks</h2>
          <p className="text-muted mb-0">
            Saved listings you can revisit anytime.
          </p>
        </div>

        {(error || message) && (
          <div
            className={`alert ${error ? "alert-danger" : "alert-success"} mb-3`}
            role="alert"
          >
            {error || message}
          </div>
        )}

        {bookmarks.length === 0 ? (
          <div className="card border-primary rounded-4 shadow-sm">
            <div className="card-body text-center py-5">
              <i className="bi bi-bookmark fs-1 text-primary d-block mb-3"></i>
              <h5 className="fw-semibold">No bookmarks yet</h5>
              <p className="text-muted mb-0">
                Start browsing and save listings you like.
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {bookmarks.map((bookmark) => {
              const property = bookmark.property;
              if (!property) return null;
              const coverImage =
                buildMediaUrl(property.images?.[0]?.image_url) ||
                "/images/House1.jpg";

              return (
                <div className="col-7 col-md-5 col-xl-3" key={bookmark.id}>
                  <div
                    className="card border-primary p-1 h-100 shadow-sm position-relative"
                    style={{
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      cursor: "pointer",
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/properties/${property.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        navigate(`/properties/${property.id}`);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="btn position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center"
                      style={{ width: "36px", height: "36px" }}
                      onClick={(event) => removeBookmark(event, property.id)}
                      onKeyDown={(event) => event.stopPropagation()}
                      disabled={removingIds.has(property.id)}
                      aria-label="Remove bookmark"
                    >
                      <i 
                        className="bi bi-bookmark-fill text-primary"
                        style={{ fontSize: "1.5rem" }}
                      ></i>
                    </button>
                    <img
                      src={coverImage}
                      className="card-img-top"
                      alt="Listing"
                      style={{ height: "210px", objectFit: "cover" }}
                    />
                    <div className="card-body pb-0">
                      <h5 className="card-title fw-semibold text-primary text-opacity-75 fs-3">
                        Ksh. {Number(property.price || 0).toLocaleString()}
                      </h5>
                      <h5 className="card-title">{property.county}</h5>
                      <p className="card-text">{property.subcounty}</p>
                      <hr />
                      <div className="d-flex flex-row justify-content-between">
                        <div className="d-flex flex-row">
                          <IoBedOutline
                            className="text-primary"
                            style={{ fontSize: "20px" }}
                          />
                          <p className="ps-2">{property.bedrooms}</p>
                        </div>
                        <div className="d-flex flex-row">
                          <PiBathtub
                            className="text-primary"
                            style={{ fontSize: "20px" }}
                          />
                          <p className="ps-2">{property.bathrooms}</p>
                        </div>
                        <div className="d-flex flex-row">
                          <SlSizeFullscreen
                            className="text-primary"
                            style={{ fontSize: "20px" }}
                          />
                          <p className="ps-2">
                            {Number(property.size_sqm || 0).toLocaleString()} m
                            <sup>2</sup>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;