import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";


axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({children})=>{
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate =useNavigate();
    const [user, setUser] =useState(null);
    const [isSeller,setIsSeller ] =useState(false);
    const [showUserLogin,setShowUserLogin] =useState(false);
    const [products, setProducts] =useState([]);
    const [cartItems, setCartItems] =useState({});
    const [searchQuery, setSearchQuery] =useState({});



    // Fetch seller Status

    const fetchSeller = async()=>{
        try {
            const {data} =await axios.get('/api/seller/is-auth')
            if(data.success){
                setIsSeller(true)
            }
            else{
                setIsSeller(false)
            }
            
        } catch(error) {
            console.log(error)
            setIsSeller(false)
            
        }

    }

// Fetch User Auth Status, User Data and Cart Items

const fetchUser = async()=>{
    try {
        const {data} =await axios.get('/api/user/is-auth');
        if(data.success){
            setUser(data.user);
            setCartItems(data.user.cartItems);

        }
        
    } catch (error) {
        setUser(null)
        console.log(error)
        
    }

}







    // Fetch all products
    const fetchProducts = async ()=>{
        try {
            const {data} =await axios.get('/api/product/list')
            if(data.success){
                setProducts(data.products)
            }
            else{
                toast.error(data.message)
            }
            
        } catch (error) {
             toast.error(error.message)
        }
    };
    // Add Product to Cart

    const addToCart =(itemId)=>{
        let cartData = structuredClone(cartItems)
        if(cartData[itemId]){
            cartData[itemId]+= 1
        }else{
            cartData[itemId] = 1 
        }
      setCartItems(cartData)
      toast.success("Product added to cart")
    };

    //update cart item quantity
    const updateCartItem =(itemId,quantity)=>{
        let cartData = structuredClone(cartItems);
        cartData[itemId] = quantity;
        setCartItems(cartData);
        toast.success(" Cart updated")

    }
    //Remove product from cart 
    const removeFromCart =(itemId)=>{
        let cartData = structuredClone(cartItems);
        if(cartData[itemId]){
            cartData[itemId] -= 1;
            if(cartData[itemId] === 0){
                delete cartData[itemId];
                
            }
        }
        toast.success("removed from cart")
        setCartItems(cartData)
    }

    // get cart item count
const getCartCount =()=>{
    let totalcount =0;
    for(const item in cartItems ){
        totalcount += cartItems[item]

    }
    return totalcount;
};
// get cart item total
const getCartAmount =()=>{
    let totalAmount =0;
    for(const items in cartItems ){
        let itemInfo = products.find((product)=> product._id === items);
            if(cartItems[items] >0){
                totalAmount += itemInfo.offerPrice * cartItems[items];
            }
        }
        return Math.floor(totalAmount *100)/100
    };





    useEffect(()=>{
        fetchUser( )
        fetchSeller()
        fetchProducts()


    },[])

// update Database Cart Items
    useEffect(()=>{
        const updateCart =async ()=>{
            try {
                const {data} =await axios.post('/api/cart/update',{cartItems})
                if(!data.success){
                    toast.error(data.message)
                }

                
            } catch (error) {
                toast.error(error.message)
                
            }

        }
        if(user){
            updateCart()

        }


    },[cartItems,user])

    const value =  {navigate,user,setUser,isSeller,setIsSeller,showUserLogin,setShowUserLogin,
        products,currency,addToCart,updateCartItem,removeFromCart,cartItems,searchQuery,setSearchQuery,getCartAmount,getCartCount,axios,fetchProducts,
        setCartItems
    };
    

    return<AppContext.Provider value={value}>{children}</AppContext.Provider>

};
    
    
export const useAppContext = ()=>{
    return useContext(AppContext)
}
