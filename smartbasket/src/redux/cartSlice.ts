import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { calcTotals } from "@/lib/cart";


interface IGrocery{
    _id:string,
        name: string,
         category: string,
        price: string,
        unit:string,
        quantity:number
        stock?:number
        mobile?: string
        image:string
         createdAt?: Date,
          updatedAt?: Date,
    }
 

interface ICartSlice {
  cartData: IGrocery[],
  subTotal: number,
  deliveryFee: number,
  finalTotal: number,
  /** true once the stored cart has been loaded, so the sync effect knows it may write back */
  hydrated: boolean,
}

const initialState:ICartSlice = {
  cartData: [],
   subTotal: 0,
    deliveryFee: 40,
    finalTotal: 40,
    hydrated: false
}

const cartSlice = createSlice({
  name: "cart",
  initialState ,
  reducers: {
    addToCart:(state, action:PayloadAction<IGrocery>)=>{
        const existing = state.cartData.find(i=>i._id===action.payload._id)
        if(existing){
          // adding an item already in the cart bumps its quantity instead of duplicating the row
          existing.quantity = existing.quantity + (action.payload.quantity || 1)
          if(existing.stock!=null && existing.quantity>existing.stock){
            existing.quantity = existing.stock
          }
        } else {
          state.cartData.push(action.payload)
        }
        cartSlice.caseReducers.calculateTotals(state)
    },

    increaseQuantity:(state,action:PayloadAction<string>)=>{
const item = state.cartData.find((i: any) => i._id === action.payload);
      if(item){
        // never let the counter run past what is in stock
        if(item.stock==null || item.quantity<item.stock){
          item.quantity=item.quantity+1
        }
      }
      cartSlice.caseReducers.calculateTotals(state)},

decreaseQuantity:(state:any,action:PayloadAction<string>)=>{
const item = state.cartData.find((i: any) => i._id === action.payload);
      if(item?.quantity && item.quantity>1){
        item.quantity=item.quantity-1
      }
      else{
         state.cartData= state.cartData.filter((i: any) => i._id !== action.payload);
      }
        cartSlice.caseReducers.calculateTotals(state)
    } ,
      removeFromCart:(state, action:PayloadAction<string>)=>{
        state.cartData= state.cartData.filter(i=>i._id!==action.payload)
        cartSlice.caseReducers.calculateTotals(state)
  },
  // replaces the whole cart with the server's copy (login / page load)
  setCartData:(state, action:PayloadAction<IGrocery[]>)=>{
    state.cartData=action.payload
    state.hydrated=true
    cartSlice.caseReducers.calculateTotals(state)
  },
  setCartHydrated:(state, action:PayloadAction<boolean>)=>{
    state.hydrated=action.payload
  },
  clearCart:(state)=>{
    state.cartData=[]
    cartSlice.caseReducers.calculateTotals(state)
  },
  calculateTotals:(state)=>{
    const { subTotal, deliveryFee, finalTotal } = calcTotals(state.cartData)
    state.subTotal=subTotal
    state.deliveryFee=deliveryFee
    state.finalTotal=finalTotal
  }
  
}})
export const { addToCart,increaseQuantity,decreaseQuantity,removeFromCart,setCartData,setCartHydrated,clearCart,calculateTotals} = cartSlice.actions; 
export default cartSlice.reducer;
