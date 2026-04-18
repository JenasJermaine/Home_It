import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/apiService";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.error || "Log-In failed");
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
            <p className="fw-semibold fs-2">Welcome Back!</p>
            <p className="">Enter your credentials to access your account</p>
          </div>
          {error && <div className="alert alert-danger rounded-4">{error}</div>}
          <div className="mt-4">
            <label className="fw-semibold p-1" htmlFor="">
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
            <label className="fw-semibold p-1" htmlFor="">
              Password
            </label>
            <br />
            <input
              className="form-control mb-4 rounded-4"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
