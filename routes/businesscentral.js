const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => {

    res.json({

        success: true,

        message: "Business Central API Connected"

    });

});

module.exports = router;