'use client'
import React, {  useState } from 'react'
import { motion } from "motion/react"
import { Bike, User, ArrowRight, Loader2, Store, ShieldCheck } from 'lucide-react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

function EditRoleMobile({ assignedRole = "user" }: { assignedRole?: string }) {
  const router = useRouter()
  const { update } = useSession()

  const roles = [
    { id: "user", label: "User", icon: User },
    { id: "deliveryBoy", label: "Delivery Boy", icon: Bike },
    { id: "shopkeeper", label: "Shopkeeper", icon: Store },
    { id: "admin", label: "Admin", icon: ShieldCheck },
  ]

  const [selectedRole, setSelectedRole] = useState(assignedRole === "user" ? "" : assignedRole)
  const [mobile, setMobile] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEdit = async () => {
    setLoading(true)
    setError("")
    try {
      await axios.post("/api/user/edit-role-mobile", {
        role: selectedRole,
        mobile
      })
      // the jwt callback re-reads the role from the database; the payload is
      // only a trigger
      await update({ role: selectedRole })
      router.push("/")
      router.refresh()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not save your details. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className='flex flex-col items-center min-h-screen p-6 w-full justify-center bg-gray-50'>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='text-3xl md:text-4xl font-extrabold text-green-700 text-center mt-8'
      >
        {assignedRole === "user" ? "Select Your Role" : "Complete Your Profile"}
      </motion.h1>

      {assignedRole === "user" && <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-items-center gap-6 mt-8'>
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.id

          return (
            <motion.button
              type="button"
              aria-pressed={isSelected}
              key={role.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => setSelectedRole(role.id)}
              className={`flex flex-col items-center justify-center w-48 h-44 rounded-2xl border-2 cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700 ${
                isSelected
                  ? "border-green-600 bg-green-100 shadow-lg"
                  : "border-gray-300 bg-white hover:border-green-400"
              }`}
            >
              <Icon size={40} className={isSelected ? "text-green-700" : "text-gray-600"} />
              <span className='mt-3 font-semibold text-lg text-gray-800'>{role.label}</span>
            </motion.button>
          )
        })}
      </div>}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className='flex flex-col items-center mt-10'
      >
        <label htmlFor="mobile" className='text-gray-700 font-medium mb-2'>
          Enter Your Mobile Number
        </label>
        <input
          type="tel"
          id="mobile"
          value={mobile}
          className='w-64 md:w-80 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800'
          placeholder='eg. 00000000000'
          onChange={(e) => setMobile(e.target.value)}
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        disabled={!(selectedRole && /^\d{10,15}$/.test(mobile)) || loading}
        className={`inline-flex items-center justify-center gap-2 font-semibold py-3 px-8 rounded-2xl shadow-md transition-all duration-200 w-[200px] mt-20 ${
          selectedRole && /^\d{10,15}$/.test(mobile) && !loading
            ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        onClick={handleEdit}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <>Go to Home <ArrowRight size={20} /></>}
      </motion.button>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
    </div>
  )
}

export default EditRoleMobile
