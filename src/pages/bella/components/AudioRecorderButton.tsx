import {Message} from '@arco-design/web-react'
import {useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'

interface AudioRecorderButtonProps {
  onResult: (text: string) => void
}

// 兼容 TS 类型声明
interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

declare const window: WindowWithSpeechRecognition

function AudioRecorderButton({onResult}: AudioRecorderButtonProps) {
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const {i18n} = useTranslation()

  const isSupported = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  )

  const handleStart = () => {
    if (!isSupported) {
      Message.error('当前浏览器不支持语音识别')
      return
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = i18n.language
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      onResult(text)
      setRecording(false)
    }
    recognition.onerror = () => {
      setRecording(false)
    }
    recognition.onend = () => {
      setRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  const handleStop = () => {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  return (
    <button
      type="button"
      onClick={recording ? handleStop : handleStart}
      className={`mr-2 px-4 py-2 rounded ${recording ? 'bg-red-500' : 'bg-blue-500'} text-white`}
      disabled={!isSupported}>
      {recording ? '停止录音' : '语音输入'}
    </button>
  )
}

export default AudioRecorderButton
