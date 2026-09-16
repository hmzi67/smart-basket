import { createSlice } from "@reduxjs/toolkit";



interface IUser {
  _id?: string,
  name: string;
  email: string;
  password?: string;
  mobile?: string;
  role: "user" | "deliveryBoy" | "admin" | "shopkeeper";
  image?: string;
}

interface IUserSlice {
  userData?: IUser;
}

const initialState: IUserSlice = {
  userData: undefined,
}

const userSlice = createSlice({
  name: "user",
  initialState ,
  reducers: {
    setUserData:(state, action)=>{
        state.userData=action.payload
    }
      
  },
})
export const { setUserData }=userSlice.actions
export default userSlice.reducer