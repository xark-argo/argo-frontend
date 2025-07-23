import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect, useRef, useState} from 'react'

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
  const [currentIdleIndex, setCurrentIdleIndex] = useState(0)

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

  const findIdleVideo = useCallback(
    (index?: number) => {
      const idle = videoConfig.find((video) => video.actions.includes('idle'))
      if (idle && idle.url.length > 0) {
        const targetIndex = index !== undefined ? index : Math.floor(Math.random() * idle.url.length)
        return idle.url[targetIndex]
      }
      return ''
    },
    [videoConfig]
  )

  const playVideo = useCallback(
    (a: string) => {
      if (!videoRef.current || (a === action && a !== 'idle')) return
      const video = videoRef.current
      
      if (a === 'idle') {
        // idle状态使用随机轮播，不循环单个视频
        const idleUrl = findIdleVideo()
        video.src = idleUrl
        video.loop = false
        // 找到当前播放的idle视频索引
        const idle = videoConfig.find((video) => video.actions.includes('idle'))
        if (idle) {
          const index = idle.url.indexOf(idleUrl)
          setCurrentIdleIndex(index >= 0 ? index : 0)
        }
      } else {
        // 非idle状态保持原有逻辑
        video.src = findVideo(a)
        video.loop = true
      }
      
      video.play().catch(() => {})
    },
    [videoRef, findVideo, findIdleVideo, action, videoConfig]
  )

  useEffect(() => {
    // 检测 <display>{"action": "xxx"}</display>
    const match = streamContent.match(/<display>(.*?)<\/display>/)
    if (match?.[1] && match[1] !== action) {
      console.info('action match', match?.[1], action)
      setAction(match[1])
      playVideo(match[1])
    }
  }, [streamContent, playVideo, action, setAction])

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
    if (action === 'idle') {
      // idle状态播放结束后，随机选择下一个idle视频
      if (videoRef.current) {
        const idle = videoConfig.find((video) => video.actions.includes('idle'))
        if (idle && idle.url.length > 1) {
          // 确保不重复播放同一个视频
          let nextIndex
          do {
            nextIndex = Math.floor(Math.random() * idle.url.length)
          } while (nextIndex === currentIdleIndex && idle.url.length > 1)
          
          videoRef.current.src = idle.url[nextIndex]
          videoRef.current.loop = false
          setCurrentIdleIndex(nextIndex)
          videoRef.current.play().catch((err) => {
            console.error('Failed to play next idle video:', err)
          })
        } else if (idle && idle.url.length === 1) {
          // 如果只有一个idle视频，重新播放
          videoRef.current.src = idle.url[0]
          videoRef.current.loop = false
          videoRef.current.play().catch((err) => {
            console.error('Failed to replay idle video:', err)
          })
        }
      }
    } else {
      // 非idle状态的视频播放结束后，继续循环当前 action
      if (videoRef.current) {
        videoRef.current.src = findVideo(action)
        videoRef.current.loop = true
        videoRef.current.play().catch((err) => {
          console.error('Failed to play action video:', err)
        })
      }
    }
  }, [action, findVideo, videoRef, videoConfig, currentIdleIndex])

  return {handleEnded, videoRef}
}

export default useVideoConfig
