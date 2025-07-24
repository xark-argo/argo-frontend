import {Message} from '@arco-design/web-react'
import {fetchEventSource} from '@microsoft/fetch-event-source'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useHistory, useParams} from 'react-router-dom'

import {createConversation} from '~/lib/apis/conversations'
import {WEBUI_API_BASE_URL} from '~/lib/constants'

import {bellaAction, bellaBotDetail, currentBellaMessage} from '../atoms'
import useTTS from '../hooks/useTTS'
// import AudioRecorderButton from './AudioRecorderButton'

function BellaConversation() {
  const {t} = useTranslation()
  const botDetail = useAtomValue(bellaBotDetail)
  const setAction = useSetAtom(bellaAction)
  const {conversationId} = useParams<{conversationId?: string}>()
  const history = useHistory()
  const [isTyping, setIsTyping] = useState(false)
  const [currentMessage, setCurrentMessage] = useAtom(currentBellaMessage)
  const [inputValue, setInputValue] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null)
  const shouldHideMessageRef = useRef(false)
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const sourceRef = useRef<AbortController | null>(null)

  const {reset, isPlayingAudio, isAllAudioFinished} = useTTS()

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return
    
    // 清除之前的隐藏定时器
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      setHideTimeout(null)
    }
    
    // 重置隐藏标志
    shouldHideMessageRef.current = false
    
    // 重置消息容器样式，确保新消息能正常显示
    const messageContainer = document.getElementById('bella-message-container')
    if (messageContainer) {
      messageContainer.classList.remove('fade-out', 'hidden')
      messageContainer.style.opacity = '1'
    }
    
    // 立即显示用户输入
    const message = inputValue.trim()
    setCurrentMessage({
      content: message,
      role: 'user',
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
    reset()

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
            setShowMessage(true)
            // setAction('optimism')
          }
          if (data.event === 'error') {
            Message.error(data.msg || 'Internal Server Error')
            setIsTyping(false)
            setAction('idle')
            setShowMessage(false)
            setCurrentMessage({
              content: '',
              role: 'assistant',
            })
            shouldHideMessageRef.current = false
          }
        },
        onerror: (err) => {
          console.error('EventSource error:', err)
          Message.error('Connection error')
          setIsTyping(false)
          setAction('idle')
          setShowMessage(false)
          setCurrentMessage({
            content: '',
            role: 'assistant',
          })
          shouldHideMessageRef.current = false
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
      setShowMessage(false)
      setCurrentMessage({
        content: '',
        role: 'assistant',
      })
      shouldHideMessageRef.current = false
    }
  }

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }



  // 简化：只使用定期检查，移除复杂的 useEffect 逻辑
  useEffect(() => {
    // 当有消息内容时，启动定期检查
    if (currentMessage.content && currentMessage.role === 'assistant') {
      // 清除之前的定时器
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
      }
      
      statusCheckIntervalRef.current = setInterval(() => {
        console.log('=== 定期检查状态 ===')
        console.log('isPlayingAudio:', isPlayingAudio)
        console.log('isAllAudioFinished():', isAllAudioFinished())
        console.log('shouldHideMessageRef.current:', shouldHideMessageRef.current)
        console.log('currentMessage.content:', currentMessage.content)
        console.log('currentMessage.role:', currentMessage.role)
        console.log('showMessage:', showMessage)
        
        // 检查所有条件
        const notPlaying = !isPlayingAudio
        const allFinished = isAllAudioFinished()
        const notAlreadyHiding = !shouldHideMessageRef.current
        const hasContent = currentMessage.content && currentMessage.role === 'assistant'
        
        console.log('条件检查:')
        console.log('- 不在播放状态:', notPlaying)
        console.log('- 所有音频播放完成:', allFinished)
        console.log('- 未在隐藏中:', notAlreadyHiding)
        console.log('- 有消息内容:', hasContent)
        
        // 如果播放停止且所有音频都播放完成，触发隐藏逻辑
        if (notPlaying && allFinished && notAlreadyHiding && hasContent) {
          console.log('定期检查触发隐藏逻辑')
          shouldHideMessageRef.current = true
          const timer = setTimeout(() => {
            console.log('开始执行隐藏逻辑')
            const messageContainer = document.getElementById('bella-message-container')
            console.log('找到消息容器:', !!messageContainer)
            if (messageContainer) {
              messageContainer.classList.add('fade-out')
              messageContainer.addEventListener(
                'transitionend',
                () => {
                  console.log('淡出动画完成，隐藏消息')
                  messageContainer.classList.add('hidden')
                  setShowMessage(false)
                  setCurrentMessage({
                    content: '',
                    role: 'assistant',
                  })
                  shouldHideMessageRef.current = false
                },
                {once: true}
              )
              messageContainer.style.opacity = '0'
            } else {
              console.log('未找到消息容器，直接隐藏')
              setShowMessage(false)
              setCurrentMessage({
                content: '',
                role: 'assistant',
              })
              shouldHideMessageRef.current = false
            }
          }, 2000)
          setHideTimeout(timer)
        } else {
          console.log('条件不满足，不触发隐藏逻辑')
          // 测试：如果音频播放完成但其他条件不满足，尝试强制隐藏
          if (notPlaying && allFinished && hasContent) {
            console.log('测试：音频播放完成，尝试强制隐藏')
            console.log('shouldHideMessageRef.current:', shouldHideMessageRef.current)
            // 如果已经在隐藏中，重置状态
            if (shouldHideMessageRef.current) {
              console.log('重置隐藏状态')
              shouldHideMessageRef.current = false
            }
          }
        }
      }, 500) // 每500ms检查一次
    } else {
      // 停止定期检查
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
        statusCheckIntervalRef.current = null
      }
    }

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
        statusCheckIntervalRef.current = null
      }
    }
  }, [currentMessage.content, currentMessage.role, isPlayingAudio])



  return (
    <div className="flex flex-col h-full">
      {/* 消息显示区域 */}
      <div className="flex-1 flex flex-col justify-end p-6">
        {showMessage && currentMessage.content && (
          <div 
            className="mb-4 text-center transition-opacity duration-300"
            id="bella-message-container"
          >
            <div className="inline-block bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 max-w-2xl">
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
