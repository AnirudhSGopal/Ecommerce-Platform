import jwt from 'jsonwebtoken'

const authSeller =async (req, res, next) =>{
    console.log("Incoming cookies:", req.cookies);
 
    const sellerToken =req.cookies.sellerToken;
    

    if(!sellerToken){
        return res.json({success:false,message:'Not Authorized'});
    }
     try {
        const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);
        console.log("Decoded token:", tokenDecode);

        if(tokenDecode.email === process.env.SELLER_EMAIL){
            
            next();
        }else{
            return res.json({success:false ,message:" not authenticated"});
        }
        
        
    } catch (error) {
        return res.json({success:false ,message: error.message});
    }


    };
export default authSeller