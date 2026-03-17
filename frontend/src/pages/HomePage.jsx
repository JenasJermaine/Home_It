import { Link } from "react-router-dom";
import { IoBedOutline } from "react-icons/io5";
import { PiBathtub } from "react-icons/pi";
import { SlSizeFullscreen } from "react-icons/sl";

const HomePage = () => {
  return (
    <div className="m-0 p-0">
      {/* Hero Section - Split Screen */}
      <div className="d-flex flex-row m-0">
        {/* Left Half */}
        <div
          className="col-6 d-flex flex-column p-5"
          style={{
            backgroundColor: "white",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{marginBottom: "65px"}}>
            <p className="fw-bold lh-1" style={{ fontSize: "40px" }}>
              Buy or sell your property easily
            </p>
            <p>
              A great platform to buy and sell your properties without any
              commisions
            </p>
          </div>
          <div className="d-flex flex-row border-start border-4 border-primary border-opacity-50">
            <div className="mt-5 me-5 ms-4">
              <p
                className="fw-semibold text-primary text-opacity-75"
                style={{ fontSize: "36px", lineHeight: "8px" }}
              >
                10k+
              </p>
              <p>users</p>
            </div>
            <div className="mt-5 me-5">
              <p
                className="fw-semibold text-primary text-opacity-75"
                style={{ fontSize: "36px", lineHeight: "8px" }}
              >
                10k+
              </p>
              <p>properties</p>
            </div>
          </div>
          <div style={{paddingTop: "75px"}}>
            <div className="d-flex flex-column">
              <div className="d-flex flex-row border border-bottom-0 rounded-top-2 align-items-center " style={{backgroundColor:"#f5f5f5", maxWidth: "165px"}}>
                <div className=" pt-2 px-4 border-bottom border-4 border-primary border-opacity-50">
                  <p className="fw-semibold text-primary text-opacity-75 ">Buy</p>
                </div>
                <div className=" pt-2 px-4">
                  <p className="fw-semibold">Sell</p>
                </div>
              </div>
              <div className="d-flex flex-row  border rounded-bottom-2 align-items-center" style={{backgroundColor:"#f5f5f5", maxWidth: "360px"}}>
                <div className="p-3 pb-1">
                  <p className="border-end pe-3">Location<p className="fw-bold fs-5">Karen, Nairobi</p></p>
                </div>
                <div className="pe-3">
                  <Link to="/Buy" className="btn btn-primary text-decoration-none ">Browse Properties</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Half */}
        <div
          className="col-6 px-5 py-5"
          style={{
            background: "url('/images/Map.png') no-repeat center",
            backgroundSize: "cover",
          }}
        >
          <div className="d-flex flex-column">
            <div className="d-flex flex-row justify-content-start">
              <div
                className="card mb-5 border-primary p-1"
                style={{ maxWidth: "16rem", minWidth: "248px" }}
              >
                <img
                  src="/images/House1.jpg"
                  className="card-img-top"
                  alt="house"
                />
                <div className="card-body pb-0">
                  <h5 className="card-title fw-semibold text-primary text-opacity-75 fs-3">
                    Ksh. 20,000,000
                  </h5>
                  <h5 className="card-title">Nairobi </h5>
                  <p className="card-text">Karen, Miotoni</p>
                  <hr />
                  <div className="d-flex flex-row justify-content-between">
                    <div className="d-flex flex-row">
                      <IoBedOutline
                        className="text-primary"
                        style={{ fontSize: "20px" }}
                      />
                      <p className="ps-2">4</p>
                    </div>
                    <div className="d-flex flex-row">
                      <PiBathtub
                        className="text-primary"
                        style={{ fontSize: "20px" }}
                      />
                      <p className="ps-2">2</p>
                    </div>
                    <div className="d-flex flex-row">
                      <SlSizeFullscreen
                        className="text-primary"
                        style={{ fontSize: "20px" }}
                      />
                      <p className="ps-2">
                        6 x 7.5 m<sup>2</sup>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex flex-row justify-content-end ">
              <div
                className="card border-primary p-1"
                style={{ maxWidth: " 11rem", minWidth: "178px" }}
              >
                <img
                  src="/images/House3.jpg"
                  className="card-img-top"
                  alt="house"
                />
                <div className="card-body pb-0">
                  <h5
                    className="card-title fw-semibold text-primary text-opacity-75"
                    style={{ fontSize: "18px" }}
                  >
                    Ksh. 13,500,000
                  </h5>
                  <h6 className="card-title">Nairobi </h6>
                  <p className="card-text" style={{ fontSize: "12px" }}>
                    Kilimani, Upper Hill
                  </p>
                  <hr />
                  <div className="d-flex flex-row justify-content-between">
                    <div className="d-flex flex-row">
                      <IoBedOutline
                        className="text-primary"
                        style={{ fontSize: "16px" }}
                      />
                      <p style={{ fontSize: "12px", paddingLeft: "2px" }}>3</p>
                    </div>
                    <div className="d-flex flex-row">
                      <PiBathtub
                        className="text-primary"
                        style={{ fontSize: "16px" }}
                      />
                      <p style={{ fontSize: "12px", paddingLeft: "2px" }}>2</p>
                    </div>
                    <div className="d-flex flex-row">
                      <SlSizeFullscreen
                        className="text-primary"
                        style={{ fontSize: "16px" }}
                      />
                      <p style={{ fontSize: "12px", paddingLeft: "2px" }}>
                        5.5 x 6 m<sup>2</sup>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
