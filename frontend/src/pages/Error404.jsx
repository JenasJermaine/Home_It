import { Link } from "react-router-dom";

const Error404Page = () => {
  return (
    <div className="min-vh-100 bg-light d-flex align-items-center">
      <div className="container text-center py-5">
        <div className="display-1 fw-bold text-primary">404</div>
        <h2 className="fw-semibold mb-2">Page not found</h2>
        <p className="text-muted mb-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <Link to="/" className="btn btn-primary">
            Go to Home
          </Link>
          <Link to="/Buy" className="btn btn-outline-secondary">
            Browse Listings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Error404Page;