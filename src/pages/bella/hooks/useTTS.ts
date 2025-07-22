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

  const getAudio = useCallback(async () => {
    const sentence = sentencesRef.current[playIndex.current]

    const reg =
      /(?:[（(][^()（）]*[）)]|[\p{Emoji_Presentation}\p{Extended_Pictographic}#\-*])/gu
    let cleanedSentence = sentence?.replace(reg, '') || ''

    const domKeys = [`bella-tts-${playIndex.current}`]

    while (
      cleanedSentence.length < 10 &&
      playIndex.current < sentencesRef.current.length - 1
    ) {
      playIndex.current++
      const nextSentence =
        sentencesRef.current[playIndex.current]?.replace(reg, '') || ''
      domKeys.push(`bella-tts-${playIndex.current}`)
      cleanedSentence += nextSentence
    }

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
      if (playIndex.current < sentencesRef.current.length) {
        playIndex.current += 1
        getAudio()
      } else {
        sentencesRef.current = []
        playIndex.current = 0
        setIsPlayingAudio(false)
      }
    }
    if (
      playIndex.current === sentencesRef.current.length - 1 ||
      !cleanedSentence
    ) {
      setCurrentMessage({
        content: '',
        role: 'assistant',
      })
      setAction('idle')
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
    if (!audio || !ttsVoice) return

    audio.src = `data:audio/wav;base64,${ttsVoice}`
    setIsPlayingAudio(true)
    audio.play()

    audio.onended = () => {
      playIndex.current++
      onPlayEnded()
    }
  }, [setCurrentMessage, setAction, tts_type, tts_voice])

  useEffect(() => {
    const dealSentences = sentences
      .replace(/(?:[（(][^()（）]*[）)]|<display>.*?<\/display>)/gis, '')
      .split(/[。？！?.!\n]/g)
      .filter((item) => item.trim() !== '')
    sentencesRef.current = dealSentences
    if (
      !hasStartedRef.current &&
      dealSentences.length > 1 &&
      role === 'assistant'
    ) {
      hasStartedRef.current = true
      setTimeout(getAudio, 800)
    }
  }, [sentences, getAudio, role])

  return {
    isPlayingAudio,
    reset: () => {
      sentencesRef.current = []
      playIndex.current = 0
      setIsPlayingAudio(false)
      hasStartedRef.current = false
    },
  }
}
export default useTTS
