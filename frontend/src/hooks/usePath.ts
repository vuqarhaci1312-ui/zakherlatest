import { useEffect, useState } from 'react'
import { currentPath, onNavigate } from '../lib/navigation'

export function usePath() {
  const [path, setPath] = useState(currentPath)
  useEffect(() => onNavigate(() => setPath(currentPath())), [])
  return path
}
