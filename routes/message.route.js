const express=require('express');
const isAuthenticated = require('../middleware/isAuthenticated');
const { sendMessage, getMessage } = require('../controller/message.controller');
const router=express.Router();


router.route('/send/:id').post(isAuthenticated,sendMessage)
router.route('/all/:id').get(isAuthenticated,getMessage );



module.exports=router;