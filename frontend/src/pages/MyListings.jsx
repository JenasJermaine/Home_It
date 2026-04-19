import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoBedOutline } from "react-icons/io5";
import { PiBathtub } from "react-icons/pi";
import { SlSizeFullscreen } from "react-icons/sl";
import { buildMediaUrl, getAllProperties, getMyProfile } from "../api/apiService";

const MyListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMyListings = async () => {
      try {
        const profileResponse = await getMyProfile();
        const userId = profileResponse.data?.data?.id;

        if (!userId) {
          setListings([]);
          return;
        }

        let page = 1;
        let totalPages = 1;
        const allMine = [];

        do {
          const response = await getAllProperties({ page, limit: 50 });
          const rows = response.data?.data || [];
          totalPages = response.data?.pages || 1;
          allMine.push(...rows.filter((property) => property.seller?.id === userId));
          page += 1;
        } while (page <= totalPages);

        setListings(allMine);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load your listings.");
      } finally {
        setLoading(false);
      }
    };

    loadMyListings();
  }, []);

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
            <h2 className="fw-bold mb-1">My Listings</h2>
            <p className="text-muted m-0">
              Click any property card to open its details and edit it.
            </p>
          </div>
          <Link to="/Sell" className="text-primary" style={{ fontSize: "30px" }}>
            <i className="bi bi-plus-circle me-2"></i>
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {listings.length === 0 ? (
          <div className="card border-primary rounded-4 shadow-sm">
            <div className="card-body text-center py-5">
              <i className="bi bi-house fs-1 text-primary d-block mb-3"></i>
              <h5 className="fw-semibold">You have no listings yet</h5>
              <p className="text-muted">Create your first listing to see it here.</p>
              <Link to="/Sell" className="btn btn-primary rounded-4">
                Create Listing
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {listings.map((listing) => {
              const coverImage =
                buildMediaUrl(listing.images?.[0]?.image_url) || "/images/House1.jpg";

              return (
                <div className="col-7 col-md-5 col-xl-3" key={listing.id}>
                  <Link
                    to={`/Mylistings/${listing.id}`}
                    className="text-decoration-none text-reset"
                  >
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
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListingsPage;
