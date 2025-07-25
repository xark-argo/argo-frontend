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
  const isMessageCompleteRef = useRef(false)
  
  // 新增：播放队列管理
  const playQueueRef = useRef<AudioItem[]>([])
  const isPlayingFromQueueRef = useRef(false)
  
  // 新增：流式消息结束检测
  const lastContentLengthRef = useRef<number>(0)
  const isStreamingEndedRef = useRef(false)
  const lastUserInputTimeRef = useRef<number>(0)

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
    
    // 按句号、问号、感叹号、换行符分割，包括中英文
    const sentences = finalText
      .split(/[。？！\.\!\?\n]/g)
      .filter((item) => {
        const trimmed = item.trim()
        // 过滤掉空字符串
        if (trimmed === '') {
          return false
        }
        
        // 过滤掉只包含标点符号的句子
        const onlyPunctuation = /^[，。？！、；：""''（）【】《》…—\-\.\!\?\,\;\:\"\'\(\)\[\]\{\}\<\>\~\`\@\#\$\%\^\&\*\+\=\|\/\\]+$/
        if (onlyPunctuation.test(trimmed)) {
          console.log(`跳过只包含标点符号的句子: "${trimmed}"`)
          return false
        }
        
        return true
      })

    return sentences
  }, [removeDisplayTags, removeBracketContent])

  // 流式处理文本，提取新的可播放句子
  const processStreamingTextForTTS = useCallback((text: string): string[] => {
    // 只处理新增的文本部分
    const newText = text.slice(processedTextRef.current.length)

    if (!newText.trim()) {
      console.log('新增文本为空，返回空数组')
      return []
    }

    console.log('处理新增文本:', newText)

    // 处理新增文本
    const newSentences = processTextForTTS(newText)

    return newSentences
  }, [processTextForTTS])

  // 增量处理文本，只提取新增的句子
  const processIncrementalText = useCallback((fullText: string): string[] => {
    const processedLength = processedTextRef.current.length
    const newText = fullText.slice(processedLength)
    
    if (!newText.trim()) {
      console.log('没有新增文本')
      return []
    }

    console.log('增量处理文本:', newText)

    // 改进的括号处理逻辑：移除括号内容，但保持文本连续性
    const processTextInChunks = (text: string): string[] => {
      // 移除 <display>xxx</display> 内容
      const noDisplayText = text.replace(/<display[^>]*>.*?<\/display>/gis, '')
      // 直接移除括号内容，不进行分割
      const cleanedText = noDisplayText
        .replace(/（[^）]*）/g, '') // 移除中文括号内容
        .replace(/\([^)]*\)/g, '') // 移除英文括号内容
        .replace(/\s+/g, ' ') // 合并多个空格
        .trim()
      
      if (!cleanedText) {
        return []
      }
      
      // 按句子边界分割（句号、问号、感叹号、换行符）
      const sentences = cleanedText
        .split(/[。？！\.\!\?\n]/g)
        .filter(sentence => sentence.trim().length > 0)
      
      return sentences
    }

    // 处理新增文本
    const textChunks = processTextInChunks(newText)
    console.log('新增文本分块结果:', textChunks)
    
    if (textChunks.length > 0) {
      // 处理每个文本块
      const allNewSentences: string[] = []
      
      for (const chunk of textChunks) {
        if (chunk.trim()) {
          // 进一步清理和验证句子
          const cleanedChunk = chunk.trim()
          // 过滤掉只包含标点符号的句子
          const onlyPunctuation = /^[，。？！、；：""''（）【】《》…—\-\.\!\?\,\;\:\"\'\(\)\[\]\{\}\<\>\~\`\@\#\$\%\^\&\*\+\=\|\/\\]+$/
          if (!onlyPunctuation.test(cleanedChunk)) {
            allNewSentences.push(cleanedChunk)
          }
        }
      }
      
      console.log('增量处理后的句子:', allNewSentences)
      return allNewSentences
    } else {
      // 如果分块失败，尝试直接处理新增文本
      console.log('分块处理失败，直接处理新增文本')
      return processTextForTTS(newText)
    }
  }, [processTextForTTS])

  // 异步生成音频
  const generateAudio = useCallback(async (sentence: string, index: number): Promise<string | null> => {
    try {
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
      audioRef.current.src = audioItem.audioUrl
      audioRef.current.volume = 1.0
      
      // 设置播放结束回调
      if (audioRef.current) {
        audioRef.current.onended = () => {
          console.log(`音频播放结束: "${audioItem.sentence}"`)
          // 播放下一个
          playNextAudio()
        }
        
        // 设置播放错误回调
        audioRef.current.onerror = (error) => {
          console.error(`音频播放出错: "${audioItem.sentence}"`, error)
          // 尝试播放下一个
          playNextAudio()
        }
      }

      // 开始播放
      console.log('开始播放音频:', audioItem.sentence)
      setIsPlayingAudio(true)
      await audioRef.current.play()
      return true
    } catch (error) {
      console.error(`音频播放异常: "${audioItem.sentence}"`, error)
      playNextAudio()
      return false
    }
  }, [])

  // 播放队列中的下一个音频
  const playNextAudio = useCallback(async () => {
    console.log(`playNextAudio 被调用 - 播放队列长度: ${playQueueRef.current.length}`)
    
    // 检查播放队列是否为空
    if (playQueueRef.current.length === 0) {
      console.log('播放队列为空，停止播放')
      setIsPlayingAudio(false)
      hasStartedRef.current = false
      isPlayingFromQueueRef.current = false
      return
    }
    
    // 从播放队列中取出下一个音频（先pop再播放）
    const audioItem = playQueueRef.current.shift()
    if (!audioItem || !audioItem.audioUrl) {
      console.log('播放队列中的音频项无效，尝试播放下一个')
      playNextAudio()
      return
    }
    
    console.log(`准备播放音频: "${audioItem.sentence}"`)
    isPlayingFromQueueRef.current = true
    
    try {
      if (!audioRef.current) {
        console.log('音频对象不存在，跳过播放')
        isPlayingFromQueueRef.current = false
        return
      }

      audioRef.current.src = audioItem.audioUrl
      audioRef.current.volume = 1.0
      
      // 设置播放结束回调
      audioRef.current.onended = () => {
        console.log(`音频播放结束: "${audioItem.sentence}"`)
        // 播放下一个
        playNextAudio()
      }
      
      // 设置播放错误回调
      audioRef.current.onerror = (error) => {
        console.error(`音频播放出错: "${audioItem.sentence}"`, error)
        // 尝试播放下一个
        playNextAudio()
      }

      // 开始播放
      console.log('开始播放音频:', audioItem.sentence)
      setIsPlayingAudio(true)
      await audioRef.current.play()
    } catch (error) {
      console.error(`音频播放异常: "${audioItem.sentence}"`, error)
      isPlayingFromQueueRef.current = false
      playNextAudio()
    }
  }, [])

  // 检查并尝试播放队列中的音频
  const checkAndPlayAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      return
    }

    // 将已准备好的音频添加到播放队列
    const readyAudios = audioQueueRef.current.filter(item => item.isReady && item.audioUrl)
    if (readyAudios.length > 0) {
      console.log(`将 ${readyAudios.length} 个已准备好的音频添加到播放队列`)
      playQueueRef.current.push(...readyAudios)
      
      // 从音频队列中移除已添加到播放队列的音频
      audioQueueRef.current = audioQueueRef.current.filter(item => !item.isReady || !item.audioUrl)
    }

    // 如果播放队列不为空且当前没有在播放，开始播放
    if (playQueueRef.current.length > 0 && !isPlayingAudio && !isPlayingFromQueueRef.current) {
      console.log('检测到播放队列有音频，开始播放')
      playNextAudio()
    } else if (playQueueRef.current.length > 0) {
      console.log(`播放状态检查 - 播放队列长度: ${playQueueRef.current.length}, 正在播放: ${isPlayingAudio}, 从队列播放: ${isPlayingFromQueueRef.current}`)
    }
  }, [isPlayingAudio, playNextAudio])

  // 处理新的句子
  const processNewSentences = useCallback(async (newSentences: string[]) => {
    if (newSentences.length === 0) {
      console.log('没有新句子需要处理')
      return
    }

    console.log(`开始处理 ${newSentences.length} 个新句子:`, newSentences)

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
      console.log(`添加音频项 ${queueIndex}: "${sentence}"`)

      // 异步生成音频
      generateAudio(sentence, queueIndex).then((audioUrl) => {
        audioItem.audioUrl = audioUrl
        audioItem.isGenerating = false
        audioItem.isReady = true

        console.log(`音频 ${queueIndex} 生成完成，准备播放: "${sentence}"`)

        // 检查是否可以开始播放
        if (!hasStartedRef.current) {
          console.log('开始第一个音频播放')
          hasStartedRef.current = true
        }
        
        // 检查并尝试播放
        checkAndPlayAudio()
      }).catch((error) => {
        console.error(`音频 ${queueIndex} 生成失败:`, error)
        audioItem.isGenerating = false
        audioItem.isReady = false
      })
    }
  }, [generateAudio, playNextAudio, isPlayingAudio, checkAndPlayAudio])

  // 重置TTS状态
  const reset = useCallback(() => {
    console.log('重置TTS状态')
    
    // 停止当前播放的音频
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
    }
    
    // 清理所有队列和状态
    audioQueueRef.current = []
    currentPlayingIndexRef.current = 0
    playQueueRef.current = []
    isPlayingFromQueueRef.current = false
    setIsPlayingAudio(false)
    hasStartedRef.current = false
    
    // 清理文本处理状态
    lastProcessedIndexRef.current = 0
    pendingTextRef.current = ''
    processedTextRef.current = ''
    isMessageCompleteRef.current = false
    isStreamingEndedRef.current = false
    lastContentLengthRef.current = 0
    lastUserInputTimeRef.current = Date.now()
    
    // 清理定时器
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
    
    console.log('TTS状态重置完成')
  }, [])



  // 检测用户输入并清理队列
  const checkUserInputAndCleanup = useCallback(() => {
    const currentTime = Date.now()
    const timeSinceLastInput = currentTime - lastUserInputTimeRef.current
    
    // 如果距离上次用户输入超过一定时间，清理队列
    if (timeSinceLastInput > 1000) { // 1秒
      console.log('检测到用户输入，清理语音播放队列')
      reset()
      lastUserInputTimeRef.current = currentTime
    }
  }, [reset])

  // 监听流式文本变化
  useEffect(() => {
    if (role !== 'assistant' || !sentences) {
      return
    }

    // 如果消息已经完成，不再处理
    if (isMessageCompleteRef.current) {
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

    // 更新内容长度记录
    lastContentLengthRef.current = sentences.length

    // 设置较短的延迟处理，实现流式处理
    processingTimeoutRef.current = setTimeout(() => {
      console.log('开始处理流式文本:', pendingTextRef.current)

      // 检查display标签是否完整
      if (!isDisplayTagsComplete(pendingTextRef.current)) {
        console.log('display标签不完整，等待更多内容')
        return
      }

      // 使用增量处理，只处理新增的句子
      const newSentences = processIncrementalText(pendingTextRef.current)
      
      if (newSentences.length > 0) {
        console.log('发现新的增量句子:', newSentences)
        // 异步处理新句子
        processNewSentences(newSentences)
        
        // 更新已处理文本
        processedTextRef.current = pendingTextRef.current
      } else {
        console.log('没有新的增量句子')
      }
    }, 200) // 减少延迟，更快响应流式内容
  }, [sentences, role, isDisplayTagsComplete, processIncrementalText, processNewSentences])

  // 监听用户输入（通过检测role变化）
  useEffect(() => {
    if (role === 'user') {
      // 用户输入新消息，清理语音播放队列
      console.log('检测到用户输入，清理语音播放队列')
      reset()
      lastUserInputTimeRef.current = Date.now()
    }
  }, [role, reset])

  return {
    isPlayingAudio,
    reset,
    // 检查是否所有音频都播放完成
    isAllAudioFinished: () => {
      // 如果音频队列为空，说明已经播放完成并清空了
      if (audioQueueRef.current.length === 0) {
        return true
      }
      
      const hasAudioQueue = audioQueueRef.current.length > 0
      const allAudioPlayed = currentPlayingIndexRef.current >= audioQueueRef.current.length
      const notPlaying = !isPlayingAudio
      
      return hasAudioQueue && allAudioPlayed && notPlaying
    }
  }
}

export default useTTS

