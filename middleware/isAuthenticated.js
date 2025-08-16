const jwt=require('jsonwebtoken')
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({
        message: 'User not authenticated',
        success: false,
      });
    }

    const decode = await jwt.verify(token, process.env.SECRET);
    console.log("Decoded token:", decode);
    console.log("Token received:", req.cookies.token);
console.log("JWT_SECRET used to verify  decoded token :", process.env.SECRET);

    if (!decode) {
      return res.status(401).json({
        message: 'Invalid',
        success: false,
      });
    }

    req.id = decode.userId;
    next();
  } catch (error) {
    console.log(error);
  }
};
 
module.exports=isAuthenticated;