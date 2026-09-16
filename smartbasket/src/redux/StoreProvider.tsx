'use client'
import React from 'react'
import { Provider } from 'react-redux'
import { store } from './store' // Agar error aaye toh fikr mat karain, yeh store file friend bana rahi hogi.

function StoreProvider({children}:{children:React.ReactNode}) {
  return (
    <Provider store={store}>
        {children}
    </Provider>
  )
}

export default StoreProvider