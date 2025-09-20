require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stt = require("./routes/sttRoutes.js");
const { connectDbMain } = require('./config/connectDb.js');
const { default: chatRouter } = require('./routes/chatRoutes.js');
const authRoutes = require('./routes/authRoutes.js')

const app = express();

// Middleware
app.use(express.json());
app.use(cors());            // enable CORS for all origins
app.use(express.json());
// Routes
app.get("/", (req, res) => {
    res.send("hello");
});
app.use('/', stt);
app.use('/', chatRouter);
app.use("/api/auth", authRoutes);

// Connect to MongoDB and start server
const connectDb = async () => {
    try {
        await connectDbMain();
        const port = process.env.PORT || 5000;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

// Only connect when this file is run directly
if (require.main === module) {
    connectDb();
}

module.exports = app;
