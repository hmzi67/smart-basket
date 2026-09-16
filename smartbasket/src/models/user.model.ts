import mongoose from "mongoose";


export interface IUser{
    _id:mongoose.Types.ObjectId
    name: string
    email: string
    password?:string
    mobile?: string
    role: "user" | "deliveryBoy" | "admin" | "shopkeeper"
    image: string;
    location?: {
        type: {
            type: StringConstructor;
            enum: string[];
            default: string;
        };
        coordinates: {
            type: NumberConstructor;
            default: number[];
        };
    };
socketId: string | null
isOnline: boolean
isActive: boolean
address?: string
/** sha256 of the emailed reset token — the raw token is never stored */
resetPasswordTokenHash?: string | null
resetPasswordExpiresAt?: Date | null
}

const userSchema = new mongoose.Schema<IUser>(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            unique: true,
            required: true
        },
        password: {
            type: String,
            required: false
        },
        mobile: {
            type: String,
            required: false
        },
        role: {
            type: String,
            enum: ["user", "deliveryBoy", "admin", "shopkeeper"],
            default: "user"
        },
        image: {
            type: String
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        socketId: {
                type: String,
                default:null
    },
    isOnline:{
        type:Boolean,
        default:false
    },
    // an admin can deactivate an account; deactivated users cannot sign in
    isActive:{
        type:Boolean,
        default:true
    },
    address:{
        type:String,
        default:""
    },
    resetPasswordTokenHash:{
        type:String,
        default:null,
        select:false
    },
    resetPasswordExpiresAt:{
        type:Date,
        default:null,
        select:false
    }
        }, { timestamps: true }
);
// required for $near queries (finding nearby delivery boys)
userSchema.index({ location: "2dsphere" })

const User=mongoose.models.User || mongoose.model("User",userSchema)
export default User;