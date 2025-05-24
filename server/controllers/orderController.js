import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";
import User from '../models/User.js'


// Place Order COD :/api/order/cod
export const placeOrderCOD =async (req,res) =>{
    try {
        const {userId,items,address} =req.body;
        if(!address || items.length === 0) {
            return res.json({success:false,message:"Invalid data"})

        }
        // Calculate Amount Using Items
        let amount = await items.reduce(async (acc,item)=>{
            const product=await Product.findById(item.product);
            return (await acc) + (product.offerPrice * item.quantity);
        },0)
        

        // Add Tax Charge(2%)
        amount += Math.floor (amount * 0.02);

        await Order.create({
        userId,
        items,
        amount,
        address,
        paymentType:"COD",

        });
        return res.json({success:true, message:"Order Placed Successfully"})
    } catch (error) {
        return res.json({success: false, message: error.message })  
        
    }


}

// Place Order Stripe : /api/order/stripe
export const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address } = req.body;
        const { origin } = req.headers;

        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" });
        }

        let productData = [];

        // Calculate total amount and build productData array
        let amount = await items.reduce(async (accPromise, item) => {
            const acc = await accPromise;
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error("Product not found");
            }

            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            });

            return acc + product.offerPrice * item.quantity;
        }, Promise.resolve(0));

        // Add 2% tax
        amount += Math.floor(amount * 0.02);

        // Create Order in DB
        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "online",
        });

        // Initialize Stripe
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        // Create line items for Stripe
        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.floor((item.price + item.price * 0.02) * 100), // Stripe expects amount in cents
                },
                quantity: item.quantity,
            };
        });

        // Create Stripe session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId,
            },
        });

        return res.json({ success: true, url: session.url });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

//Stripe webhooks to verify payments action :/stripe
export const stripeWebhook = async (req, res) =>{
    // Stripe Gateway Initialize
            const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
            const sig =request.headers["stripe-signature"];
            let event;
            try {
                event = stripeInstance.webhooks.constructEvent(
                    req.body, 
                    sig, 
                    process.env.STRIPE_WEB)
                
            } catch (error) {
                response.status(400).send(`webhook Error:${error.message}`)
                
            }
            //Handle the event
            switch (event.type) {
                case "payment_intent.succeeded":{
                    const paymentIntent = event.data.object;
                    const paymentIntentId = paymentIntent.id;

                    //Getting session MetaData
                    const session = await stripeInstance.checkout.sessions.list({
                        payment_Intent:paymentIntentId,
                    });

                    const {orderId,userId} =session.data[0].metadata ; 
                //Mark Payment as paid


                await Order.findByIdAndUpdate(orderId,{isPaid:true})
                //clear user cart
                await User.findByIdAndUpdate(userId,{cartItems:{}})
                 break;
                }
                case "payment_intent.succeeded":{
                    const paymentIntent = event.data.object;
                    const paymentIntentId = paymentIntent.id;

                    //Getting session MetaData
                    const session = await stripeInstance.checkout.sessions.list({
                        payment_Intent:paymentIntentId,
                    });

                    const {orderId} =session.data[0].metadata ; 
                    await Order.findByIdAndUpdate(orderId)
                    break;

                }
                    
                   
            
                default:
                    console.error(`unhandled event type: ${event.type}`);
                    break;
            }
            response.json({received :true})

}

// Get Order By User Id :/api/order/user
export const getUserOrders = async (req,res) =>{
    try {
        const {userId}=req.query;
        

        const orders =await Order.find({
            userId,
            $or:[{ paymentType:"COD"},{isPaid:true}]
        }).populate("items.product address").sort({createdAt :-1})
        res.json({success:true,orders});
        
    } catch (error) {
        res.json({success:false,message:error.message});
    }
}

// Get All Orders (for seller /admin):/api/order/seller

export const getAllOrders = async (req,res) =>{
    try {
        
        const orders =await Order.find({
            $or:[{ paymentType:"COD"},{isPaid:true}]
        }).populate("items.product address").sort({createdAt :-1})
        res.json({success:true,orders});
        
    } catch (error) {
        res.json({success:false,message:error.message});
    }
}
