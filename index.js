const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10; // You can adjust the salt rounds based on your security preference



const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174','https://exceltech-aa221.web.app','https://exceltech-aa221.firebaseapp.com'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())
app.use(cors());


// JWT Verify MiddleWare 

const verifyWebToken = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ message: 'Unauthorized Access' })
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: 'Unauthorized Access' })

      }
      console.log(decoded)
      req.user = decoded
      next()

    })

  }
  console.log(token)


}



// MongoDB URI from environment variables
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_USERPASSWORD}@cluster0.neywkpg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect to the MongoDB client
    // await client.connect();


    const SignUpUserCollection = client.db('AvesDigital').collection('Users')
    const flightCollection = client.db('AvesDigital').collection('Flight')
    const BookingCollection = client.db('AvesDigital').collection('BookingSeat')


    //jwt generate

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: '365d'
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      }).send({ success: true })
    })



    // clear token on logout

    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            httpOnly: true,
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
        console.log('Logout successful')
      } catch (err) {
        res.status(500).send(err)
      }
    })



    // ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,


    // Example Express.js Backend Route (assuming MongoDB)


    // signUP user data save here 


    app.post('/signup', async (req, res) => {
      const { fullName, email, phoneNumber, nationality, role, image, password } = req.body;

      try {
        // Check if the user already exists by email
        const existingUser = await SignUpUserCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash the password if provided
        let hashedPassword = password;
        if (password) {
          hashedPassword = await bcrypt.hash(password, saltRounds); // Salt rounds can be adjusted
        }

        // Insert user data into the User collection
        const newUser = {
          fullName,
          email,
          phoneNumber,
          nationality,
          role,
          image,
          password: hashedPassword,
        };

        const result = await SignUpUserCollection.insertOne(newUser);

        if (result.acknowledged) {
          // Send a success response
          res.status(200).json({ success: true, message: 'User created successfully' });
        } else {
          res.status(500).json({ success: false, message: 'Error creating user' });
        }
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });


    //get the signUP user data
    app.get('/signup', async (req, res) => {
      const result = await SignUpUserCollection.find().toArray()
      res.send(result)
    });





    // add flight 


    // Add Flight Route
    app.post('/flight', verifyWebToken, async (req, res) => {
      try {
        const {
          flightNumber,
          departureAirport,
          arrivalAirport,
          flightDate,
          flightTime,
          aircraftType,
          duration,
          seatAvailability,
          price,
          classType,
        } = req.body;

        // Construct the formData object
        const formData = {
          flightNumber,
          departureAirport,
          arrivalAirport,
          flightDate: new Date(flightDate), // Convert to Date object
          flightTime,
          aircraftType,
          duration,
          seatAvailability,
          price,
          classType,
          createdAt: new Date(),
        };

        // Insert into MongoDB using the native driver
        const result = await flightCollection.insertOne(formData);

        res.status(200).json({ message: 'Flight added successfully', result });
      } catch (error) {
        console.error('Error handling flight submission:', error);
        res.status(500).json({ message: 'Error submitting flight data', error: error.message });
      }
    });


    app.get('/flight', async (req, res) => {
      const result = await flightCollection.find().toArray()
      res.send(result)
    });



    app.get('/flight-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await flightCollection.findOne(query);
      res.send(result);
    });


        // Backend: Delete Flight (DELETE)
        app.delete('/flights/:id', async (req, res) => {
          try {
            const { id } = req.params; // Extract the Flight ID from URL parameters
    
            // Delete the Flight from the database
            const result = await flightCollection.deleteOne({ _id: new ObjectId(id) });
    
            if (result.deletedCount > 0) {
              res.status(200).send({ message: 'Flight deleted successfully' });
            } else {
              res.status(404).send({ message: 'Flight not found' });
            }
          } catch (error) {
            res.status(500).send({ message: 'An error occurred while deleting the Flight.', error });
          }
        });
    



        // PUT: Update flight details
app.put('/flights/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;  // Get the updated flight data from the request body

  try {
    // Validate the ID (MongoDB ObjectId)
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid flight ID' });
    }

    // Update the flight document by ID
    const result = await flightCollection.updateOne(
      { _id: new ObjectId(id) }, // Find the flight by ID
      { $set: updatedData } // Update the flight with new data
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: 'Flight not found' });
    }

    res.status(200).send({ message: 'Flight updated successfully' });

  } catch (error) {
    console.error('Error updating flight:', error);
    res.status(500).send({ message: 'An error occurred while updating the flight.' });
  }
});



