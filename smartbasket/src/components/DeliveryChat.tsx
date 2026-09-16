'use client'
import { getSocket } from "@/lib/socket"
import { IMessages } from "@/models/message.model"
import OrderChatPanel from "./OrderChatPanel"
import { useState,useEffect,useRef} from "react"
import axios from "axios"


type props={
  orderId:string,
  deliveryBoyId:string
}

function DeliveryChat({orderId,deliveryBoyId}:props) {
  const [newMessage,setNewMessage]=useState("")
  const [messages,setMessages]=useState<IMessages[]>([])
  const chatBoxRef=useRef<HTMLDivElement>(null)
  const [loading,setLoading]=useState(false)
const [suggestions, setSuggestions] = useState([
    
])


useEffect(()=>{
  const socket=getSocket()
  socket.emit("join-room",orderId)
   socket.on("send-message",(message)=>{
if(message.roomId==orderId){

    setMessages((prev)=>[...prev!,message])
}
  })
  return()=>{socket.off("send-message")}
},[orderId])

const sendMsg=()=>{
  if (!newMessage.trim() || !deliveryBoyId) return
  const socket=getSocket()
  const message={
    roomId:orderId,
    text:newMessage,
    senderId:deliveryBoyId,
    time:new Date().toLocaleTimeString([],{
    hour:"2-digit",
    minute:"2-digit"
    })
}
  socket.emit("send-message",message)

  setNewMessage("")
}
useEffect(()=>{
    chatBoxRef.current?.scrollTo({
    top:chatBoxRef.current.scrollHeight,
    behavior:"smooth"
    })
},[messages])



useEffect(()=>{
  const getAllMessages=async ()=>{
    try {
    const result=await axios.post("/api/chat/messages",{roomId:orderId})
    setMessages(result.data)
    } catch (error) {
    console.log(error);
    }
  }

  getAllMessages()
},[orderId]);


const getSuggestion=async ()=>{
setLoading(true)
    try {
    const lastMessage=messages?.filter(m=>m.senderId?.toString()!==deliveryBoyId)?.at(-1)
    const result=await axios.post("/api/chat/ai-suggestions", {message:lastMessage?.text,role:"delivery_boy"})
   setSuggestions(Array.isArray(result.data.suggestions) ? result.data.suggestions : [])
   setLoading(false)
    } catch (error) {
    console.log(error)
    setLoading(false)
    }
}




  return (
    <OrderChatPanel title="Chat with customer" messages={messages} currentUserId={deliveryBoyId}
      message={newMessage} onMessageChange={setNewMessage} onSend={sendMsg}
      suggestions={suggestions} onSuggest={getSuggestion} suggesting={loading} chatRef={chatBoxRef} />
  )
}

export default DeliveryChat
