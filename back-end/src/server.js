// Backend server, currently integrated with MongoDB
import express from 'express';
import './config/env.js';
import { connectToDB } from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

import marketplaceRoutes from './routes/marketplaceRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import saveRoutes from './routes/saveRoutes.js';
import messageRoutes from './routes/messageRoutes.js';


// Initialise express
const app = express();
app.use(express.json());



// Backend Logging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});
 


// ROUTES
// Marketplace
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/marketplace', listingRoutes);
// Admin
app.use('/api/admin', adminRoutes);
// Profile
app.use('/api/profile', profileRoutes);
app.use('/api/user', userRoutes);
// Saved
app.use('/api/saves', saveRoutes);
// Messages
app.use('/api/messages', messageRoutes);

// Error Handler
app.use(errorHandler);

//import path from 'path';

//import {fileURLToPath } from 'url';
//const __filename = fileURLToPath(import.meta.url);   // these are for when the front-end final build is ready
//const __dirname = path.__dirname(__filename);        // the load the dist file when it is in the back-end once built 

/*   
// below is code for once the front-end is built and implemented as files in the back-end

app.use(express.static(path.join(__dirname, '../dist')))

app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
})
*/

const PORT = process.env.PORT || 8000; // Allows for enviroment to choose port with default of 8000

// Function for starting server
async function start() {
  await connectToDB();
  app.listen(PORT, function() {
    console.log('Server is listening on port ' + PORT);
  });
}

start();