'use client'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserData } from '@/redux/userSlice'
import { AppDispatch } from '@/redux/store'

function useGetMe() {
    const dispatch = useDispatch<AppDispatch>()
    useEffect(()=>{
        const getMe=async ()=>{
            try {
                const result=await axios.get("/api/me")
                dispatch(setUserData(result.data))
            } catch (error) {
                // not logged in (e.g. on /login) — leave userData empty
                dispatch(setUserData(undefined))
            }
        }
        getMe()
    },[dispatch])
}

export default useGetMe
