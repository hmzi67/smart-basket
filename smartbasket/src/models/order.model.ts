import mongoose from "mongoose";

export interface IOrder {
    _id?: mongoose.Types.ObjectId
    user: mongoose.Types.ObjectId
    items: [
        {
            grocery: mongoose.Types.ObjectId,
            name: string,
            price: string,
            unit: string,
            image: string
            quantity: number
        }
    ]
    isPaid:boolean
    totalAmount: string,
    paymentMethod: "cod" | "online"
    /** Cloudinary URL of the customer's uploaded transaction screenshot, for online payments */
    paymentProof?: string

address: {
    fullName: string,
    mobile: string,
    city: string,
    state: string,
    pincode: string,
    fullAddress: string,
    latitude: number,
    longitude: number
}
assignment?:mongoose.Types.ObjectId
assignedDeliveryBoy?:mongoose.Types.ObjectId
status: "pending" | "out of delivery" | "delivered" | "cancelled",
cancelledAt?: Date
createdAt?: Date
updatedAt?: Date
deliveryOtp:string | null
deliveryOtpExpiresAt?:Date | null
deliveryOtpAttempts:number
deliveryOtpVerification:boolean
deliveredAt:Date
}
const orderSchema = new mongoose.Schema<IOrder>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // cod orders are settled on delivery and don't need this; online orders start
    // unpaid until an admin verifies the uploaded transaction screenshot.
    isPaid: {
        type: Boolean,
        default: false
    },
    items: [
        {
            grocery: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Grocery",
                required: true
            },
            name: String,
            price: String,
            unit: String,
            image: String,
            quantity: Number
        }
    ],
    totalAmount: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["cod", "online"],
       default: "cod"
  },
    paymentProof: {
        type: String,
        default: null
    },
    address: {
        fullName: { type: String, required: true },
        mobile: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        fullAddress: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
     assignment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "DeliveryAssignment",
                default:null
       },
       assignedDeliveryBoy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
       },
    status: {
        type: String,
        enum: ["pending", "out of delivery", "delivered", "cancelled"],
        default: "pending"
    },
    cancelledAt: {
        type: Date
    },

    deliveryOtp:{
    type:String,
    default:null
},
deliveryOtpExpiresAt:{
    type:Date,
    default:null
},
// wrong tries since the current OTP was issued; locks the code at the limit
deliveryOtpAttempts:{
    type:Number,
    default:0
},
deliveryOtpVerification:{
    type:Boolean,
    default:false
},
deliveredAt:{
    type:Date
}
}, {
    timestamps: true
})

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema)

export default Order