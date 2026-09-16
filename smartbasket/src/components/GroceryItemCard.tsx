"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import AddToCartControl from "./AddToCartControl";
import RatingStars from "./RatingStars";


interface IGrocery {
    _id: string,
    name: string,
    category: string,
    price: string,
    unit: string,
    image: string,
    stock?: number,
    rating?: number,
    numReviews?: number,
    createdAt?: Date,
    updatedAt?: Date
}


function GroceryItemCard({ item, eager = false }: { item: IGrocery, eager?: boolean }) {
    const stock = item.stock ?? 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: false, amount: 0.3 }}
            className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col"
        >
            <Link href={`/product/${item._id}`} className="relative w-full aspect-4/3 bg-gray-50 overflow-hidden block">
                <Image
                    src={item.image}
                    fill
                    alt={item.name}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    loading={eager ? "eager" : "lazy"}
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                {stock > 0 && stock <= 5 && (
                    <span className="absolute top-2 left-2 bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-1 rounded-full">
                        Only {stock} left
                    </span>
                )}
            </Link>

            <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-gray-500 font-medium mb-1">{item.category}</p>
                <Link href={`/product/${item._id}`} className="hover:text-green-700 transition-colors">
                    <h3 className="font-semibold text-gray-800 line-clamp-2">{item.name}</h3>
                </Link>

                <RatingStars rating={item.rating ?? 0} numReviews={item.numReviews ?? 0} className="mt-1" />

                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{item.unit}</span>
                </div>
                <span className="text-green-700 font-bold text-lg">Rs.{item.price}</span>

                <div className="mt-auto">
                    <AddToCartControl item={item} />
                </div>
            </div>
        </motion.div>
    )
}
export default GroceryItemCard
