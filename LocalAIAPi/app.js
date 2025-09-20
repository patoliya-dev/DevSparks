require('dotenv').config();
const express = require('express');

const app = express();
app.get("/", (req, res) => {
    res.send("helo")
})
app.listen(process.env.PORT, () => {
    console.log(`port run in ${process.env.PORT} Port`);
});


module.exports = app;