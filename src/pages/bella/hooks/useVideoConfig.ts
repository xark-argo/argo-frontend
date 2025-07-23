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
  const [isHandlingEnded, setIsHandlingEnded] = useState(false)

  /**
   * 查找指定 action 对应的视频
   * 如果找不到对应 action，则回退到 idle 视频
   */
  const findVideo = useCallback(
    (actions: string) => {
      // 首先尝试查找指定 action 的视频
      const res = videoConfig.find((video) => video.actions.includes(actions))
      if (res && res.url.length > 0) {
        return res.url[Math.floor(Math.random() * res.url.length)]
      }
      
      // 如果找不到指定 action，回退到 idle 视频
      const idle = videoConfig.find((video) => video.actions.includes('idle'))
      if (idle && idle.url.length > 0) {
        return idle.url[Math.floor(Math.random() * idle.url.length)]
      }
      
      return ''
    },
    [videoConfig]
  )

  /**
   * 查找 idle 视频，支持指定索引或随机选择
   */
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

  /**
   * 播放视频的核心逻辑
   * 优先播放指定 action 的视频，如果找不到则回退到 idle 视频
   * 所有视频都不循环播放，播放结束后通过 handleEnded 处理
   */
  const playVideo = useCallback(
    (a: string) => {
      if (!videoRef.current || (a === action && a !== 'idle') || isHandlingEnded) return
      const video = videoRef.current
      
      // 尝试播放指定 action 的视频
      const actionUrl = findVideo(a)
      if (actionUrl) {
        video.src = actionUrl
        // 所有视频都不循环播放，通过 handleEnded 控制后续播放
        video.loop = false
        
        // 如果是 idle 状态，记录当前播放的 idle 视频索引
        if (a === 'idle') {
          const idle = videoConfig.find((video) => video.actions.includes('idle'))
          if (idle) {
            const index = idle.url.indexOf(actionUrl)
            setCurrentIdleIndex(index >= 0 ? index : 0)
          }
        }
      } else {
        // 如果找不到指定的 action 视频，回退到 idle 视频
        const idleUrl = findIdleVideo()
        if (idleUrl) {
          video.src = idleUrl
          video.loop = false
          console.info('Action video not found, falling back to idle video:', a)
          
          // 记录当前播放的 idle 视频索引
          const idle = videoConfig.find((video) => video.actions.includes('idle'))
          if (idle) {
            const index = idle.url.indexOf(idleUrl)
            setCurrentIdleIndex(index >= 0 ? index : 0)
          }
        }
      }
      
      // 使用 Promise 处理播放，避免 AbortError
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // 忽略 AbortError，这是正常的视频切换行为
          if (err.name !== 'AbortError') {
            console.error('Failed to play video:', err)
          }
        })
      }
    },
    [videoRef, findVideo, findIdleVideo, action, videoConfig]
  )

  // 监听流内容中的 action 指令
  useEffect(() => {
    // 检测 <display>{"action": "xxx"}</display> 格式的指令
    const match = streamContent.match(/<display>(.*?)<\/display>/)
    if (match?.[1] && match[1] !== action) {
      console.info('Action detected from stream:', match[1], 'Current action:', action)
      setAction(match[1])
      playVideo(match[1])
    }
  }, [streamContent, playVideo, action, setAction])

  // 当 action 变化时播放对应视频
  useEffect(() => {
    // 添加小延迟，确保状态更新完成
    const timer = setTimeout(() => {
      playVideo(action)
    }, 10)
    
    return () => clearTimeout(timer)
  }, [action, playVideo])

  // 初始化视频配置
  useEffect(() => {
    const links = []

    getBalleVideoConfig().then((res) => {
      const videos = []
      const baseUrl = `${window.location.origin}/api/files/resources/characters/ani/`
      const idleUrls = []
      
      // 配置 TTS 参数
      const ttsConfig = {
        tts_type: res?.[0]?.tts_type ?? 'edge_tts',
        tts_params: {
          voice: res?.[0]?.tts_params?.voice ?? 'zh-CN-XiaoyiNeural',
        },
      }

      setTtsConfig(ttsConfig)
      
      // 收集所有 idle 视频
      res
        .map((item) => item.emotion_idle)
        .filter(Boolean)
        .forEach((idles) => {
          idles.forEach((idle) => {
            idleUrls.push(`${baseUrl}${idle}`)
          })
        })
      
      // 添加 idle 视频配置
      videos.push({
        actions: 'idle',
        url: idleUrls,
      })

      // 添加其他情感视频配置
      res.forEach((item) => {
        Object.keys(item.emotionMap).forEach((emotion) => {
          videos.push({
            actions: item.emotionMap[emotion].join(','),
            url: [`${baseUrl}${emotion}`],
          })
        })
      })
      
      // 预加载所有视频
      videos.forEach((video) => {
        video.url.forEach((url) => {
          const videoEl = document.createElement('video')
          videoEl.preload = 'auto'
          videoEl.src = url
          videoEl.style.display = 'none' // 隐藏预加载的视频元素
          document.body.appendChild(videoEl)
          links.push(videoEl)
        })
      })
      
      setVideoConfig(videos)
      setAction('idle') // 初始化时设置为 idle 状态
    }).catch((err) => {
      console.error('Failed to load video config:', err)
    })
    
    return () => {
      // 清理预加载的视频元素
      links.forEach((link) => {
        link.remove()
      })
    }
  }, [setVideoConfig, setAction, setTtsConfig])

  /**
   * 视频播放结束时的处理逻辑
   * idle 状态：随机选择下一个 idle 视频，避免重复
   * 其他状态：播放结束后自动回到 idle 状态
   */
  const handleEnded = useCallback(() => {
    // 防止重复处理
    if (isHandlingEnded) return
    setIsHandlingEnded(true)
    
    if (action === 'idle') {
      // idle 状态播放结束后，随机选择下一个 idle 视频
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
          
          // 使用 Promise 处理播放，避免 AbortError
          const playPromise = videoRef.current.play()
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              if (err.name !== 'AbortError') {
                console.error('Failed to play next idle video:', err)
              }
            }).finally(() => {
              setIsHandlingEnded(false)
            })
          } else {
            setIsHandlingEnded(false)
          }
        } else if (idle && idle.url.length === 1) {
          // 如果只有一个 idle 视频，重新播放
          videoRef.current.src = idle.url[0]
          videoRef.current.loop = false
          
          // 使用 Promise 处理播放，避免 AbortError
          const playPromise = videoRef.current.play()
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              if (err.name !== 'AbortError') {
                console.error('Failed to replay idle video:', err)
              }
            }).finally(() => {
              setIsHandlingEnded(false)
            })
          } else {
            setIsHandlingEnded(false)
          }
        } else {
          setIsHandlingEnded(false)
        }
      } else {
        setIsHandlingEnded(false)
      }
    } else {
      // 非 idle 状态的视频播放结束后，自动回到 idle 状态
      console.info('Action video ended, returning to idle state:', action)
      setAction('idle')
      // 不在这里直接播放视频，让 useEffect 来处理
      setIsHandlingEnded(false)
    }
  }, [action, videoRef, videoConfig, currentIdleIndex, setAction, isHandlingEnded])

  return {handleEnded, videoRef}
}

export default useVideoConfig
