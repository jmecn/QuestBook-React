import { useEffect, useState } from 'react'
import { loadBuildInfo, type BuildInfo } from '@/shared/lib/build-info'

export function useBuildInfo() {
  const [data, setData] = useState<BuildInfo | null | undefined>(undefined)

  useEffect(() => {
    void loadBuildInfo().then(setData)
  }, [])

  return { data: data ?? null, isLoading: data === undefined }
}
