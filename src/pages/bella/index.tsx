import {useCallback, useEffect} from 'react'
import {useParams} from 'react-router-dom'

import {getConversationDetail} from '~/lib/apis/conversations'

import AffectionMeter from './components/AffectionMeter'
import BellaConversation from './components/BellaConversation'
import BellaVideoBackground from './components/BellaVideoBackground'
import {useAuth} from './hooks'

function Bella() {
  const {botId, conversationId} = useParams<{
    botId: string
    conversationId?: string
  }>()

  const {authenticated} = useAuth()

  // 初始化会话
  const initConversation = useCallback(async () => {
    if (!botId) return

    try {
      if (conversationId) {
        // 如果有会话ID，获取现有会话
        const data = await getConversationDetail({
          conversation_id: conversationId,
          limit: 1,
        })
        console.info('data', data)
      } else {
        // TODO: 创建新会话
      }
    } catch (err) {
      console.error('Failed to init conversation:', err)
    }
  }, [botId, conversationId])

  useEffect(() => {
    initConversation()
  }, [initConversation])

  if (!authenticated) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
      {/* 视频背景 */}
      <BellaVideoBackground />

      {/* 对话界面 */}
      <div className="absolute inset-0 flex flex-col">
        <BellaConversation />
      </div>

      {/* 好感度显示 */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <AffectionMeter />
      </div>
    </div>
  )
}

export default Bella
