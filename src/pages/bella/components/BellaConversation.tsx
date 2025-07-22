import {Message} from '@arco-design/web-react'
import {fetchEventSource} from '@microsoft/fetch-event-source'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useHistory, useParams} from 'react-router-dom'

import {createConversation} from '~/lib/apis/conversations'
import {WEBUI_API_BASE_URL} from '~/lib/constants'

import {bellaAction, bellaBotDetail, currentBellaMessage} from '../atoms'
import useTTS from '../hooks/useTTS'
import AudioRecorderButton from './AudioRecorderButton'

function BellaConversation() {
  const {t} = useTranslation()
  const botDetail = useAtomValue(bellaBotDetail)
  const setAction = useSetAtom(bellaAction)
  const {conversationId} = useParams<{conversationId?: string}>()
  const history = useHistory()
  const [isTyping, setIsTyping] = useState(false)
  const [currentMessage, setCurrentMessage] = useAtom(currentBellaMessage)
  const [inputValue, setInputValue] = useState('')

  const sourceRef = useRef<AbortController | null>(null)

  const {reset} = useTTS()

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return
    let cid = conversationId
    if (!conversationId) {
      const data = await createConversation()
      console.info('data', data)
      cid = data.id
      history.push(`/bella/${botDetail.id}/${data.id}`)
    }
    reset()

    const message = inputValue.trim()
    setCurrentMessage({
      content: message,
      role: 'user',
    })
    setInputValue('')
    setIsTyping(true)

    // 触发视频动作
    setAction('think')

    const params = {
      invoke_from: 'web-app',
      message,
      bot_id: botDetail.id,
      conversation_id: cid,
      stream: true,
    }

    sourceRef.current = new AbortController()
    let buffer = ''

    try {
      await fetchEventSource(`${WEBUI_API_BASE_URL}/chat/say`, {
        method: 'POST',
        signal: sourceRef.current.signal,
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'text/event-stream',
          authorization: `Bearer ${localStorage.token}`,
        },
        body: JSON.stringify(params),
        onopen: async (res) => {
          if (!res.ok) {
            const cloned = res.clone()
            const {errcode, msg} = await cloned.json()
            if (errcode < 0) {
              Message.error(msg || 'Internal Server Error')
            }
          }
        },
        onmessage: async (event) => {
          const data = JSON.parse(event.data || '{}')
          // 新增：流式内容传递给上层
          if (data.event === 'message') {
            buffer += data.answer || ''
            setCurrentMessage({
              content: buffer,
              role: 'assistant',
            })
            // setAction('optimism')
          }
          if (data.event === 'error') {
            Message.error(data.msg || 'Internal Server Error')
            setIsTyping(false)
            setAction('idle')
          }
        },
        onerror: (err) => {
          console.error('EventSource error:', err)
          Message.error('Connection error')
          setIsTyping(false)
          setAction('idle')
        },
        onclose: () => {
          setIsTyping(false)
        },
        openWhenHidden: true,
      })
    } catch (err) {
      console.error('Failed to send message:', err)
      Message.error('Failed to send message')
      setIsTyping(false)
      setAction('idle')
    }
  }

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 消息显示区域 */}
      <div className="flex-1 flex flex-col justify-end p-6">
        <div className="mb-4 text-center">
          <div
            className={`inline-block bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 max-w-2xl ${
              !currentMessage.content ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div
              className="text-white text-lg font-medium max-h-[200px] overflow-y-auto"
              id="bella-tts-text-container"
            >
              {currentMessage.content
                .replace(/<display>.*?<\/display>/gis, '')
                .split('\n')
                .map((sentence, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <p key={`sentence-${idx}`} id={`bella-tts-${idx}`}>
                    {sentence.trim()}
                  </p>
                ))}
            </div>
          </div>
        </div>

        {/* 输入框 */}
        <div className="mt-4">
          {/* 音频录入按钮 */}
          <AudioRecorderButton
            onResult={(text) => setInputValue((v) => v + text)}
          />
          <div className="flex items-center space-x-4 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('Type your message...')}
                disabled={isTyping}
                className="w-full bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 text-white placeholder-white/60 resize-none border-0 focus:outline-none focus:ring-2 focus:ring-white/30"
                rows={1}
                style={{minHeight: '48px', maxHeight: '120px'}}
              />
            </div>
            <div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 text-white font-medium hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all block"
              >
                {isTyping ? t('Sending...') : t('Send')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BellaConversation
