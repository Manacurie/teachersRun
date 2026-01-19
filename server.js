// dependencies
// ------------------------------------------------------------

// Express import för server app
// ------------------------------------------------------------
import express from "express";

// miljövariabler
// ------------------------------------------------------------
const app = express();
app.use(express.static("public"));
const PORT = 3000;

// middleware
// ------------------------------------------------------------

// event handlers
// ------------------------------------------------------------

// server start
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
