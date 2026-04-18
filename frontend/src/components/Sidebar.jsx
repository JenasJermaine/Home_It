import { Link } from "react-router-dom";

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const isAuthenticated = true;

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
              <i className="bi bi-chevron-left" style={{ fontSize: "17px" }}></i>
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
                <i className="bi bi-cash-stack" style={{ fontSize: "20px" }}></i>
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
                <i
                  className="bi bi-graph-up"
                  style={{ fontSize: "20px" }}
                ></i>
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
                <img
                  src="/images/House1.jpg"
                  alt="profile picture"
                  className="rounded-circle"
                  style={{ width: "38px", height: "38px" }}
                />
                {isExpanded && <p className="m-0">John Doe</p>}
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
