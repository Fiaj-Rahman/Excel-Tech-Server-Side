,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,Excel Tech,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,


Backend Overview:
The Excel Tech Website's backend has been developed using Express.js, Node.js, MongoDB, and JWT for handling user authentication and managing flight bookings.

Required Configuration:
To run the backend code successfully, you will need to set up the following credentials and keys:

MongoDB Database Configuration:

You will need the MongoDB database username and password to connect the backend to the MongoDB database.
ACCESS_TOKEN_SECRET_KEY:

You will also need to define an ACCESS_TOKEN_SECRET_KEY for securely signing and verifying JWT tokens used for user authentication.

Required npm Packages:

Before running the backend code, install the following npm packages:

bcrypt: For hashing and securing passwords.
cookie-parser: For parsing cookies in requests.
cors: For enabling Cross-Origin Resource Sharing (CORS) for the backend.
dotenv: For managing environment variables (like secret keys and database credentials).
express: The core web framework used to build the backend.
jsonwebtoken (JWT): For generating and verifying JSON Web Tokens for secure authentication.
mongodb: For connecting and interacting with the MongoDB database.
This backend will handle all user authentication, booking management, and related functionalities by securely storing and managing user data in MongoDB and using JWT for authentication.s