// flight booking 
app.post('/flight-booking', async (req, res) => {
  try {
      const {
          flightId,
          flightNumber,
          departureAirport,
          arrivalAirport,
          flightDate,
          flightTime,
          seatCount,
          totalCost,
          transactionId,
          user,
          loginPerson,
          loginUserImage,
      } = req.body;

      // Create a new booking record
      const newBooking = {
          flightId,
          flightNumber,
          departureAirport,
          arrivalAirport,
          flightDate,
          flightTime,
          seatCount,
          totalCost,
          transactionId,
          user,
          loginPerson,
          loginUserImage,
          createdAt: new Date(),  // Add the current timestamp
      };

      // Save the booking to the database using MongoDB native driver
      const result = await BookingCollection.insertOne(newBooking);

      // Respond with success message and the saved booking data
      res.status(201).json({ message: "Booking confirmed!" });
  } catch (error) {
      console.error("Error booking flight:", error);
      res.status(500).json({ message: "Error booking flight, please try again." });
  }
});



app.get('/flight-booking', async (req, res) => {
  const result = await BookingCollection.find().toArray()
  res.send(result)
});


  // Backend: Delete Flight (DELETE)
  app.delete('/flight-booking/:id', async (req, res) => {
    try {
      const { id } = req.params; // Extract the Flight ID from URL parameters

      // Delete the Flight from the database
      const result = await BookingCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount > 0) {
        res.status(200).send({ message: 'Flight deleted successfully' });
      } else {
        res.status(404).send({ message: 'Flight not found' });
      }
    } catch (error) {
      res.status(500).send({ message: 'An error occurred while deleting the Flight.', error });
    }
  });




  const { ObjectId } = require('mongodb');

  app.put('/flight-booking/:id', async (req, res) => {
    const { id } = req.params;
    let updatedData = req.body; // Get the updated flight data from the request body
  
    try {
      // Validate the ID (MongoDB ObjectId)
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid flight ID' });
      }
  
      // Remove _id from the update data to prevent accidental modification
      delete updatedData._id;
  
      // Ensure all fields to be updated are correctly formatted
      const { flightNumber, departureAirport, arrivalAirport, flightDate, flightTime, price } = updatedData;
  
      // Update the flight document by ID
      const result = await BookingCollection.updateOne(
        { _id: new ObjectId(id) }, // Find the flight by ID
        { $set: { flightNumber, departureAirport, arrivalAirport, flightDate, flightTime, price } } // Update only these fields
      );
  
      if (result.matchedCount === 0) {
        return res.status(404).send({ message: 'Flight not found' });
      }
  
      res.status(200).send({ message: 'Flight updated successfully' });
  
    } catch (error) {
      console.error('Error updating flight:', error);
      res.status(500).send({ message: 'An error occurred while updating the flight.' });
    }
  });
  
  

  // user cancel her/his booking 
  // PUT: Update booking status to "refund"
app.put('/flight-bookings/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the ID (MongoDB ObjectId)
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid booking ID' });
    }

    // Update the booking's status to "refund"
    const result = await BookingCollection.updateOne(
      { _id: new ObjectId(id) },  // Find the booking by ID
      { $set: { status: 'refund' } }  // Update the status field to "refund"
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: 'Booking not found' });
    }

    res.status(200).send({ message: 'Booking status updated to refund' });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).send({ message: 'An error occurred while updating the booking.' });
  }
});


// PUT: Update booking refund approval
app.put('/flights-bookings/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the ID (MongoDB ObjectId)
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid booking ID' });
    }

    // Update the booking's status to "refund"
    const result = await BookingCollection.updateOne(
      { _id: new ObjectId(id) },  // Find the booking by ID
      { $set: { refund: "yes" } }  // Update the status field to "refund"
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: 'Booking not found' });
    }

    res.status(200).send({ message: 'Booking status updated to refund' });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).send({ message: 'An error occurred while updating the booking.' });
  }
});




// profile data update 

// Update user profile
app.put('/profile/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    // Validate the ID (MongoDB ObjectId)
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid user ID' });
    }

    // Remove _id from the update data to prevent accidental modification
    delete updatedData._id;

    // Update the profile document by ID
    const result = await SignUpUserCollection.updateOne(
      { _id: new ObjectId(id) }, // Find the user by ID
      { $set: updatedData } // Update the profile with the new data
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: 'User profile not found' });
    }

    res.status(200).send({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).send({ message: 'An error occurred while updating the profile' });
  }
});














    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);

// Define a simple route
app.get('/', (req, res) => {
  res.send("Online Medical server is running..");
});



// Global route error handler
app.all('*', (req , res)=> {
  res.status(400).json({
      success: false,
      message: 'Route Not Found',
  });
});

// Global Error handle
app.use((error, req, res, next) => {
  if (error) {
      res.status(400).json({
          success: false,
          message: 'Server something went wrong',
      });
  }
  next();
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

