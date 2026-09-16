import express from "express"
import http from "http"
import dotenv from "dotenv"
import { Server } from "socket.io"
dotenv.config()
const app=express()
app.use(express.json())
import axios from "axios"

const server=http.createServer(app)
const port=process.env.PORT || 5000

const io=new Server(server,{
    cors:{
    origin:process.env.NEXT_BASE_URL
    }
})

io.on("connection",(socket)=>{

    console.log("user connected",socket.id)
    // identity: register socketId for a user
    socket.on("identity", async (userId) => {
        try {
            await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/connect`, { userId, socketId: socket.id })
        } catch (err) {
            console.error("identity handler error", err.message)
        }
    })

    // update-location: send location to backend
    socket.on("update-location", async ({ userId, latitude, longitude }) => {
        const location = {
            type: "Point",
            coordinates: [longitude, latitude]
        }

        // Broadcast immediately so trackers stay live even if persistence lags.
        io.emit("update-deliveryboy-location", { userId, location })

        try {
            await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/update-location`, { userId, location })
        } catch (err) {
            console.error("update-location handler error", err.message)
        }
    })

socket.on("join-room", (roomId)=>{
    console.log("join room with", roomId)
    socket.join(roomId)
})


socket.on("send-message", async (message) => {
    console.log(message)
    try {
        await axios.post(`${process.env.NEXT_BASE_URL}/api/chat/save`, message)
    } catch (err) {
        console.error("chat save failed", err.message)
    }
    io.to(message.roomId).emit("send-message", message)
})

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id)
    })
})

// HTTP endpoint to notify sockets
app.post("/notify", (req, res) => {
    const { event, data, socketId} = req.body
    if (socketId) {
        io.to(socketId).emit(event, data)
    } else {
        io.emit(event, data)
    }

    return res.status(200).json({ success: true })
})


server.listen(port,()=>{
    console.log("server started at",port)
})
