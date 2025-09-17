"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface NavigationContextType {
  activePage: string
  setActivePage: (page: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [activePage, setActivePage] = useState<string>('dashboard')

  return (
    <NavigationContext.Provider value={{ activePage, setActivePage }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}