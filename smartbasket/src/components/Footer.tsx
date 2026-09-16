'use client'
import React from 'react'
import { motion } from "motion/react"
import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa6'

function Footer() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-linear-to-r from-green-600 to-green-700 text-white mt-20"
        >
            {/* Grid Container */}
            <div className='w-[90%] md:w-[80%] mx-auto py-10 grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-green-500/40'>
                
                {/* Column 1: Brand Info */}
                <div>
                    <h2 className='text-2xl font-bold mb-3'>Smartbasket</h2>
                    <p className='text-sm text-green-100 leading-relaxed'>
                        Your one-stop online grocery store delivering freshness to your doorstep.
                        Shop smart, eat fresh, and save more every day!
                    </p>
                </div>

                {/* Column 2: Quick Links */}
                <div>
                    <h2 className='text-xl font-semibold mb-3'>Quick Links</h2>
                    <ul className='space-y-2 text-green-100 text-sm'>
                        <li><Link href={"/"}>Home</Link></li>
                        <li><Link href={"/user/cart"}>Cart</Link></li>
                        <li><Link href={"/my-orders"}>My Orders</Link></li>
                    </ul>
                </div>

                {/* Column 3: Contact Us & Social */}
                <div>
                    <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
                    <ul className="space-y-2 text-green-100 text-sm">
                        <li className="flex items-center gap-2">
                            <MapPin size={16} /> Rawalpindi, Pakistan
                        </li>
                        <li className="flex items-center gap-2">
                            <Phone size={16} /> +92 0000000000
                        </li>
                        <li className="flex items-center gap-2">
                            <Mail size={16} /> support@smartbasket.in
                        </li>
                    </ul>

                    {/* Social Links */}
                    <div className="flex gap-4 mt-4">
                        <Link href="https://facebook.com" target="_blank">
                            <FaFacebook size={20} className="hover:text-white transition" />
                        </Link>
                        <Link href="https://instagram.com" target="_blank">
                            <FaInstagram size={20} className="hover:text-white transition" />
                        </Link>
                        <Link href="https://twitter.com" target="_blank">
                            <FaTwitter size={20} className="hover:text-white transition" />
                        </Link>
                    </div>
                </div>

            </div>

            {/* Copyright Section */}
            <div className="text-center py-4 text-sm text-green-100 bg-green-800/40">
                © {new Date().getFullYear()} <span className="font-semibold">Smartbasket</span>. All rights reserved.
            </div>
        </motion.div>
    )
}

export default Footer