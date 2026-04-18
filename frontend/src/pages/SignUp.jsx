import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/apiService";

const SignUpPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password_hash, setPasswordHash] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await register({ username, email, password_hash });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="d-flex flex-row min-vh-100 ">
      <div className="container d-flex flex-column w-50 justify-content-center align-items-center">
        <form className="w-75" onSubmit={handleSubmit}>
          <div>
            <img
              src="/logo/HomeIt_Logo.png"
              alt="Home It Logo"
              className="w-50"
            />
          </div>
          <div>
            <p className="fw-semibold fs-2">Get Started Now</p>
          </div>
          {error && <div className="alert alert-danger rounded-4">{error}</div>}
          <div className="mt-4">
            <label className="fw-semibold p-1">
              Username
            </label>
            <br />
            <input
              className="form-control mb-4 rounded-4"
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="fw-semibold p-1">
              Email address
            </label>
            <br />
            <input
              className="form-control mb-4 rounded-4"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="fw-semibold p-1">
              Password
            </label>
            <br />
            <input
              className="form-control mb-4 rounded-4"
              type="password"
              name="password_hash"
              value={password_hash}
              placeholder="Enter your password"
              onChange={(e) => setPasswordHash(e.target.value)}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="btn w-100 rounded-4 btn-primary mt-3 mb-3"
            >
              Sign-Up
            </button>
          </div>
          <div>
            <hr className="border border-1 opacity-75" />
          </div>
        </form>
        <div>
          <p>
            Have an account?
            <Link style={{ textDecoration: "none" }} to="/Signin">
              Sign-In
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

export default SignUpPage;
