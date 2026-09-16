'use client'
import axios from 'axios'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useDispatch } from 'react-redux'
import { setUserData } from '@/redux/userSlice'
import { AppDispatch } from '@/redux/store'

function useGetMe() {
    const dispatch = useDispatch<AppDispatch>()
    const { data: session, status } = useSession()
    const userId = session?.user?.id
    useEffect(()=>{
        if (status === 'loading') return
        if (status !== 'authenticated' || !userId) {
            dispatch(setUserData(undefined))
            return
        }
        const controller = new AbortController()
        const getMe=async ()=>{
            try {
                const result=await axios.get("/api/me", { signal: controller.signal })
                if (!controller.signal.aborted) dispatch(setUserData(result.data))
            } catch (error) {
                if (!controller.signal.aborted && axios.isAxiosError(error) && error.response?.status === 401) {
                    dispatch(setUserData(undefined))
                }
            }
        }
        getMe()
        return () => controller.abort()
    },[dispatch, status, userId])
}

export default useGetMe
