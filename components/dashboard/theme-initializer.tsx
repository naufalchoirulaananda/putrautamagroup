"use client"

import { useEffect } from "react"

export default function ThemeInitializer() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (storedTheme === "light") {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  return null
}