"use client"
import useGetMe from './hooks/useGetMe'
import useCartSync from './hooks/useCartSync'

// Mounted once in the root layout: loads the signed-in user into Redux and
// keeps the cart in step with the stored one.
function InitUser() {
  useGetMe()
  useCartSync()
  return null
}

export default InitUser
