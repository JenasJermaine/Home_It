import jwt from "jsonwebtoken";
import db from "../models/index.js";

//This middleware function, auth, is designed to protect routes that require user authentication.
// It ensures that any request to a protected endpoint comes from an authenticated and valid user.

// The 'auth' middleware function. It takes the request (req), response (res),
// and the next middleware function in the stack.
const auth = async (req, res, next) => {
  try {
    // 1. Get the token from the 'Authorization' header.
    const token = req.header("Authorization").replace("Bearer ", "");
    //2. Verify the token using the secret key.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3. Find the user in the database using the ID from the decoded token.
    const user = await db.User.findByPk(decoded.id);

    if (!user) {
      throw new Error("User does not exist.");
    }

    // 4. If the user is valid, attach the token and user object to the request.
    req.token = token;
    req.user = user;

    // 5. Call next() to pass control to the next middleware/route handler
    next();
  } catch (error) {
    if (error.message === "User does not exist.") {
      res.status(401).send({ error: "User does not exist." });
    } else {
      res.status(401).send({ error: "Please Authenticate." });
    }
  }
};
export default auth;
