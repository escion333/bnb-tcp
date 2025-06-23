import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "./ui/button"

/**
 * DarkModeToggle switches the global `dark` class on the <html> element,
 * leveraging Tailwind's `darkMode: "class"` configuration.
 */
export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  // Initialise from localStorage or system preference
  useEffect(() => {
    const storedPreference = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null
    if (storedPreference) {
      setIsDark(storedPreference === "dark")
    } else {
      // Detect system preference if no stored value
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
      setIsDark(prefersDark)
    }
  }, [])

  // Sync class on the <html> element and persist preference
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark])

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={() => setIsDark((prev) => !prev)}
      className="h-9 w-9"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
} 