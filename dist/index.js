"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app = (0, express_1.default)();
app.get("/", (req, res) => {
    res.send("Hello from TypeScript + Docker 🚀");
});
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
