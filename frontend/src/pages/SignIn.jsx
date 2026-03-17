import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-row min-vh-100 ">
      <div className="container d-flex flex-column w-50 justify-content-center align-items-center">
        <form className="w-75" action="">
          <div>
            <img
              src="/logo/HomeIt_Logo.png"
              alt="Home It Logo"
              className="w-50"
            />
          </div>
          <div>
            <p className="fw-semibold fs-2">Welcome Back!</p>
            <p className="">Enter your credentials to access your account</p>
          </div>
          <div className="mt-4">
            <label className="fw-semibold p-1" htmlFor="">
              Email address
            </label>
            <br />
            <input
              className="form-control mb-4 rounded-4"
              type="email"
              name="email"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="fw-semibold p-1" htmlFor="">
              Password
            </label>
            <br />
            <input
              className="form-control mb-4 rounded-4"
              type="password"
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="btn w-100 rounded-4 btn-primary mt-3 mb-3"
            >
              Sign-In
            </button>
          </div>
          <div>
            <hr className="border border-1 opacity-75" />
          </div>
        </form>
        <div>
          <p>
            Don't have an account?{" "}
            <Link style={{ textDecoration: "none" }} to="/Signup">
              Sign-Up
            </Link>
          </p>
        </div>
      </div>
      <div className="w-50">
        <img
          src="/images/House2.jpg"
          alt="Image of a House"
          className="img-fluid w-100 h-100 object-fit-cover rounded-start-5"
        />
      </div>
    </div>
  );
};

export default SignInPage;
