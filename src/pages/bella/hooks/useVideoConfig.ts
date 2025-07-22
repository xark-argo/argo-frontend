import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect, useRef} from 'react'

import {getBalleVideoConfig} from '~/lib/apis/bots'

import {
  bellaAction,
  bellaTtsConfig,
  bellaVideoConfig,
  currentBellaMessage,
} from '../atoms'

function useVideoConfig() {
  const [action, setAction] = useAtom(bellaAction)
  const videoRef = useRef<HTMLVideoElement>(null)
  const {content: streamContent} = useAtomValue(currentBellaMessage)
  const [videoConfig, setVideoConfig] = useAtom(bellaVideoConfig)
  const setTtsConfig = useSetAtom(bellaTtsConfig)

  const findVideo = useCallback(
    (actions: string) => {
      const res = videoConfig.find((video) => video.actions.includes(actions))
      if (res) {
        return res.url[Math.floor(Math.random() * res.url.length)]
      }
      const idle = videoConfig.find((video) => video.actions.includes('idle'))
      if (idle) {
        return idle.url[Math.floor(Math.random() * idle.url.length)]
      }
      return ''
    },
    [videoConfig]
  )

  const playVideo = useCallback(
    (a: string) => {
      if (!videoRef.current) return
      const video = videoRef.current
      video.src = findVideo(a)
      video.loop = a === 'idle'
      video.play().catch((err) => {
        console.error('Failed to play video:', err)
      })
    },
    [videoRef, findVideo]
  )

  useEffect(() => {
    // 检测 <display>{"action": "xxx"}</display>
    const match = streamContent.match(/<display>(.*?)<\/display>/)
    if (match?.[1]) {
      console.info('action match', match[1])
      playVideo(match[1])
    }
  }, [streamContent, playVideo])

  useEffect(() => {
    playVideo(action)
  }, [action, playVideo])

  useEffect(() => {
    const links = []

    getBalleVideoConfig().then((res) => {
      const videos = []
      const baseUrl = `${window.location.origin}/api/files/resources/characters/ani/`
      const idleUrls = []
      const ttsConfig = {
        tts_type: res?.[0]?.tts_type ?? 'edge_tts',
        tts_params: {
          voice: res?.[0]?.tts_params?.voice ?? 'zh-CN-XiaoyiNeural',
        },
      }

      setTtsConfig(ttsConfig)
      res
        .map((item) => item.emotion_idle)
        .filter(Boolean)
        .forEach((idles) => {
          idles.forEach((idle) => {
            idleUrls.push(`${baseUrl}${idle}`)
          })
        })
      videos.push({
        actions: 'idle',
        url: idleUrls,
      })

      res.forEach((item) => {
        Object.keys(item.emotionMap).forEach((emotion) => {
          videos.push({
            actions: item.emotionMap[emotion].join(','),
            url: [`${baseUrl}${emotion}`],
          })
        })
      })
      videos.forEach((video) => {
        video.url.forEach((url) => {
          const videoEl = document.createElement('video')
          videoEl.preload = 'auto'
          videoEl.src = url
          videoEl.style.display = 'none' // 隐藏视频元素
          document.body.appendChild(videoEl)
          links.push(videoEl)
        })
      })
      setVideoConfig(videos)
      setAction('idle')
    })
    return () => {
      links.forEach((link) => {
        link.remove()
      })
    }
  }, [setVideoConfig, setAction, setTtsConfig])

  const handleEnded = useCallback(() => {
    if (action !== 'idle') {
      // 非idle状态的视频播放结束后，继续循环当前 action
      if (videoRef.current) {
        videoRef.current.src = findVideo(action)
        videoRef.current.loop = true
        videoRef.current.play().catch((err) => {
          console.error('Failed to play action video:', err)
        })
      }
    }
  }, [action, findVideo, videoRef])

  return {handleEnded, videoRef}
}

export default useVideoConfig
