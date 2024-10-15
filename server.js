const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
const { checkForAuthentication } = require("./checkAuth.js");
const userRoute = require("./routes/user.js");
const adminRoute = require("./routes/admin.js");
const { restrictTo } = require("./restrictTo.js");
const user = require("./models/user.js");
const { collectorModel } = require("./models/collector.js");
const collectorRoute = require("./routes/collectorRoute.js");
const path = require("path");


mongoose
    .connect("mongodb+srv://pawangupta5692:ENByKYZTeDVSGg9z@cluster0.zbfjc.mongodb.net/cleancity")
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(checkForAuthentication("token"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));


app.use("/", userRoute);
app.use("/admin", restrictTo(["admin"]), adminRoute);
app.use("/collector", restrictTo(["collector", "admin"]), collectorRoute);

app.get("/signin", (req, res) => {
    return res.render("users/signin");
});

app.post("/signin", async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (role === "user" || role === 'admin') {
            const token = await user.matchPassword(email, password);
            if (token) {
                res.cookie("token", token);

                if (role === "user") {
                    return res.redirect("/home");
                } else if (role === "admin") {
                    return res.redirect("/admin");
                }
            }
        } else if (role === "collector") {
            const token = await collectorModel.matchPassword(email, password);
            if (token) {
                res.cookie("token", token);
                return res.redirect("/collector");
            }
        }
        return res.render("users/signin", { error: "Invalid email or password" });
    } catch (error) {
        console.error("Signin error:", error);
        return res
            .status(500)
            .render("users/signin", { error: "Invalid email or password" });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});