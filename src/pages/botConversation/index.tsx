import React, {useEffect, useState, useRef} from 'react'
import {Button, Select, Input, Message, Card, Space, Divider, Typography, Tag} from '@arco-design/web-react'
import {IconRecordStop, IconPlayArrowFill, IconRefresh} from '@arco-design/web-react/icon'
import {useTranslation} from 'react-i18next'
import {useParams, useHistory} from 'react-router-dom'
import {useAtom} from 'jotai'
import {fetchEventSource} from '@microsoft/fetch-event-source'

import {getBotList, getBotConfig} from '~/lib/apis/bots'
import {createConversation} from '~/lib/apis/conversations'
import {WEBUI_API_BASE_URL} from '~/lib/constants'
import {currentWorkspace} from '~/lib/stores'

const {Title, Text} = Typography
const {Option} = Select
const {TextArea} = Input

interface Bot {
  id: string
  name: string
  description?: string
  icon?: string
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  botId: string
  botName: string
  timestamp: number
}

function BotConversation() {
  const {t} = useTranslation()
  const {spaceId} = useParams<{spaceId: string}>()
  const history = useHistory()
  const [$currentWorkspace] = useAtom(currentWorkspace)

  // 状态管理
  const [botList, setBotList] = useState<Bot[]>([])
  const [selectedBot1, setSelectedBot1] = useState<string>('')
  const [selectedBot2, setSelectedBot2] = useState<string>('')
  const [bot1Detail, setBot1Detail] = useState<any>(null)
  const [bot2Detail, setBot2Detail] = useState<any>(null)
  const [openingMessage, setOpeningMessage] = useState<string>('')
  const [isConversationActive, setIsConversationActive] = useState<boolean>(false)
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  const [currentRound, setCurrentRound] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<1 | 2>(1)

  // 对话历史存储 - 为每个bot维护独立的历史
  const [bot1History, setBot1History] = useState<Array<{role: string, content: string}>>([])
  const [bot2History, setBot2History] = useState<Array<{role: string, content: string}>>([])

  // 对话ID
  const [conversationId1, setConversationId1] = useState<string>('')
  const [conversationId2, setConversationId2] = useState<string>('')

  // refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const maxRounds = 100

  // 获取bot列表
  useEffect(() => {
    const loadBotList = async () => {
      try {
        if (!spaceId) return
        const response = await getBotList({space_id: spaceId})
        setBotList(response.bots || [])
      } catch (error) {
        console.error('Failed to load bot list:', error)
        Message.error('加载Bot列表失败')
      }
    }

    loadBotList()
  }, [spaceId])

  // 获取Bot详细信息
  const loadBotDetail = async (botId: string): Promise<any> => {
    try {
      console.log('开始加载Bot详细信息:', botId)
      const detail = await getBotConfig(botId)
      console.log('Bot详细信息加载成功:', {botId, hasDetail: !!detail})
      return detail
    } catch (error) {
      console.error('Failed to load bot detail:', error)
      throw error
    }
  }

  // 测试API调用函数
  const testApiCall = async () => {
    console.log('=== 测试API调用 ===')
    
    if (!selectedBot1 || !selectedBot2) {
      Message.error('请先选择两个Bot')
      return
    }
    
    try {
      // 先获取Bot详细信息
      console.log('1. 获取Bot详细信息...')
      const detail1 = await loadBotDetail(selectedBot1)
      const detail2 = await loadBotDetail(selectedBot2)
      
      // 创建对话
      console.log('2. 创建对话...')
      const cid = await createNewConversation()
      
      // 构造完整的API参数
      const params = {
        invoke_from: 'web-app',
        message: '你好，这是一个测试消息',
        inputs: detail2.inputs || {},
        bot_id: selectedBot2,
        space_id: spaceId,
        conversation_id: cid,
        stream: true,
        files: [], // 添加缺失的files参数
        model_config: detail2.model_config || {},
      }
      
      console.log('3. 调用API参数:', params)
      
      // 使用fetchEventSource测试流式API
      fetchEventSource(`${WEBUI_API_BASE_URL}/chat/say`, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'text/event-stream',
          authorization: `Bearer ${localStorage.token}`,
        },
        body: JSON.stringify(params),
        onopen: async (res) => {
          console.log('✅ API连接成功:', {status: res.status, ok: res.ok})
          if (!res.ok) {
            const errorData = await res.clone().json()
            console.error('❌ API错误:', errorData)
          }
        },
        onmessage: (event) => {
          const data = JSON.parse(event.data || '{}')
          console.log('📨 收到消息:', data)
        },
        onerror: (err) => {
          console.error('❌ 连接错误:', err)
        },
        onclose: () => {
          console.log('🔚 连接关闭')
        }
      })
      
    } catch (error) {
      console.error('❌ 测试失败:', error)
      Message.error(`测试失败: ${error.message}`)
    }
  }

  // 重定向到正确的workspace
  useEffect(() => {
    if ((!spaceId || Number(spaceId) === 0) && $currentWorkspace.id) {
      history.replace(`/space/${$currentWorkspace.id}/bot-conversation`)
    }
  }, [spaceId, $currentWorkspace.id, history])

  // 创建对话
  const createNewConversation = async (): Promise<string> => {
    try {
      const response = await createConversation()
      return response.id
    } catch (error) {
      console.error('Failed to create conversation:', error)
      throw error
    }
  }

  // 发送消息到指定bot
  const sendMessageToBot = async (
    botId: string,
    message: string,
    conversationId: string,
    isBot1: boolean,
    bot1DetailParam?: any,
    bot2DetailParam?: any
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      let buffer = ''
      const controller = new AbortController()
      abortControllerRef.current = controller

      // 更新bot历史：将收到的消息作为用户消息添加到对应bot的历史中
      if (isBot1) {
        setBot1History(prev => [...prev, {role: 'user', content: message}])
      } else {
        setBot2History(prev => [...prev, {role: 'user', content: message}])
      }

      // 获取bot详细信息，优先使用传递的参数
      const botDetail = isBot1 ? 
        (bot1DetailParam || bot1Detail) : 
        (bot2DetailParam || bot2Detail)
      
      console.log('sendMessageToBot - Bot详细信息检查:', {
        botId,
        isBot1,
        bot1Detail: !!(bot1DetailParam || bot1Detail),
        bot2Detail: !!(bot2DetailParam || bot2Detail),
        selectedBotDetail: !!botDetail
      })
      
      if (!botDetail) {
        console.error('Bot详细信息未加载:', {
          botId, 
          isBot1, 
          bot1DetailParam: !!bot1DetailParam,
          bot2DetailParam: !!bot2DetailParam,
          bot1Detail: !!bot1Detail, 
          bot2Detail: !!bot2Detail
        })
        reject(new Error('Bot详细信息未加载'))
        return
      }

      const params = {
        invoke_from: 'web-app',
        message,
        inputs: botDetail.inputs || {},
        bot_id: botId,
        space_id: spaceId,
        conversation_id: conversationId,
        stream: true,
        files: [], // 添加缺失的files参数
        model_config: botDetail.model_config || {},
      }

      console.log('=== 准备调用say接口 ===')
      console.log('API URL:', `${WEBUI_API_BASE_URL}/chat/say`)
      console.log('请求参数:', {
        botId,
        message: message.substring(0, 100) + '...',
        conversationId,
        isBot1,
        params: {
          ...params,
          model_config: params.model_config ? 'exists' : 'missing'
        }
      })

      console.log('=== 开始调用fetchEventSource ===')
      fetchEventSource(`${WEBUI_API_BASE_URL}/chat/say`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'text/event-stream',
          authorization: `Bearer ${localStorage.token}`,
        },
        body: JSON.stringify(params),
        onopen: async (res) => {
          console.log('EventSource连接状态:', {status: res.status, ok: res.ok})
          if (!res.ok) {
            try {
              const cloned = res.clone()
              const errorData = await cloned.json()
              console.error('API错误响应:', errorData)
              reject(new Error(errorData.msg || errorData.message || `HTTP ${res.status}`))
            } catch (parseError) {
              console.error('解析错误响应失败:', parseError)
              reject(new Error(`HTTP ${res.status} - ${res.statusText}`))
            }
          }
        },
        onmessage: (event) => {
          const data = JSON.parse(event.data || '{}')
          console.log('收到Bot消息:', {botId, event: data.event, data})
          
          if (data.event === 'message') {
            buffer += data.answer || ''
            // 实时更新最后一条消息
            setConversationHistory(prev => {
              const newHistory = [...prev]
              const lastMessage = newHistory[newHistory.length - 1]
              if (lastMessage && lastMessage.botId === botId) {
                lastMessage.content = buffer
              }
              return newHistory
            })
          }
          if (data.event === 'message_end') {
            console.log('Bot消息结束:', {botId, buffer})
            // 将bot的回复添加到对应的历史中
            if (isBot1) {
              setBot1History(prev => [...prev, {role: 'assistant', content: buffer}])
            } else {
              setBot2History(prev => [...prev, {role: 'assistant', content: buffer}])
            }
            resolve(buffer)
          }
          if (data.event === 'error') {
            console.error('Bot响应错误:', data)
            reject(new Error(data.msg || data.message || 'Internal Server Error'))
          }
        },
        onerror: (err) => {
          console.error('EventSource error:', err)
          reject(new Error('Connection error'))
        },
        onclose: () => {
          console.log('EventSource connection closed')
        }
      })
    })
  }

  // 开始对话
  const startConversation = async () => {
    console.log('=== 开始对话 - 入口点 ===')
    console.log('当前状态:', {
      selectedBot1,
      selectedBot2,
      openingMessage: openingMessage.substring(0, 50) + '...',
      spaceId,
      token: !!localStorage.token
    })

    if (!selectedBot1 || !selectedBot2 || !openingMessage.trim()) {
      Message.error('请选择两个Bot并输入开场对话')
      return
    }

    if (selectedBot1 === selectedBot2) {
      Message.error('请选择两个不同的Bot')
      return
    }

    try {
      setIsLoading(true)
      setIsConversationActive(true)
      setCurrentRound(1)
      setConversationHistory([])
      setBot1History([])
      setBot2History([])
      setCurrentSpeaker(2)

      // 加载两个Bot的详细信息
      console.log('正在加载Bot详细信息...')
      const [detail1, detail2] = await Promise.all([
        loadBotDetail(selectedBot1),
        loadBotDetail(selectedBot2)
      ])
      
      console.log('Bot详细信息加载完成:', {detail1, detail2})

      // 为两个bot创建独立的对话
      const cid1 = await createNewConversation()
      const cid2 = await createNewConversation()
      setConversationId1(cid1)
      setConversationId2(cid2)
      console.log('创建对话完成:', {cid1, cid2})

      // 同步设置Bot详细信息，确保在调用sendMessageAndContinue前已设置
      setBot1Detail(detail1)
      setBot2Detail(detail2)
      
      // 等待一个微任务周期，确保状态更新完成
      await new Promise(resolve => setTimeout(resolve, 0))

      // 显示开场消息（来自Bot1）
      const openingMsg: ConversationMessage = {
        role: 'user',
        content: openingMessage,
        botId: selectedBot1,
        botName: botList.find(b => b.id === selectedBot1)?.name || 'Bot 1',
        timestamp: Date.now()
      }

      setConversationHistory([openingMsg])
      
      // 直接让Bot2回复开场消息
      console.log('开始Bot2回复...')
      console.log('调用sendMessageAndContinue前的状态检查:', {
        openingMessage: !!openingMessage,
        selectedBot2: !!selectedBot2,
        cid2: !!cid2,
        detail1: !!detail1,
        detail2: !!detail2,
        isConversationActive,
        maxRounds
      })
      
      // 强制等待状态更新完成
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await sendMessageAndContinue(openingMessage, selectedBot2, cid2, 1, detail1, detail2, true)
      console.log('sendMessageAndContinue调用完成')
      
      // 第一轮对话开始后，设置loading为false
      setIsLoading(false)

    } catch (error) {
      console.error('Failed to start conversation:', error)
      Message.error(`启动对话失败: ${error.message}`)
      setIsConversationActive(false)
      setIsLoading(false)
    }
  }

  // 发送消息并继续对话
  const sendMessageAndContinue = async (
    message: string,
    targetBotId: string,
    targetConversationId: string,
    round: number,
    bot1DetailParam?: any,
    bot2DetailParam?: any,
    forceActive?: boolean
  ) => {
    console.log('=== sendMessageAndContinue 开始执行 ===')
    console.log('调用参数:', {
      round, 
      maxRounds, 
      isConversationActive, 
      targetBotId, 
      messageLength: message.length,
      conversationId: targetConversationId,
      hasBot1Detail: !!bot1DetailParam,
      hasBot2Detail: !!bot2DetailParam,
      forceActive
    })
    
    if (round > maxRounds) {
      console.log('对话达到最大轮数结束:', {round, maxRounds})
      setIsConversationActive(false)
      setIsLoading(false)
      Message.success(`对话已完成，共进行了${round - 1}轮对话`)
      return
    }
    
    const shouldContinue = forceActive !== undefined ? forceActive : isConversationActive
    if (!shouldContinue) {
      console.log('对话已被停止:', {round, isConversationActive, forceActive, shouldContinue})
      setIsLoading(false)
      return
    }

    try {
      const targetBotName = botList.find(b => b.id === targetBotId)?.name || 
        (targetBotId === selectedBot1 ? 'Bot 1' : 'Bot 2')

      // 先添加空的回复消息到对话历史
      const replyMsg: ConversationMessage = {
        role: 'assistant',
        content: '',
        botId: targetBotId,
        botName: targetBotName,
        timestamp: Date.now()
      }
      setConversationHistory(prev => [...prev, replyMsg])

      // 发送消息到目标bot，传递Bot详细信息
      console.log('=== 准备调用sendMessageToBot ===')
      const response = await sendMessageToBot(
        targetBotId, 
        message, 
        targetConversationId, 
        targetBotId === selectedBot1,
        bot1DetailParam || bot1Detail,
        bot2DetailParam || bot2Detail
      )
      console.log('=== sendMessageToBot 完成，收到回复 ===', {
        responseLength: response?.length || 0,
        responsePreview: response?.substring(0, 100) + '...'
      })
      
      // 更新当前轮数
      setCurrentRound(round)

              // 延迟后切换到另一个bot继续对话
        setTimeout(() => {
          const shouldContinue = forceActive !== undefined ? forceActive : isConversationActive
          if (shouldContinue && response.trim()) {
            const nextBotId = targetBotId === selectedBot1 ? selectedBot2 : selectedBot1
            const nextConversationId = targetBotId === selectedBot1 ? conversationId2 : conversationId1
            
            // 更新当前发言者
            setCurrentSpeaker(nextBotId === selectedBot1 ? 1 : 2)
            
            // 继续下一轮对话
            sendMessageAndContinue(
              response, 
              nextBotId, 
              nextConversationId, 
              round + 1,
              bot1DetailParam || bot1Detail,
              bot2DetailParam || bot2Detail,
              shouldContinue // 传递当前的活跃状态
            )
          } else {
            console.log('对话被中断:', {shouldContinue, responseLength: response?.length || 0, forceActive, isConversationActive})
          }
        }, 1000) // 1秒延迟

    } catch (error) {
      console.error('Conversation error:', error)
      Message.error(`第${round}轮对话失败: ${error.message}`)
      setIsConversationActive(false)
      setIsLoading(false)
    }
  }

  // 停止对话
  const stopConversation = () => {
    setIsConversationActive(false)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
  }

  // 重置对话
  const resetConversation = () => {
    stopConversation()
    setConversationHistory([])
    setBot1History([])
    setBot2History([])
    setBot1Detail(null)
    setBot2Detail(null)
    setCurrentRound(0)
    setOpeningMessage('')
    setCurrentSpeaker(1)
    setConversationId1('')
    setConversationId2('')
  }

  const getSelectedBotName = (botId: string) => {
    return botList.find(b => b.id === botId)?.name || botId
  }

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bot对话实验室</h2>
        <Text type="secondary">让两个Bot进行自主对话，观察它们的交流过程</Text>
      </div>

      {/* 配置区域 */}
      <Card className="mb-6" title="对话配置">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <Text>选择第一个Bot:</Text>
            <Select
              placeholder="请选择Bot 1"
              style={{width: '100%'}}
              value={selectedBot1}
              onChange={setSelectedBot1}
              disabled={isConversationActive}
            >
              {botList.map(bot => (
                <Option key={bot.id} value={bot.id}>
                  {bot.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <Text>选择第二个Bot:</Text>
            <Select
              placeholder="请选择Bot 2"
              style={{width: '100%'}}
              value={selectedBot2}
              onChange={setSelectedBot2}
              disabled={isConversationActive}
            >
              {botList.map(bot => (
                <Option key={bot.id} value={bot.id} disabled={bot.id === selectedBot1}>
                  {bot.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <Text>对话轮数: {currentRound} / {maxRounds}</Text>
            <div className="mt-2">
              {isConversationActive ? (
                <Tag color="green">对话进行中</Tag>
              ) : (
                <Tag color="gray">对话未开始</Tag>
              )}
              {currentSpeaker === 1 && isConversationActive && (
                <Tag color="blue" className="ml-2">
                  {getSelectedBotName(selectedBot1)} 发言中
                </Tag>
              )}
              {currentSpeaker === 2 && isConversationActive && (
                <Tag color="orange" className="ml-2">
                  {getSelectedBotName(selectedBot2)} 发言中
                </Tag>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Text>开场对话 (作为第一个Bot的首条消息):</Text>
          <TextArea
            placeholder="请输入开场对话内容..."
            value={openingMessage}
            onChange={setOpeningMessage}
            disabled={isConversationActive}
            rows={3}
            maxLength={500}
            showWordLimit
          />
        </div>

        <Space>
          <Button
            type="primary"
            icon={<IconPlayArrowFill />}
            onClick={startConversation}
            loading={isLoading}
            disabled={isConversationActive || !selectedBot1 || !selectedBot2 || !openingMessage.trim()}
          >
            开始对话
          </Button>

          <Button
            icon={<IconRecordStop />}
            onClick={stopConversation}
            disabled={!isConversationActive}
          >
            停止对话
          </Button>

          <Button
            icon={<IconRefresh />}
            onClick={resetConversation}
          >
            重置
          </Button>

          <Button
            onClick={testApiCall}
            disabled={!selectedBot1 || !spaceId}
          >
            测试API
          </Button>
        </Space>
      </Card>

      {/* 对话历史区域 */}
      <Card title="对话历史" className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto max-h-96 border rounded p-4 bg-white">
          {conversationHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无对话内容，请配置Bot并开始对话
            </div>
          ) : (
            <div className="space-y-4">
              {conversationHistory.map((msg, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag color={msg.botId === selectedBot1 ? 'blue' : 'orange'}>
                      {msg.botName}
                    </Tag>
                    <Text type="secondary" className="text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Text>
                  </div>
                  <div 
                    className={`p-3 rounded-lg max-w-4xl ${
                      msg.botId === selectedBot1 
                        ? 'bg-blue-50 border-l-4 border-blue-400' 
                        : 'bg-orange-50 border-l-4 border-orange-400'
                    }`}
                  >
                    <Text className="whitespace-pre-wrap">{msg.content}</Text>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-center py-4">
                  <Text type="secondary">正在生成回复...</Text>
                </div>
              )}
            </div>
          )}
        </div>

        {conversationHistory.length > 0 && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <Text type="secondary">
              对话统计: 总计 {conversationHistory.length} 条消息，已进行 {currentRound} 轮对话
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
}

export default BotConversation 