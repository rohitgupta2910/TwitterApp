const jwt = require('jsonwebtoken')
const userModel = require('../model/user.model')

module.exports.authUser = async (req,res,next)=>{
    try{
        const token = req.cookies.token//req.cookies.token hee hota hai hmeshaa
        //if token is not present mtlb ki login nahi hai aapn toh we have to redirect to login
        if(!token){
            return res.redirect('/login')
        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        if (!decoded) {
            return res.redirect('/login'); // Redirect if token verification fails
        }

        const user = await userModel.findById(decoded.id)//mistake zone hai findById kro
        req.user = user;
        //or write
        // req.user = await userModel.findById(decoded.id);
        return next()

    }catch(err){
        console.log(err);
        res.redirect('/login')
    }
}