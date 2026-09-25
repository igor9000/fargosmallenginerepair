const express = require("express");
const path = require("path");

const app = express();

const port = process.env.PORT || 3000;
const dist = path.join(__dirname, "dist");

app.use(express.static(dist));

app.use((req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on ${port}`);
});