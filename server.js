const express = require("express");
const cors = require("cors");
const { isSpamPR } = require("./spamDetector");

const app = express();


app.use(cors());
app.use(express.json());

//API route 
app.post("/check-spam", (req, res) =>{
    try {
        const {pr, userPrs} = req.body;

        const result = isSpamPR(pr, userPrs || []);

        res.json({
            success: true,
            isSpam: result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
        
    }
});

const PORT = 5000;
app.listen(PORT , () => {
    console.log(`Server running on https://localhost:${PORT}`);
    
});