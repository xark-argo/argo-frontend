import {useAtom, useAtomValue} from 'jotai'
import pDefer, {DeferredPromise} from 'p-defer'
import {useCallback, useEffect, useRef} from 'react'

import {getTTSVoice} from '~/lib/apis/bots'

import {bellaTtsConfig, currentBellaMessage} from '../atoms'

// 音频项接口
interface AudioItem {
  sentence: string
  audioUrl: DeferredPromise<string>
  domKeys: string[]
  originalSentence: string
}

function useTTS() {
  const [{content: sentenceStream, role, is_end}] = useAtom(currentBellaMessage)
  const sentencesRef = useRef<string[]>([])
  const processSentencesIndexRef = useRef<number>(0)
  const {
    tts_type,
    tts_params: {voice: tts_voice},
  } = useAtomValue(bellaTtsConfig)

  // 音频队列管理
  const audioQueueRef = useRef<AudioItem[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(new Audio())

  // 改进的括号处理逻辑：移除括号内容，但保持文本连续性
  const processTextInChunks = (text: string): string[] => {
    // 移除 <display>xxx</display> 内容
    const noDisplayText = text.replace(/<display[^>]*>.*?<\/display>/gis, '')

    if (!noDisplayText) {
      return []
    }

    // 按句子边界分割（句号、问号、感叹号、换行符）
    const sentences = noDisplayText
      // eslint-disable-next-line no-useless-escape
      .split(/[。？！\.\!\?\n]/g)
      .filter(sentence => sentence.trim().length > 0)

    return sentences
  }

  // 异步生成音频
  const generateAudio = useCallback(
    async (sentence: string, index: number): Promise<string | null> => {
      try {
        // 检查文本是否为空或只包含空白字符
        if (!sentence.trim()) {
          console.info(`句子 ${index} 为空，跳过TTS调用`)
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
        }
        console.info(`音频 ${index} 生成失败`)
        return null
      } catch (error) {
        console.error(`音频 ${index} 生成错误:`, error)
        return null
      }
    },
    [tts_type, tts_voice]
  )

  // 播放队列中的下一个音频
  const playNextAudio = useCallback(async () => {
    if (audioQueueRef.current.length === 0 && !is_end) {
      const t = setTimeout(() => {
        clearTimeout(t)
        playNextAudio()
      }, 300)
      return
    }
    console.info(
      `playNextAudio 被调用 - 播放队列长度: ${audioQueueRef.current.length}`
    )
    // 从播放队列中取出下一个音频（先pop再播放）
    const audioItem = audioQueueRef.current.shift()

    const audioData = await audioItem?.audioUrl.promise
    if (!audioData) {
      console.info('音频数据为空，播放下一个')
      playNextAudio()
      return
    }

    const audioElement = audioRef.current
    audioElement.src = audioData
    audioElement.volume = 1.0

    // 设置播放结束回调
    audioElement.addEventListener(
      'ended',
      () => {
        console.info(`音频播放结束: '${audioItem.sentence}'`, audioItem)
        // 播放下一个
        const container = document.getElementById('bella-tts-text-container')
        if (container) {
          // 查询所有子节点，找到与当前播放完成句子匹配的节点
          const childNodes = Array.from(container.childNodes)
          let targetNodeIndex = -1

          // 寻找包含当前播放完成句子的节点
          for (let i = 0; i < childNodes.length; i += 1) {
            const node = childNodes[i]
            if (
              node.textContent &&
              node.textContent.includes(audioItem.originalSentence)
            ) {
              targetNodeIndex = i
              break
            }
          }

          // 如果找到了目标节点，删除该节点之前的所有兄弟节点
          if (targetNodeIndex > 0) {
            for (let i = 0; i < targetNodeIndex; i += 1) {
              const nodeToRemove = childNodes[i]
              if (nodeToRemove.parentNode) {
                nodeToRemove.parentNode.removeChild(nodeToRemove)
              }
            }
            console.info(`删除了 ${targetNodeIndex} 个已播放完成的文本节点`)
          }

          // 从目标节点中移除已播放的句子内容
          if (targetNodeIndex >= 0) {
            const targetNode = childNodes[targetNodeIndex]
            if (targetNode && targetNode.textContent) {
              targetNode.textContent = targetNode.textContent
                .replace(audioItem.originalSentence, '')
                // eslint-disable-next-line no-useless-escape
                .replace(/[。？！\.\!\?\n]/g, '')
            }
          }
        }
        playNextAudio()
      },
      {once: true}
    )

    // 设置播放错误回调
    audioElement.addEventListener(
      'error',
      event => {
        const audioTarget = event.target as HTMLAudioElement
        const errorMsg = audioTarget?.error
          ? `${audioTarget.error.code}: ${audioTarget.error.message}`
          : '未知音频播放错误'
        console.error(
          `音频播放出错: '${audioItem.sentence}', 错误信息: ${errorMsg}`
        )
        // 尝试播放下一个
        playNextAudio()
      },
      {once: true}
    )

    // 开始播放
    console.info('开始播放音频:', audioItem.sentence)
    audioElement.addEventListener('loadeddata', () => audioElement.play(), {
      once: true,
    })
  }, [is_end])

  // 处理新的句子
  const processNewSentences = useCallback(
    async (newSentences: string[], startIndex: number) => {
      if (newSentences.length === 0) {
        console.info('没有新句子需要处理')
        return
      }

      console.info(`开始处理 ${newSentences.length} 个新句子:`, newSentences)

      // 为每个新句子创建音频项
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < newSentences.length; i++) {
        // 直接移除括号内容，不进行分割
        const sentence = newSentences[i]
          .replace(/（[^）]*）/g, '') // 移除中文括号内容
          .replace(/\([^)]*\)/g, '') // 移除英文括号内容
          .replace(/\s+/g, ' ') // 合并多个空格
          .trim()
        const queueIndex = startIndex + i

        // 创建音频项
        const audioItem: AudioItem = {
          sentence,
          audioUrl: pDefer<string>(),
          domKeys: [`bella-tts-${queueIndex}`],
          originalSentence: newSentences[i],
        }

        audioQueueRef.current.push(audioItem)
        console.info(`添加音频项 ${queueIndex}: '${sentence}'`)

        // 异步生成音频
        generateAudio(sentence, queueIndex).then(audioUrl => {
          audioItem.audioUrl.resolve(audioUrl)

          console.info(`音频 ${queueIndex} 生成完成，准备播放: '${sentence}'`)

          if (queueIndex === 0) {
            playNextAudio()
          }
        })
      }
    },
    [generateAudio, playNextAudio]
  )

  // 重置TTS状态
  const reset = useCallback(() => {
    console.info('重置TTS状态')

    // 停止当前播放的音频
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
    }

    // 清理所有队列和状态
    audioQueueRef.current = []

    console.info('TTS状态重置完成')
  }, [])

  // 监听流式文本变化
  useEffect(() => {
    if (role !== 'assistant' || !sentenceStream) {
      return
    }
    sentencesRef.current = processTextInChunks(sentenceStream)
    const startIndex = processSentencesIndexRef.current
    let endIndex = startIndex
    if (sentencesRef.current.length > 1) {
      processSentencesIndexRef.current = sentencesRef.current.length - 1
      endIndex = processSentencesIndexRef.current
    }
    if (is_end) {
      endIndex = sentencesRef.current.length
      processSentencesIndexRef.current = endIndex
    }
    const newSentences = sentencesRef.current.slice(startIndex, endIndex)
    processNewSentences(newSentences, startIndex)
  }, [sentenceStream, role, processNewSentences, is_end])

  // 监听用户输入（通过检测role变化）
  useEffect(() => {
    if (role === 'user') {
      // 用户输入新消息，清理语音播放队列
      console.info('检测到用户输入，清理语音播放队列')
      reset()
    }
  }, [role, reset])

  return {
    reset,
  }
}

export default useTTS
