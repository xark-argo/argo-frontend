import {Message} from '@arco-design/web-react'
import {fetchEventSource} from '@microsoft/fetch-event-source'
import {useAtom, useAtomValue} from 'jotai'
import React, {useMemo, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useHistory, useParams} from 'react-router-dom'

import {createConversation} from '~/lib/apis/conversations'
import {WEBUI_API_BASE_URL} from '~/lib/constants'

import {bellaBotDetail, currentBellaMessage} from '../atoms'
import useTTS from '../hooks/useTTS'
// import AudioRecorderButton from './AudioRecorderButton'

function BellaConversation() {
  useTTS()
  const {t} = useTranslation()
  const botDetail = useAtomValue(bellaBotDetail)

  const {conversationId} = useParams<{conversationId?: string}>()
  const history = useHistory()
  const [isTyping, setIsTyping] = useState(false)
  const [currentMessage, setCurrentMessage] = useAtom(currentBellaMessage)
  const [inputValue, setInputValue] = useState('')
  const [showMessage, setShowMessage] = useState(false)

  const sourceRef = useRef<AbortController | null>(null)

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    // 重置消息容器样式，确保新消息能正常显示
    // const messageContainer = document.getElementById('bella-message-container')
    // if (messageContainer) {
    //   messageContainer.classList.remove('fade-out', 'hidden')
    //   messageContainer.style.opacity = '1'
    // }

    // 立即显示用户输入
    const message = inputValue.trim()
    setCurrentMessage({
      content: message,
      role: 'user',
      is_end: true,
    })
    setShowMessage(true)
    setInputValue('')
    setIsTyping(true)

    let cid = conversationId
    if (!conversationId) {
      const data = await createConversation()
      console.info('data', data)
      cid = data.id
      history.push(`/bella/${botDetail.id}/${data.id}`)
    }

    const params = {
      invoke_from: 'web-app',
      message,
      bot_id: botDetail.id,
      conversation_id: cid,
      stream: true,
    }

    sourceRef.current = new AbortController()

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
        onopen: async res => {
          if (!res.ok) {
            const cloned = res.clone()
            const {errcode, msg} = await cloned.json()
            if (errcode < 0) {
              Message.error(msg || 'Internal Server Error')
            }
          }
        },
        onmessage: async event => {
          const data = JSON.parse(event.data || '{}')
          const answer = data.answer || ''
          // 流式内容传递给上层
          if (data.event === 'message') {
            setCurrentMessage(c => {
              const nextContent =
                c.role === 'user' ? answer : c.content + answer
              return {role: 'assistant', content: nextContent, is_end: false}
            })
            setShowMessage(true)
          }
          // 流式对话结束，设置延迟隐藏
          if (data.event === 'message_end') {
            console.info('流式对话结束，设置延迟隐藏')
            setCurrentMessage(c => ({...c, is_end: true}))
          }
          if (data.event === 'error') {
            Message.error(data.msg || 'Internal Server Error')
            setIsTyping(false)
            setShowMessage(false)
            setCurrentMessage(c => ({...c, is_end: true}))
          }
        },
        onerror: err => {
          console.error('EventSource error:', err)
          Message.error('Connection error')
          setIsTyping(false)
          setShowMessage(false)
          setCurrentMessage(c => ({...c, is_end: true}))
        },
        onclose: () => {
          console.info('流式连接关闭')
          setIsTyping(false)

          setCurrentMessage(c => ({...c, is_end: true}))
        },
        openWhenHidden: true,
      })
    } catch (err) {
      console.error('Failed to send message:', err)
      Message.error('Failed to send message')
      setIsTyping(false)
      setShowMessage(false)
      setCurrentMessage(c => ({...c, is_end: true}))
    }
  }

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const renderMessageContent = useMemo(() => {
    return currentMessage.content
      .replace(/<display>.*?<\/display>/gis, '')
      .split('\n')
      .map((sentence, idx) => (
        <p
          // eslint-disable-next-line react/no-array-index-key
          key={`sentence-${idx}`}
          id={`bella-tts-${idx}`}
          className="text-left">
          {sentence}
        </p>
      ))
  }, [currentMessage.content])

  return (
    <div className="flex flex-col h-full">
      {/* 消息显示区域 */}
      <div className="flex-1 flex flex-col justify-end p-6">
        {showMessage && currentMessage.content && (
          <div
            className="mb-4 text-center transition-opacity duration-300"
            id="bella-message-container">
            <div className="inline-block bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 max-w-2xl">
              <div
                className="text-white text-lg font-medium max-h-[200px] overflow-y-auto"
                id="bella-tts-text-container">
                {renderMessageContent}
              </div>
            </div>
          </div>
        )}

        {/* 输入框 */}
        <div className="mt-4">
          {/* 音频录入按钮 */}
          {/* <AudioRecorderButton
            onResult={(text) => setInputValue((v) => v + text)}
          /> */}
          <div className="flex items-center space-x-4 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
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
                className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 text-white font-medium hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all block">
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
