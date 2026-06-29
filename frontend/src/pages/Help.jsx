import { Link } from "react-router-dom";

const HelpPage = () => {
  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-4">
        <div className="mb-4">
          <h2 className="fw-bold mb-1">Help Center</h2>
          <p className="text-muted mb-0">
            Quick guides to help you buy, sell, and estimate prices.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-primary shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Getting started</h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 h-100">
                      <h6 className="fw-semibold">Buying a home</h6>
                      <p className="text-muted small mb-2">
                        Browse listings, compare prices, and save your favorites.
                      </p>
                      <Link to="/Buy" className="text-primary fw-semibold">
                        Go to Buy
                      </Link>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 h-100">
                      <h6 className="fw-semibold">Selling a home</h6>
                      <p className="text-muted small mb-2">
                        Add details, amenities, and photos to list your property.
                      </p>
                      <Link to="/Sell" className="text-primary fw-semibold">
                        Go to Sell
                      </Link>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 h-100">
                      <h6 className="fw-semibold">Price estimation</h6>
                      <p className="text-muted small mb-2">
                        Use the ML estimator to get an instant price range.
                      </p>
                      <Link
                        to="/Priceestimator"
                        className="text-primary fw-semibold"
                      >
                        Open Price Estimator
                      </Link>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 h-100">
                      <h6 className="fw-semibold">Virtual tours</h6>
                      <p className="text-muted small mb-2">
                        Panoramic images let buyers explore properties room by
                        room.
                      </p>
                      <Link to="/Buy" className="text-primary fw-semibold">
                        Explore tours
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-primary shadow-sm">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Frequently asked questions</h5>
                <div className="d-flex flex-column gap-3">
                  <div className="border rounded-3 p-3">
                    <h6 className="fw-semibold mb-1">
                      How does the price estimator work?
                    </h6>
                    <p className="text-muted small mb-0">
                      The estimator uses property attributes and amenities to
                      generate a price suggestion based on the trained ML
                      model.
                    </p>
                  </div>
                  <div className="border rounded-3 p-3">
                    <h6 className="fw-semibold mb-1">
                      Can I edit my listing after publishing?
                    </h6>
                    <p className="text-muted small mb-0">
                      Yes. Go to My Listings, open a listing, and update
                      details, amenities, images, or pricing.
                    </p>
                  </div>
                  <div className="border rounded-3 p-3">
                    <h6 className="fw-semibold mb-1">
                      How do I add a panoramic tour?
                    </h6>
                    <p className="text-muted small mb-0">
                      Upload panoramic images on the Sell page and configure
                      tour hotspots. The tour will appear on the property
                      details page.
                    </p>
                  </div>
                  <div className="border rounded-3 p-3">
                    <h6 className="fw-semibold mb-1">
                      How do I reset my password?
                    </h6>
                    <p className="text-muted small mb-0">
                      Go to Settings and choose Edit Profile to update your
                      account details. Password reset support will be added
                      soon.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-primary shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-semibold mb-3">Need more help?</h5>
                <p className="text-muted mb-3">
                  Reach out to the Home It support team and we’ll respond
                  quickly.
                </p>
                <div className="d-grid gap-2">
                  <a
                    href="mailto:support@homeit.com"
                    className="btn btn-outline-primary"
                  >
                    Email support@homeit.com
                  </a>
                  <a href="tel:+254700000000" className="btn btn-outline-secondary">
                    Call +254 700 000 000
                  </a>
                </div>
              </div>
            </div>

            <div className="card border-primary shadow-sm mb-4">
              <div className="card-body">
                <h6 className="fw-semibold">Quick tips</h6>
                <ul className="text-muted small mb-0">
                  <li>Use clear photos and accurate amenities.</li>
                  <li>Verify the map pin for precise location.</li>
                  <li>Run the estimator before setting your final price.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;