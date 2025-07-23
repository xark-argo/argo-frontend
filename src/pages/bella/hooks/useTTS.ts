/* eslint-disable no-plusplus */
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect, useRef, useState} from 'react'

import {getTTSVoice} from '~/lib/apis/bots'

import {bellaAction, bellaTtsConfig, currentBellaMessage} from '../atoms'

function useTTS() {
  const playIndex = useRef(0)
  const [{content: sentences, role}, setCurrentMessage] =
    useAtom(currentBellaMessage)
  const sentencesRef = useRef<string[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(new Audio())
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const hasStartedRef = useRef(false)
  const setAction = useSetAtom(bellaAction)
  const {
    tts_type,
    tts_params: {voice: tts_voice},
  } = useAtomValue(bellaTtsConfig)

  // 用于跟踪括号状态和流式处理
  const lastProcessedIndexRef = useRef<number>(0)
  const pendingTextRef = useRef<string>('')
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 检查括号是否平衡
  const isBracketsBalanced = useCallback((text: string): boolean => {
    let count = 0
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      if (char === '(' || char === '（') {
        count++
      } else if (char === ')' || char === '）') {
        count--
        if (count < 0) return false // 右括号多于左括号
      }
    }
    return count === 0
  }, [])

  // 检查display标签是否完整
  const isDisplayTagsComplete = useCallback((text: string): boolean => {
    // 检查是否有未闭合的display标签
    const openTags = (text.match(/<display[^>]*>/gi) || []).length
    const closeTags = (text.match(/<\/display>/gi) || []).length
    
    // 如果包含<但还没有完整的display标签，认为不完整
    if (text.includes('<') && openTags === 0 && closeTags === 0) {
      return false
    }
    
    // 如果有display标签，检查是否平衡
    return openTags === closeTags
  }, [])

  // 智能处理流式文本，等待括号完整
  const processStreamingText = useCallback((text: string): string => {
    let result = ''
    let i = 0
    let bracketCount = 0
    
    while (i < text.length) {
      const char = text[i]
      
      if (char === '(' || char === '（') {
        bracketCount++
        i++
      } else if (char === ')' || char === '）') {
        bracketCount--
        i++
      } else {
        if (bracketCount === 0) {
          // 不在任何括号内，添加到结果
          result += char
        }
        i++
      }
    }
    
    return result
  }, [])

  // 移除display标签内容
  const removeDisplayTags = useCallback((text: string): string => {
    // 使用简单但有效的方法：移除所有display标签及其内容
    // 对于TTS来说，我们主要关注实际的对话内容，display标签通常是显示相关的
    return text.replace(/<display[^>]*>.*?<\/display>/gis, '')
  }, [])

  // 移除括号内容并分割句子
  const processTextForTTS = useCallback((text: string): string[] => {
    // 先处理流式文本中的括号
    const processedText = processStreamingText(text)
    // 移除 <display>xxx</display> 内容
    const noDisplayText = removeDisplayTags(processedText)
    // 移除表情符号和其他不需要的内容
    const finalText = noDisplayText.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}#\-*]/gu, '')
    // 按句号、问号、感叹号、换行符分割
    return finalText
      .split(/[。？！?.!\n]/g)
      .filter((item) => item.trim() !== '')
  }, [processStreamingText, removeDisplayTags])

  const getAudio = useCallback(async () => {
    const sentence = sentencesRef.current[playIndex.current]

    console.log('=== getAudio Debug ===')
    console.log('当前播放索引:', playIndex.current)
    console.log('句子数组:', sentencesRef.current)
    console.log('当前句子:', sentence)

    if (!sentence) {
      // 没有更多句子，结束播放
      console.log('没有更多句子，结束播放')
      setCurrentMessage({
        content: '',
        role: 'assistant',
      })
      setAction('idle')
      setIsPlayingAudio(false)
      return
    }

    const domKeys = [`bella-tts-${playIndex.current}`]

    // 合并短句子
    let cleanedSentence = sentence
    let currentIndex = playIndex.current

    while (
      cleanedSentence.length < 10 &&
      currentIndex < sentencesRef.current.length - 1
    ) {
      currentIndex++
      const nextSentence = sentencesRef.current[currentIndex] || ''
      domKeys.push(`bella-tts-${currentIndex}`)
      cleanedSentence += nextSentence
    }

    console.log('清理后的句子:', cleanedSentence)

    function onPlayEnded() {
      domKeys.forEach((key) => {
        const el = document.getElementById(key)
        if (el) {
          // 添加淡出动画类
          el.classList.add('fade-out')
          // 动画结束后移除元素
          el.addEventListener(
            'transitionend',
            () => {
              el.classList.add('hidden')
            },
            {once: true}
          )
          el.style.opacity = '0'
        }
      })
      
      // 更新播放索引
      playIndex.current = currentIndex + 1
      
      if (playIndex.current < sentencesRef.current.length) {
        getAudio()
      } else {
        // 播放完成，重置状态
        console.log('播放完成，重置状态')
        sentencesRef.current = []
        playIndex.current = 0
        setIsPlayingAudio(false)
        hasStartedRef.current = false
      }
    }

    console.log('调用TTS API，文本:', cleanedSentence)
    
    // 检查文本是否为空或只包含空白字符
    if (!cleanedSentence.trim()) {
      console.log('文本为空，跳过TTS调用，继续下一句')
      onPlayEnded()
      return
    }
    
    const {data: ttsVoice} = await getTTSVoice({
      tts_type,
      tts_params: {
        voice: tts_voice,
        text: cleanedSentence,
      },
    })

    const audio = audioRef.current
    if (!audio || !ttsVoice) {
      console.log('TTS API返回失败或音频对象不存在，继续下一句')
      onPlayEnded()
      return
    }

    console.log('TTS API成功，开始播放音频')
    audio.src = `data:audio/wav;base64,${ttsVoice}`
    setIsPlayingAudio(true)
    audio.play()

    audio.onended = onPlayEnded
  }, [setCurrentMessage, setAction, tts_type, tts_voice])

  useEffect(() => {
    if (role !== 'assistant' || !sentences) {
      return
    }

    // 检查是否有新的内容需要处理
    const newContent = sentences.slice(lastProcessedIndexRef.current)
    if (!newContent) return

    // 更新待处理文本
    pendingTextRef.current += newContent
    lastProcessedIndexRef.current = sentences.length

    // 清除之前的处理定时器
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
    }

    // 设置延迟处理，确保流式文本完全接收
    processingTimeoutRef.current = setTimeout(() => {
      // 调试信息
      console.log('=== TTS Debug ===')
      console.log('当前文本:', sentences)
      console.log('待处理文本:', pendingTextRef.current)
      console.log('括号平衡:', isBracketsBalanced(pendingTextRef.current))

      // 检查括号是否平衡
      if (!isBracketsBalanced(pendingTextRef.current)) {
        console.log('括号不平衡，等待更多内容')
        return
      }

      // 检查display标签是否完整
      if (!isDisplayTagsComplete(pendingTextRef.current)) {
        console.log('display标签不完整，等待更多内容')
        return
      }

      // 检查是否在括号内（通过计算当前括号深度）
      let bracketCount = 0
      for (let i = 0; i < pendingTextRef.current.length; i++) {
        const char = pendingTextRef.current[i]
        if (char === '(' || char === '（') {
          bracketCount++
        } else if (char === ')' || char === '）') {
          bracketCount--
        }
      }
      
      console.log('括号深度:', bracketCount)
      
      if (bracketCount > 0) {
        console.log('还在括号内，等待更多内容')
        return
      }

      // 括号平衡且不在括号内，处理文本
      const processedSentences = processTextForTTS(pendingTextRef.current)
      console.log('处理后的句子:', processedSentences)
      console.log('句子数量:', processedSentences.length)
      
      if (processedSentences.length > 0) {
        sentencesRef.current = processedSentences
        
        console.log('hasStartedRef.current:', hasStartedRef.current)
        console.log('processedSentences.length > 1:', processedSentences.length > 1)
        console.log('!isPlayingAudio:', !isPlayingAudio)
        
        // 如果还没有开始播放且有足够的句子，开始播放
        if (
          !hasStartedRef.current &&
          processedSentences.length > 1 &&
          !isPlayingAudio
        ) {
          console.log('开始播放TTS')
          hasStartedRef.current = true
          setTimeout(getAudio, 800)
        } else if (processedSentences.length === 1 && !hasStartedRef.current && !isPlayingAudio) {
          // 如果只有一个句子，也尝试播放
          console.log('单个句子，开始播放TTS')
          hasStartedRef.current = true
          setTimeout(getAudio, 800)
        }
        
        // 清空待处理文本
        pendingTextRef.current = ''
      }
    }, 500) // 500ms延迟，确保流式文本完全接收
  }, [sentences, role, isBracketsBalanced, isDisplayTagsComplete, processTextForTTS, getAudio, isPlayingAudio])

  return {
    isPlayingAudio,
    reset: () => {
      sentencesRef.current = []
      playIndex.current = 0
      setIsPlayingAudio(false)
      hasStartedRef.current = false
      lastProcessedIndexRef.current = 0
      pendingTextRef.current = ''
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
        processingTimeoutRef.current = null
      }
    },
  }
}
export default useTTS

