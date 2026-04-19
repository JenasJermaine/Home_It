import { Link } from "react-router-dom";
import { buildMediaUrl, getMyProfile } from "../api/apiService";
import { useEffect, useMemo, useState } from "react";

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const isAuthenticated = localStorage.getItem("token");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await getMyProfile();
        const user = response.data?.data;
        setProfile(user || null);
      } catch {
        setProfile(null);
      }
    };

    loadProfile();
  }, [isAuthenticated]);

  const profileUrl = useMemo(
    () => buildMediaUrl(profile?.profile_picture_url || ""),
    [profile?.profile_picture_url],
  );

  const profileName = useMemo(() => {
    if (!profile) return "Profile";
    const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    return fullName || profile.username || "Profile";
  }, [profile]);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {isAuthenticated ? (
        <div
          className=" p-2 d-flex flex-column border rounded-end-4 border-primary position-fixed"
          style={{
            width: isExpanded ? "180px" : "56px",
            transition: "0.3s",
            height: "100vh",
            top: 0,
            left: 0,
            overflow: "visible",
            zIndex: 1000,
          }}
        >
          <button
            onClick={toggleSidebar}
            className="btn btn-sm border border-primary position-absolute d-flex align-items-center justify-content-center"
            style={{
              width: "22px",
              height: "22px",
              right: "-11px",
              top: "10px",
              backgroundColor: "white",
              padding: "0",
              zIndex: 1001,
            }}
          >
            {isExpanded ? (
              <i
                className="bi bi-chevron-left"
                style={{ fontSize: "17px" }}
              ></i>
            ) : (
              <i
                className="bi bi-chevron-right"
                style={{ fontSize: "17px" }}
              ></i>
            )}
          </button>

          <div
            className="h-100 d-flex flex-column"
            style={{ overflowY: "auto", overflowX: "hidden" }}
          >
            <div>
              {isExpanded ? (
                <Link to="/">
                  <img
                    src="/logo/HomeIt_Logo2.png"
                    alt="logo"
                    style={{ height: "50px" }}
                  />
                </Link>
              ) : (
                <Link to="/">
                  <img
                    src="/logo/HomeIt_Halflogo.png"
                    alt="logo"
                    style={{ height: "3rem" }}
                  />
                </Link>
              )}

              <hr className="border-primary opacity-100" />
            </div>
            <div>
              <Link
                to="/"
                className="sidebar-item d-flex align-items-center gap-2 rounded text-decoration-none"
              >
                <i className="bi bi-house" style={{ fontSize: "20px" }}></i>
                {isExpanded && <p className="m-0">Home</p>}
              </Link>
              <Link
                to="/Buy"
                className="sidebar-item d-flex align-items-center gap-2 rounded text-decoration-none"
              >
                <i className="bi bi-bag" style={{ fontSize: "20px" }}></i>
                {isExpanded && <p className="m-0">Buy</p>}
              </Link>
              <Link
                to="/Sell"
                className="sidebar-item d-flex align-items-center gap-2 rounded text-decoration-none"
              >
                <i
                  className="bi bi-cash-stack"
                  style={{ fontSize: "20px" }}
                ></i>
                {isExpanded && <p className="m-0">Sell</p>}
              </Link>
              <Link
                to="/Mylistings"
                className="sidebar-item d-flex align-items-center gap-2 rounded text-decoration-none"
              >
                <i className="bi bi-kanban" style={{ fontSize: "20px" }}></i>
                {isExpanded && <p className="m-0">My Listings</p>}
              </Link>
              <Link
                to="/Priceestimator"
                className="sidebar-item d-flex align-items-center gap-2 rounded text-decoration-none"
              >
                <i className="bi bi-graph-up" style={{ fontSize: "20px" }}></i>
                {isExpanded && <p className="m-0">Price Estimator</p>}
              </Link>
              <Link
                to="/Bookmarks"
                className="sidebar-item d-flex align-items-center gap-2 rounded text-decoration-none"
              >
                <i
                  className="bi bi-bookmark-heart"
                  style={{ fontSize: "20px" }}
                ></i>
                {isExpanded && <p className="m-0">Bookmarks</p>}
              </Link>
            </div>
            <div className="mt-auto">
              <Link
                to="/Help"
                className="sidebar-item d-flex align-items-center gap-2 rounded text-decoration-none"
              >
                <i
                  className="bi bi-question-circle"
                  style={{ fontSize: "20px" }}
                ></i>
                {isExpanded && <p className="m-0">Help</p>}
              </Link>
              <Link
                to="/Settings"
                className="sidebar-item d-flex align-items-center gap-2 rounded text-decoration-none"
              >
                <i className="bi bi-gear" style={{ fontSize: "20px" }}></i>
                {isExpanded && <p className="m-0">Settings</p>}
              </Link>
              <hr className="border-primary opacity-100" />
              <Link
                to="/Profile"
                className="d-flex align-items-center gap-2 text-decoration-none text-reset"
              >
                {profileUrl ? (
                  <img
                    src={profileUrl}
                    alt="Profile"
                    className="rounded-circle"
                    style={{ width: "38px", height: "38px", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center border border-primary"
                    style={{ width: "38px", height: "38px" }}
                  >
                    <i className="bi bi-person-fill text-primary" />
                  </div>
                )}
                {isExpanded && <p className="m-0">{profileName}</p>}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div
          className=" p-2 d-flex flex-column border rounded-end-4 border-primary position-fixed"
          style={{
            width: isExpanded ? "180px" : "56px",
            transition: "0.3s",
            height: "100vh",
            top: 0,
            left: 0,
            overflow: "visible",
            zIndex: 1000,
          }}
        >
          <div>
            {isExpanded ? (
              <Link to="/Signin">
                <img
                  src="/logo/HomeIt_Logo2.png"
                  alt="logo"
                  style={{ height: "50px" }}
                />
              </Link>
            ) : (
              <Link to="/Signin">
                <img
                  src="/logo/HomeIt_Halflogo.png"
                  alt="logo"
                  style={{ height: "3rem" }}
                />
              </Link>
            )}

            <button
              onClick={toggleSidebar}
              className="btn btn-sm border border-primary position-absolute d-flex align-items-center justify-content-center"
              style={{
                width: "22px",
                height: "22px",
                right: "-11px",
                top: "10px",
                backgroundColor: "white",
                padding: "0",
                zIndex: 1000,
              }}
            >
              {isExpanded ? (
                <i
                  className="bi bi-chevron-left"
                  style={{ fontSize: "17px" }}
                ></i>
              ) : (
                <i
                  className="bi bi-chevron-right"
                  style={{ fontSize: "17px" }}
                ></i>
              )}
            </button>
            <hr className="border-primary opacity-100" />
          </div>
          <Link
            to="/"
            className="sidebar-item d-flex align-items-center gap-2 rounded text-decoration-none"
          >
            <i className="bi bi-house" style={{ fontSize: "20px" }}></i>
            {isExpanded && <p className="m-0">Home</p>}
          </Link>
        </div>
      )}
    </>
  );
};

export default Sidebar;
