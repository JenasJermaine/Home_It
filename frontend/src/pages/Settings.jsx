import { Link, useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/Signin");
  };

  return (
    <div className="min-vh-100 bg-light px-3 py-4">
      <div className="container" style={{ maxWidth: "720px" }}>
        <div className="mb-4">
          <h2 className="fw-bold mb-1">Settings</h2>
          <p className="text-muted mb-0">Manage your account and appearance.</p>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-semibold mb-3">Account</h5>
            <div className="d-flex flex-column gap-3">
              <Link to="/Profile" className="btn btn-outline-primary w-100">
                Edit Profile
              </Link>
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;