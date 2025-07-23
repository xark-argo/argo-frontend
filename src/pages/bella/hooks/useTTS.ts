/* eslint-disable no-plusplus */
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect, useRef, useState} from 'react'

import {getTTSVoice} from '~/lib/apis/bots'

import {bellaAction, bellaTtsConfig, currentBellaMessage} from '../atoms'

// 音频项接口
interface AudioItem {
  sentence: string
  audioUrl: string | null
  isGenerating: boolean
  isReady: boolean
  domKeys: string[]
}

function useTTS() {
  const [{content: sentences, role}, setCurrentMessage] = useAtom(currentBellaMessage)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const setAction = useSetAtom(bellaAction)
  const {
    tts_type,
    tts_params: {voice: tts_voice},
  } = useAtomValue(bellaTtsConfig)

  // 用于跟踪括号状态和流式处理
  const lastProcessedIndexRef = useRef<number>(0)
  const pendingTextRef = useRef<string>('')
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const processedTextRef = useRef<string>('') // 已处理的文本
  
  // 音频队列管理
  const audioQueueRef = useRef<AudioItem[]>([])
  const currentPlayingIndexRef = useRef<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(new Audio())
  const hasStartedRef = useRef(false)

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

  // 移除display标签内容
  const removeDisplayTags = useCallback((text: string): string => {
    return text.replace(/<display[^>]*>.*?<\/display>/gis, '')
  }, [])

  // 移除括号内的描述性文字
  const removeBracketContent = useCallback((text: string): string => {
    // 移除中文括号 () 和英文括号 () 内的内容
    return text
      .replace(/（[^）]*）/g, '') // 中文括号
      .replace(/\([^)]*\)/g, '') // 英文括号
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim()
  }, [])

  // 处理文本并分割句子
  const processTextForTTS = useCallback((text: string): string[] => {
    // 移除 <display>xxx</display> 内容
    const noDisplayText = removeDisplayTags(text)
    // 移除括号内的描述性文字
    const noBracketText = removeBracketContent(noDisplayText)
    // 移除表情符号和其他不需要的内容
    const finalText = noBracketText.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}#\-*]/gu, '')
    
    console.log('=== processTextForTTS Debug ===')
    console.log('原始文本:', text)
    console.log('移除display后:', noDisplayText)
    console.log('移除括号后:', noBracketText)
    console.log('最终文本:', finalText)
    
    // 按句号、问号、感叹号、换行符分割
    const sentences = finalText
      .split(/[。？！?.!\n]/g)
      .filter((item) => item.trim() !== '')
    
    console.log('分割后的句子:', sentences)
    return sentences
  }, [removeDisplayTags, removeBracketContent])

  // 流式处理文本，提取新的可播放句子
  const processStreamingTextForTTS = useCallback((text: string): string[] => {
    // 只处理新增的文本部分
    const newText = text.slice(processedTextRef.current.length)

    console.log('=== processStreamingTextForTTS Debug ===')
    console.log('完整文本:', text)
    console.log('已处理文本:', processedTextRef.current)
    console.log('新增文本:', newText)

    if (!newText.trim()) {
      console.log('新增文本为空，返回空数组')
      return []
    }

    // 处理新增文本
    const newSentences = processTextForTTS(newText)
    console.log('新增句子:', newSentences)

    return newSentences
  }, [processTextForTTS])

  // 异步生成音频
  const generateAudio = useCallback(async (sentence: string, index: number): Promise<string | null> => {
    try {
      console.log(`开始生成音频 ${index}:`, sentence)
      
      // 检查文本是否为空或只包含空白字符
      if (!sentence.trim()) {
        console.log(`句子 ${index} 为空，跳过TTS调用`)
        return null
      }
      
      const {data: ttsVoice} = await getTTSVoice({
        tts_type,
        tts_params: {
          voice: tts_voice,
          text: sentence,
        },
      })

      if (ttsVoice) {
        console.log(`音频 ${index} 生成成功`)
        return `data:audio/wav;base64,${ttsVoice}`
      } else {
        console.log(`音频 ${index} 生成失败`)
        return null
      }
    } catch (error) {
      console.error(`音频 ${index} 生成错误:`, error)
      return null
    }
  }, [tts_type, tts_voice])

  // 播放音频
  const playAudio = useCallback(async (audioItem: AudioItem) => {
    if (!audioItem.audioUrl || !audioRef.current) {
      console.log('音频URL为空或音频对象不存在，跳过播放')
      return false
    }

    try {
      console.log('开始播放音频:', audioItem.sentence)
      audioRef.current.src = audioItem.audioUrl
      setIsPlayingAudio(true)
      await audioRef.current.play()
      return true
    } catch (error) {
      console.error('播放音频失败:', error)
      return false
    }
  }, [])

  // 播放队列中的下一个音频
  const playNextAudio = useCallback(async () => {
    // 查找下一个可播放的音频
    let nextIndex = currentPlayingIndexRef.current
    while (nextIndex < audioQueueRef.current.length) {
      const audioItem = audioQueueRef.current[nextIndex]
      if (audioItem.isReady && audioItem.audioUrl) {
        break
      }
      nextIndex++
    }

    if (nextIndex >= audioQueueRef.current.length) {
      // 没有更多可播放的音频
      console.log('没有更多可播放的音频')
      setIsPlayingAudio(false)
      hasStartedRef.current = false
      return
    }

    currentPlayingIndexRef.current = nextIndex
    const audioItem = audioQueueRef.current[nextIndex]
    
         // 设置播放结束回调
     if (audioRef.current) {
       audioRef.current.onended = () => {
         // 播放下一个
         currentPlayingIndexRef.current++
         playNextAudio()
       }
     }

    // 播放当前音频
    await playAudio(audioItem)
  }, [playAudio])

  // 处理新的句子
  const processNewSentences = useCallback(async (newSentences: string[]) => {
    if (newSentences.length === 0) return

    // 为每个新句子创建音频项
    for (let i = 0; i < newSentences.length; i++) {
      const sentence = newSentences[i]
      const queueIndex = audioQueueRef.current.length
      
      // 创建音频项
      const audioItem: AudioItem = {
        sentence,
        audioUrl: null,
        isGenerating: true,
        isReady: false,
        domKeys: [`bella-tts-${queueIndex}`]
      }
      
      audioQueueRef.current.push(audioItem)

      // 异步生成音频
      generateAudio(sentence, queueIndex).then((audioUrl) => {
        audioItem.audioUrl = audioUrl
        audioItem.isGenerating = false
        audioItem.isReady = true

        // 如果这是第一个音频且还没有开始播放，开始播放
        if (queueIndex === 0 && !hasStartedRef.current) {
          hasStartedRef.current = true
          playNextAudio()
        }
        // 如果当前正在播放且这是下一个要播放的音频，立即播放
        else if (queueIndex === currentPlayingIndexRef.current && isPlayingAudio) {
          playNextAudio()
        }
      })
    }
  }, [generateAudio, playNextAudio, isPlayingAudio])

  // 重置TTS状态
  const reset = useCallback(() => {
    audioQueueRef.current = []
    currentPlayingIndexRef.current = 0
    setIsPlayingAudio(false)
    hasStartedRef.current = false
    lastProcessedIndexRef.current = 0
    pendingTextRef.current = ''
    processedTextRef.current = ''
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  // 监听流式文本变化
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

    // 设置较短的延迟处理，实现流式处理
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
      const newSentences = processStreamingTextForTTS(pendingTextRef.current)
      console.log('新的可播放句子:', newSentences)
      
      if (newSentences.length > 0) {
        // 异步处理新句子
        processNewSentences(newSentences)
        
        // 更新已处理文本
        processedTextRef.current = pendingTextRef.current
      }
    }, 200) // 减少延迟，更快响应流式内容
  }, [sentences, role, isBracketsBalanced, isDisplayTagsComplete, processStreamingTextForTTS, processNewSentences])

  return {
    isPlayingAudio,
    reset,
    // 检查是否所有音频都播放完成
    isAllAudioFinished: () => {
      return !isPlayingAudio && audioQueueRef.current.length > 0 && 
             currentPlayingIndexRef.current >= audioQueueRef.current.length
    }
  }
}

export default useTTS

