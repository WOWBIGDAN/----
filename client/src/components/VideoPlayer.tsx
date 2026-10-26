import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export function VideoPlayer({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const isHls = url.includes('.m3u8')
    if (isHls && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(url)
      hls.attachMedia(video)
      return () => hls.destroy()
    }
    video.src = url
    return () => {
      video.removeAttribute('src')
      video.load()
    }
  }, [url])

  return <video ref={ref} className="video-player" controls playsInline />
}
