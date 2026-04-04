'use client'

import { useEffect } from 'react'

export function UserAuthHandler({ userEmail }: { userEmail: string }) {
  useEffect(() => {
    // Set user flag in localStorage for header to detect
    localStorage.setItem('onlyBangersUser', JSON.stringify({ 
      email: userEmail,
      loginTime: new Date().toISOString()
    }))
    
    // Dispatch event for header to update
    window.dispatchEvent(new Event('userLoggedIn'))
  }, [userEmail])

  return null
}
