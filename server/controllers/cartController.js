import User from "../models/User.js"

// Update User CartData :/api/cart/Update



export const UpdateCart =async (req,res)=>{
    try {
         const userId = req.user.id;
        const {cartItems}=req.body
        await User.findByIdAndUpdate(userId,{cartItems})
        res.json({success:true,message:"cart Updated"})
        
    } catch (error) {
        console.log(error.message)
    res.json({success:false, message: error.message})
        
    }
}