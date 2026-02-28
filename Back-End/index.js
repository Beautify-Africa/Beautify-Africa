const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');


dotenv.config();


const app = express();


app.use(cors());           // Allows your React app to communicate with this API without security blocks
app.use(express.json());   // Parses incoming data so your server can understand JSON payloads
app.use(morgan('dev'));    // Logs every incoming request to your terminal (essential for debugging)


app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Beautify API is running successfully.' 
  });
});


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server is currently running on port ${PORT}`);
});