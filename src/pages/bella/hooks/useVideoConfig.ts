import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect, useRef} from 'react'

import {getBalleVideoConfig} from '~/lib/apis/bots'

import {bellaTtsConfig, currentBellaMessage} from '../atoms'

function useVideoConfig() {
  const {content: streamContent, role} = useAtomValue(currentBellaMessage)

  const videoRef = useRef<HTMLVideoElement>(null)
  const videoConfig = useRef<{actions: string; url: string[]}[]>([])
  // const streamActionConfigs = useRef(new Set<string>())
  const nextAction = useRef<string[]>([])

  const setTtsConfig = useSetAtom(bellaTtsConfig)

  const onPlayVideo = useCallback((currentAction: string, urls: string[]) => {
    const videoDom = videoRef.current
    if (!videoDom || !urls.length) {
      console.info('videoDom is null or urls is empty')
      return
    }
    console.info('onPlayVideo', currentAction, urls[0])
    videoDom.src = urls[0]!
    videoDom.style.opacity = '1'
    videoDom.addEventListener(
      'loadeddata',
      () => {
        videoDom.play()
      },
      {once: true}
    )

    videoDom.addEventListener(
      'ended',
      () => {
        videoDom.style.opacity = '0'
        setTimeout(() => {
          if (nextAction.current.length) {
            const action = nextAction.current.shift()
            const actionUrls =
              videoConfig.current.find(item => item.actions.includes(action))
                ?.url ?? []
            if (action && actionUrls.length) {
              onPlayVideo(action, actionUrls)
              return
            }
          }
          if (urls.length > 1) {
            onPlayVideo(currentAction, urls.slice(1))
          }
          if (urls.length === 1) {
            const idleUrls = videoConfig.current.find(
              item => item.actions === 'idle'
            )?.url
            if (idleUrls) {
              onPlayVideo('idle', idleUrls)
            }
          }
        }, 300)
      },
      {once: true}
    )
  }, [])

  useEffect(() => {
    const videoCacheElements: HTMLVideoElement[] = []
    getBalleVideoConfig().then(res => {
      const videos = []
      // 选择角色（目前选择第0个，后续可扩展选择逻辑）
      const selectedRole = res?.[0]
      if (!selectedRole) {
        console.warn('No role data found')
        return
      }

      const roleName = selectedRole.name ?? 'ani'
      const baseUrl = `${window.location.origin}/api/files/resources/characters/${roleName}/`
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
        selectedRole.emotion_idle.forEach(idle => {
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
        Object.keys(selectedRole.emotionMap).forEach(emotion => {
          videos.push({
            actions: selectedRole.emotionMap[emotion].join(','),
            url: [`${baseUrl}${emotion}`],
          })
        })
      }

      // 预加载所有视频
      videos.forEach(video => {
        video.url.forEach(url => {
          const videoEl = document.createElement('video')
          videoEl.preload = 'auto'
          videoEl.src = url
          videoEl.style.display = 'none' // 隐藏预加载的视频元素
          document.body.appendChild(videoEl)
          videoCacheElements.push(videoEl)
        })
      })

      videoConfig.current = videos

      onPlayVideo('idle', idleUrls)
    })
    return () => {
      videoCacheElements.forEach(video => {
        video.remove()
      })
    }
  }, [onPlayVideo, setTtsConfig])

  useEffect(() => {
    if (role === 'user' && videoConfig.current.length > 0) {
      console.info('rest vodie config')
      const idleUrls = videoConfig.current.find(
        item => item.actions === 'idle'
      )?.url
      if (idleUrls) {
        nextAction.current = []
        onPlayVideo('idle', idleUrls)
      }
    }
  }, [role, onPlayVideo])

  useEffect(() => {
    const matches = streamContent.match(/<display>(.*?)<\/display>/g)
    // const actionConfigs = streamActionConfigs.current
    if (matches) {
      console.info('Found display matches:', matches)
      matches.forEach(match => {
        const actionMatch = match.match(/<display>(.*?)<\/display>/)
        if (actionMatch?.[1]) {
          const action = actionMatch[1]
          nextAction.current.push(action)
          // 使用更精确的重复检测：action + 完整匹配内容
          // const actionKey = `${action}-${match}`
          // if (!actionConfigs.has(actionKey)) {
          //   actionConfigs.add(actionKey)
          //   console.info(
          //     'Processing new action:',
          //     action,
          //     'from stream content length:',
          //     streamContent.length
          //   )
          //   nextAction.current.push(action)
          // } else {
          //   console.info('Skipping already processed action:', action)
          // }
        }
      })
    } else {
      console.info('No display matches found in current content')
    }
  }, [streamContent])

  return {
    videoRef,
  }
}

export default useVideoConfig
