import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect, useRef, useState} from 'react'

import {getBalleVideoConfig} from '~/lib/apis/bots'

import {
  bellaAction,
  bellaTtsConfig,
  bellaVideoConfig,
  currentBellaMessage,
} from '../atoms'

// 播放队列项接口
interface PlayQueueItem {
  action: string
  url: string
}

function useVideoConfig() {
  const [action, setAction] = useAtom(bellaAction)
  const videoRef = useRef<HTMLVideoElement>(null)
  const {content: streamContent, role: messageRole} = useAtomValue(currentBellaMessage)
  const [videoConfig, setVideoConfig] = useAtom(bellaVideoConfig)
  const setTtsConfig = useSetAtom(bellaTtsConfig)
  const [currentIdleIndex, setCurrentIdleIndex] = useState(0)
  const [isHandlingEnded, setIsHandlingEnded] = useState(false)
  
  // 播放队列相关状态
  const [playQueue, setPlayQueue] = useState<PlayQueueItem[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isQueueProcessing, setIsQueueProcessing] = useState(false)
  
  // 用于跟踪已处理的触发词，避免重复处理
  const processedActionsRef = useRef<Set<string>>(new Set())
  const lastStreamContentRef = useRef<string>('')

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
   * 添加视频到播放队列
   */
  const addToPlayQueue = useCallback(
    (action: string) => {
      // 直接在这里查找视频，避免依赖 findVideo 函数
      let videoUrl = ''
      
      // 首先尝试查找指定 action 的视频
      const res = videoConfig.find((video) => video.actions.includes(action))
      if (res && res.url.length > 0) {
        videoUrl = res.url[Math.floor(Math.random() * res.url.length)]
      } else {
        // 如果找不到指定 action，回退到 idle 视频
        const idle = videoConfig.find((video) => video.actions.includes('idle'))
        if (idle && idle.url.length > 0) {
          videoUrl = idle.url[Math.floor(Math.random() * idle.url.length)]
        }
      }
      
      if (videoUrl) {
        setPlayQueue(prev => {
          const newQueue = [...prev, { action, url: videoUrl }]
          console.info('Added to play queue:', action, videoUrl, 'Queue length:', newQueue.length)
          return newQueue
        })
      } else {
        console.warn('Video not found for action:', action)
      }
    },
    [videoConfig]
  )

  /**
   * 添加 idle 视频到播放队列
   */
  const addIdleToQueue = useCallback(
    (index?: number) => {
      const idleUrl = findIdleVideo(index)
      if (idleUrl) {
        setPlayQueue(prev => [...prev, { action: 'idle', url: idleUrl }])
        console.info('Added idle video to queue:', idleUrl)
      }
    },
    [findIdleVideo]
  )

  /**
   * 添加下一个 idle 视频到播放队列（避免重复）
   */
  const addNextIdleToQueue = useCallback(() => {
    const idle = videoConfig.find((video) => video.actions.includes('idle'))
    if (idle && idle.url.length > 0) {
      let nextIndex
      if (idle.url.length === 1) {
        nextIndex = 0
      } else {
        // 确保不重复播放同一个视频
        do {
          nextIndex = Math.floor(Math.random() * idle.url.length)
        } while (nextIndex === currentIdleIndex && idle.url.length > 1)
      }
      
      setPlayQueue(prev => [...prev, { action: 'idle', url: idle.url[nextIndex] }])
      setCurrentIdleIndex(nextIndex)
      console.info('Added next idle video to queue:', idle.url[nextIndex])
    }
  }, [videoConfig, currentIdleIndex])

  /**
   * 播放单个视频
   */
  const playSingleVideo = useCallback(
    (videoItem: PlayQueueItem) => {
      if (!videoRef.current) return Promise.reject(new Error('Video ref not available'))
      
      const video = videoRef.current
      video.src = videoItem.url
      video.loop = false
      
      // 更新当前 action 状态
      setAction(videoItem.action)
      
      // 如果是 idle 状态，记录当前播放的 idle 视频索引
      if (videoItem.action === 'idle') {
        const idle = videoConfig.find((video) => video.actions.includes('idle'))
        if (idle) {
          const index = idle.url.indexOf(videoItem.url)
          setCurrentIdleIndex(index >= 0 ? index : 0)
        }
      }
      
      // 使用 Promise 处理播放
      const playPromise = video.play()
      if (playPromise !== undefined) {
        return playPromise.catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Failed to play video:', err)
          }
          throw err
        })
      }
      return Promise.resolve()
    },
    [videoRef, setAction, videoConfig]
  )

  /**
   * 处理播放队列的异步消费者
   */
  const processPlayQueue = useCallback(async () => {
    if (isQueueProcessing || isPlaying) {
      console.log('Queue processing blocked:', { isQueueProcessing, isPlaying })
      return
    }
    
    console.log('Starting queue processing, queue length:', playQueue.length)
    setIsQueueProcessing(true)
    
    try {
      // 使用函数式更新来确保状态同步
      setPlayQueue(currentQueue => {
        if (currentQueue.length === 0) {
          console.log('Queue is empty, adding idle video')
          // 队列为空时，添加下一个 idle 视频，但避免重复添加
          const shouldAddIdle = !isPlaying && !isQueueProcessing
          if (shouldAddIdle) {
            setTimeout(() => {
              addNextIdleToQueue()
            }, 0)
          }
          setIsQueueProcessing(false)
          return currentQueue
        }
        
        // 取出第一个视频进行处理
        const videoItem = currentQueue[0]
        const remainingQueue = currentQueue.slice(1)
        
        // 异步处理当前视频
        const processCurrentVideo = async () => {
          try {
            setIsPlaying(true)
            console.log('Playing video:', videoItem.action, videoItem.url)
            await playSingleVideo(videoItem)
            
            // 等待视频播放完成
            await new Promise<void>((resolve, reject) => {
              if (!videoRef.current) {
                reject(new Error('Video ref not available'))
                return
              }
              
              const handleEnded = () => {
                videoRef.current?.removeEventListener('ended', handleEnded)
                videoRef.current?.removeEventListener('error', handleError)
                resolve()
              }
              
              const handleError = (e: Event) => {
                videoRef.current?.removeEventListener('ended', handleEnded)
                videoRef.current?.removeEventListener('error', handleError)
                reject(new Error('Video playback error'))
              }
              
              videoRef.current.addEventListener('ended', handleEnded)
              videoRef.current.addEventListener('error', handleError)
            })
            
            console.info('Video playback completed:', videoItem.action)
          } catch (error) {
            console.error('Error playing video:', error)
          } finally {
            setIsPlaying(false)
            // 处理完当前视频后，继续处理剩余队列
            setTimeout(() => {
              processPlayQueue()
            }, 0)
          }
        }
        
        // 立即开始处理当前视频
        processCurrentVideo()
        
        return remainingQueue
      })
    } catch (error) {
      console.error('Error in queue processing:', error)
      setIsQueueProcessing(false)
    }
  }, [isQueueProcessing, isPlaying, playSingleVideo, addNextIdleToQueue])

  // 监听播放队列变化，自动处理队列
  useEffect(() => {
    console.log('Queue effect triggered:', { 
      queueLength: playQueue.length, 
      isQueueProcessing, 
      isPlaying 
    })
    
    if (playQueue.length > 0 && !isQueueProcessing && !isPlaying) {
      console.log('Starting queue processing from effect')
      processPlayQueue()
    }
  }, [playQueue.length, isQueueProcessing, isPlaying, processPlayQueue])

  // 监听流内容中的 action 指令
  useEffect(() => {
    // 如果流内容没有变化，不处理
    if (streamContent === lastStreamContentRef.current) {
      return
    }
    
    console.log('Stream content updated, length:', streamContent.length)
    console.log('Previous content length:', lastStreamContentRef.current.length)
    
    // 检测 <display>action</display> 格式的指令
    const matches = streamContent.match(/<display>(.*?)<\/display>/g)
    if (matches) {
      console.log('Found display matches:', matches)
      matches.forEach(match => {
        const actionMatch = match.match(/<display>(.*?)<\/display>/)
        if (actionMatch?.[1]) {
          const action = actionMatch[1]
          // 使用更精确的重复检测：action + 完整匹配内容
          const actionKey = `${action}-${match}`
          if (!processedActionsRef.current.has(actionKey)) {
            processedActionsRef.current.add(actionKey)
            console.log('Processing new action:', action, 'from stream content length:', streamContent.length)
            addToPlayQueue(action)
          } else {
            console.log('Skipping already processed action:', action)
          }
        }
      })
    } else {
      console.log('No display matches found in current content')
    }
    
    // 更新最后处理的流内容
    lastStreamContentRef.current = streamContent
  }, [streamContent, addToPlayQueue])

  // 监听消息角色变化，在用户发送新消息时重置已处理的action记录
  useEffect(() => {
    // 当角色变为 'user' 时，说明用户发送了新消息，需要重置已处理的action记录
    if (messageRole === 'user') {
      console.log('User sent new message, resetting processed actions')
      processedActionsRef.current.clear()
      lastStreamContentRef.current = ''
    }
  }, [messageRole])

  // 初始化视频配置
  useEffect(() => {
    const links = []

    getBalleVideoConfig().then((res) => {
      const videos = []
      // 选择角色（目前选择第0个，后续可扩展选择逻辑）
      const selectedRole = res?.[0]
      if (!selectedRole) {
        console.warn('No role data found')
        return
      }
      
      const role = selectedRole.name ?? 'ani'
      const baseUrl = `${window.location.origin}/api/files/resources/characters/${role}/`
      const idleUrls = []
      
      // 配置 TTS 参数
      const ttsConfig = {
        tts_type: selectedRole.tts_type ?? 'edge_tts',
        tts_params: {
          voice: selectedRole.tts_params?.voice ?? 'zh-CN-XiaoyiNeural',
        },
      }

      setTtsConfig(ttsConfig)
      
      // 只收集选中角色的 idle 视频
      if (selectedRole.emotion_idle) {
        selectedRole.emotion_idle.forEach((idle) => {
          idleUrls.push(`${baseUrl}${idle}`)
        })
      }
      
      // 添加 idle 视频配置
      videos.push({
        actions: 'idle',
        url: idleUrls,
      })

      // 只添加选中角色的其他情感视频配置
      if (selectedRole.emotionMap) {
        Object.keys(selectedRole.emotionMap).forEach((emotion) => {
          videos.push({
            actions: selectedRole.emotionMap[emotion].join(','),
            url: [`${baseUrl}${emotion}`],
          })
        })
      }
      
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
      
      // 初始化时添加一个 idle 视频到队列
      if (idleUrls.length > 0) {
        const initialIdleVideo = { action: 'idle', url: idleUrls[0] }
        setPlayQueue([initialIdleVideo])
        setCurrentIdleIndex(0)
        console.log('Initialized with idle video:', initialIdleVideo)
        
        // 确保初始化后立即开始处理队列
        setTimeout(() => {
          if (!isQueueProcessing && !isPlaying) {
            console.log('Starting initial queue processing')
            processPlayQueue()
          }
        }, 100)
      }
    }).catch((err) => {
      console.error('Failed to load video config:', err)
    })
    
    return () => {
      // 清理预加载的视频元素
      links.forEach((link) => {
        link.remove()
      })
      
      // 清理已处理的触发词记录
      processedActionsRef.current.clear()
      lastStreamContentRef.current = ''
    }
  }, [setVideoConfig, setTtsConfig])

  /**
   * 视频播放结束时的处理逻辑（保留作为备用）
   * 现在主要由队列处理器来管理
   */
  const handleEnded = useCallback(() => {
    // 防止重复处理
    if (isHandlingEnded) return
    setIsHandlingEnded(true)
    
    // 如果队列处理器没有运行，手动触发队列处理
    if (!isQueueProcessing && !isPlaying) {
      processPlayQueue()
    }
    
    setIsHandlingEnded(false)
  }, [isHandlingEnded, isQueueProcessing, isPlaying, processPlayQueue])

  return {handleEnded, videoRef}
}

export default useVideoConfig
