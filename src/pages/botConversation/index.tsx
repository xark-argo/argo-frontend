import React, {useEffect, useState, useRef} from 'react'
import {Button, Select, Input, Message, Card, Space, Divider, Typography, Tag} from '@arco-design/web-react'
import {IconRecordStop, IconPlayArrowFill, IconRefresh} from '@arco-design/web-react/icon'
import {useTranslation} from 'react-i18next'
import {useParams, useHistory} from 'react-router-dom'
import {useAtom} from 'jotai'
import {fetchEventSource} from '@microsoft/fetch-event-source'

import {getBotList, getBotConfig} from '~/lib/apis/bots'
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

  // 🔧 会话ID管理 - 动态从服务端获取并保存
  // conversationId1: selectedBot1 的专属会话ID，从第一次对话响应中获取
  // conversationId2: selectedBot2 的专属会话ID，从第一次对话响应中获取
  const [conversationId1, setConversationId1] = useState<string>('')
  const [conversationId2, setConversationId2] = useState<string>('')

  // 🔧 防止连续发送给同一个bot
  const [lastSpeakingBot, setLastSpeakingBot] = useState<string>('')

  // refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const conversationContainerRef = useRef<HTMLDivElement>(null)
  // 🔧 Ref用于解决异步状态闭包问题
  const isConversationActiveRef = useRef<boolean>(false)
  const conversationId1Ref = useRef<string>('')
  const conversationId2Ref = useRef<string>('')
  const lastSpeakingBotRef = useRef<string>('')
  const maxRounds = 100

  // 🔧 Helper函数：更新对话活跃状态（同时更新state和ref）
  const setConversationActiveState = (active: boolean) => {
    const previousState = isConversationActive
    const previousRef = isConversationActiveRef.current
    setIsConversationActive(active)
    isConversationActiveRef.current = active
    console.log('🔄 对话状态更新:', {
      从状态: previousState,
      到状态: active,
      从ref: previousRef,
      到ref: active,
      状态变化: previousState !== active ? '有变化' : '无变化',
      ref变化: previousRef !== active ? '有变化' : '无变化',
      时间戳: Date.now()
    })
  }

  // 🔧 Helper函数：更新会话ID（同时更新state和ref）
  const setConversationId1State = (id: string) => {
    setConversationId1(id)
    conversationId1Ref.current = id
  }

  const setConversationId2State = (id: string) => {
    setConversationId2(id)
    conversationId2Ref.current = id
  }

  // 🔧 Helper函数：更新最后发言bot（同时更新state和ref）
  const setLastSpeakingBotState = (botId: string) => {
    const previousBot = lastSpeakingBotRef.current
    setLastSpeakingBot(botId)
    lastSpeakingBotRef.current = botId
    console.log('🔄 更新最后发言bot:', {
      从: previousBot ? getSelectedBotName(previousBot) : '无',
      到: botId ? getSelectedBotName(botId) : '无',
      previousBotId: previousBot,
      newBotId: botId,
      时间戳: Date.now()
    })
  }

  // 滚动控制状态
  const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(true)

  // 检测是否滚动到底部
  const checkIfAtBottom = () => {
    if (conversationContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = conversationContainerRef.current
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10 // 10px 容差
      setShouldAutoScroll(isAtBottom)
    }
  }

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (conversationEndRef.current && shouldAutoScroll) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 强制滚动到底部（用于停止按钮等操作）
  const forceScrollToBottom = () => {
    if (conversationEndRef.current) {
      setShouldAutoScroll(true)
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 监听对话历史变化，自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory])

  // 监听滚动事件
  useEffect(() => {
    const container = conversationContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkIfAtBottom)
      return () => container.removeEventListener('scroll', checkIfAtBottom)
    }
  }, [])

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



  // 重定向到正确的workspace
  useEffect(() => {
    if ((!spaceId || Number(spaceId) === 0) && $currentWorkspace.id) {
      history.replace(`/space/${$currentWorkspace.id}/bot-conversation`)
    }
  }, [spaceId, $currentWorkspace.id, history])

  // 发送消息到指定bot
  const sendMessageToBot = async (
    botId: string,
    message: string,
    conversationId: string,
    bot1DetailParam?: any,
    bot2DetailParam?: any
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      let buffer = ''
      const controller = new AbortController()
      abortControllerRef.current = controller

      // 🔧 严格检查：防止连续发送给同一个bot
      if (lastSpeakingBotRef.current === botId) {
        const error = new Error(`❌ 不能连续向同一个bot发送消息！上次发言: ${getSelectedBotName(lastSpeakingBotRef.current)}，本次尝试: ${getSelectedBotName(botId)}`)
        console.error('🚨 严重错误 - 违反交替规则:', {
          错误类型: '连续发送给同一bot',
          上次发言bot: getSelectedBotName(lastSpeakingBotRef.current),
          本次尝试bot: getSelectedBotName(botId),
          lastSpeakingBotRef值: lastSpeakingBotRef.current,
          botId值: botId,
          selectedBot1: selectedBot1,
          selectedBot2: selectedBot2,
          应该的交替逻辑: lastSpeakingBotRef.current === selectedBot1 ? `应该选择${getSelectedBotName(selectedBot2)}` : `应该选择${getSelectedBotName(selectedBot1)}`,
          完整错误: error.message
        })
        reject(error)
        return
      }

      // 🔧 验证参数和bot识别逻辑
      const isBot1 = botId === selectedBot1
      const isBot2 = botId === selectedBot2
      
      if (!isBot1 && !isBot2) {
        reject(new Error(`无效的botId: ${botId}`))
        return
      }

      console.log('🚀 开始发送消息:', {
        targetBot: getSelectedBotName(botId),
        lastSpeakingBot: lastSpeakingBotRef.current ? getSelectedBotName(lastSpeakingBotRef.current) : '无',
        conversationId: conversationId || '(首次对话)',
        messageLength: message.length,
        actualConversationIdToAPI: conversationId || '', // 🔧 显示实际传递给API的值
        isFirstTimeForThisBot: !conversationId
      })

      // 🔧 更新发言状态
      setLastSpeakingBotState(botId)

      // 更新bot历史：将收到的消息作为用户消息添加到对应bot的历史中
      if (isBot1) {
        setBot1History(prev => [...prev, {role: 'user', content: message}])
      } else {
        setBot2History(prev => [...prev, {role: 'user', content: message}])
      }

      // 获取bot详细信息
      const botDetail = isBot1 ? 
        (bot1DetailParam || bot1Detail) : 
        (bot2DetailParam || bot2Detail)
      
      if (!botDetail) {
        reject(new Error('Bot详细信息未加载'))
        return
      }

      // 🔧 构建API参数
      const params: any = {
        invoke_from: 'web-app',
        message,
        inputs: botDetail.inputs || {},
        bot_id: botId,
        space_id: spaceId,
        conversation_id: conversationId || '',
        stream: true,
        files: [],
        model_config: botDetail.model_config || {},
      }

      // 验证必需参数
      if (!params.bot_id || !params.space_id || !params.message) {
        reject(new Error('Missing required parameters'))
        return
      }

      console.log('📤 API请求参数:', {
        bot_id: params.bot_id,
        conversation_id: params.conversation_id,
        conversation_id_length: (params.conversation_id || '').length,
        is_empty_conversation_id: !params.conversation_id,
        message_length: params.message.length,
        space_id: params.space_id
      })

      // 先添加空的回复消息到对话历史
      const replyMsg: ConversationMessage = {
        role: 'assistant',
        content: '',
        botId: botId,
        botName: getSelectedBotName(botId),
        timestamp: Date.now()
      }
      setConversationHistory(prev => [...prev, replyMsg])

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
              const errorText = await cloned.text()
              console.error('API错误响应原文:', errorText)
              
              let errorData
              try {
                errorData = JSON.parse(errorText)
                console.error('API错误响应JSON:', errorData)
              } catch (parseError) {
                errorData = { message: errorText }
              }
              
              reject(new Error(errorData.msg || errorData.message || errorText || `HTTP ${res.status}`))
            } catch (parseError) {
              console.error('解析错误响应失败:', parseError)
              reject(new Error(`HTTP ${res.status} - ${res.statusText}`))
            }
          }
        },
        onmessage: (event) => {
          const data = JSON.parse(event.data || '{}')
          
          // 🔧 关键：只在第一次获取会话ID时保存
          if (data.conversation_id) {
            if (isBot1 && !conversationId1Ref.current) {
              console.log('✅ 首次获取Bot1会话ID:', {
                botId,
                botName: getSelectedBotName(botId),
                conversationId: data.conversation_id,
                isFirstTime: true
              })
              setConversationId1State(data.conversation_id)
            } else if (isBot2 && !conversationId2Ref.current) {
              console.log('✅ 首次获取Bot2会话ID:', {
                botId,
                botName: getSelectedBotName(botId), 
                conversationId: data.conversation_id,
                isFirstTime: true
              })
              setConversationId2State(data.conversation_id)
            }
          }
          
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
            console.log('✅ Bot消息完成:', {
              bot: getSelectedBotName(botId),
              responseLength: buffer.length
            })
            
            // 将bot的回复添加到对应的历史中
            if (isBot1) {
              setBot1History(prev => [...prev, {role: 'assistant', content: buffer}])
            } else {
              setBot2History(prev => [...prev, {role: 'assistant', content: buffer}])
            }

            // 🔧 简单返回消息内容，不在这里处理对话继续逻辑
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

  // 🔧 连续对话管理函数
  const startContinuousConversation = async (
    currentBotId: string,
    message: string,
    conversationId: string,
    round: number,
    bot1DetailParam?: any,
    bot2DetailParam?: any
  ) => {
    try {
      // 🔧 入口状态验证
      console.log('🚀 startContinuousConversation 入口状态验证:', {
        当前轮次: round,
        对话状态state: isConversationActive,
        对话状态ref: isConversationActiveRef.current,
        状态是否一致: isConversationActive === isConversationActiveRef.current,
        如果不一致则为问题: isConversationActive !== isConversationActiveRef.current ? '⚠️ 状态不一致！' : '✅ 状态一致'
      })

      console.log('🔄 开始第', round, '轮对话:', {
        currentBot: getSelectedBotName(currentBotId),
        messageLength: message.length,
        conversationId: conversationId || '(将创建)',
        交替验证: {
          当前轮次: round,
          即将发言bot: getSelectedBotName(currentBotId),
          上次发言bot: lastSpeakingBotRef.current ? getSelectedBotName(lastSpeakingBotRef.current) : '无(首次)',
          是否正确交替: !lastSpeakingBotRef.current || lastSpeakingBotRef.current !== currentBotId,
          lastSpeakingBotRef值: lastSpeakingBotRef.current,
          currentBotId值: currentBotId,
          selectedBot1: selectedBot1,
          selectedBot2: selectedBot2
        }
      })

      // 更新当前轮数
      setCurrentRound(round)

      // 更新当前发言者显示
      setCurrentSpeaker(currentBotId === selectedBot1 ? 1 : 2)

      // 发送消息给当前bot
      const response = await sendMessageToBot(
        currentBotId,
        message,
        conversationId,
        bot1DetailParam || bot1Detail,
        bot2DetailParam || bot2Detail
      )

      console.log('✅ 第', round, '轮回复完成:', {
        bot: getSelectedBotName(currentBotId),
        responseLength: response.length
      })

      // 🔧 使用ref获取最新的对话状态，避免闭包问题
      const currentIsActive = isConversationActiveRef.current
      console.log('🔍 检查对话状态:', {
        round,
        maxRounds,
        isActiveFromRef: currentIsActive,
        isActiveFromState: isConversationActive,
        responseLength: response.length
      })

      // 🔧 检查是否应该继续对话
      if (round >= maxRounds) {
        console.log('✅ 对话达到最大轮数')
        Message.success(`对话已完成，共进行了${round}轮对话`)
        setConversationActiveState(false)
        setIsLoading(false)
        return
      }

      if (!currentIsActive) {
        console.log('⏸️ 对话被用户停止 (从ref检查)')
        setIsLoading(false)
        return
      }

      if (!response.trim()) {
        console.log('⚠️ 收到空回复，对话结束')
        setConversationActiveState(false)
        setIsLoading(false)
        return
      }

      // 🔧 准备下一轮对话 - 使用lastSpeakingBotRef确保严格交替
      // 如果当前没有发言记录，默认从Bot2开始
      let nextBotId: string
      if (!lastSpeakingBotRef.current) {
        // 第一轮对话，从Bot2开始
        nextBotId = selectedBot2
        console.log('🎯 首轮对话，选择Bot2开始')
      } else {
        // 后续轮次，严格交替
        nextBotId = lastSpeakingBotRef.current === selectedBot1 ? selectedBot2 : selectedBot1
        console.log('🔄 交替对话，上次发言bot:', {
          lastSpeaker: getSelectedBotName(lastSpeakingBotRef.current),
          nextSpeaker: getSelectedBotName(nextBotId),
          isAlternating: true
        })
      }

      // 🔧 关键：每个bot第一次对话时传空字符串，后续使用自己的会话ID
      const nextConversationId = nextBotId === selectedBot1 
        ? conversationId1Ref.current  // Bot1的会话ID（可能为空）
        : conversationId2Ref.current  // Bot2的会话ID（可能为空）

      console.log('🔄 准备切换到下一个bot:', {
        currentBot: getSelectedBotName(currentBotId),
        lastSpeakingBot: lastSpeakingBotRef.current ? getSelectedBotName(lastSpeakingBotRef.current) : '无',
        nextBot: getSelectedBotName(nextBotId),
        nextRound: round + 1,
        nextConversationId: nextConversationId || '(空-该bot首次对话)',
        conversationIdMapping: {
          bot1Id: selectedBot1,
          bot1ConversationId: conversationId1Ref.current || '(未创建)',
          bot1HasSession: !!conversationId1Ref.current,
          bot2Id: selectedBot2, 
          bot2ConversationId: conversationId2Ref.current || '(未创建)',
          bot2HasSession: !!conversationId2Ref.current,
          nextBotWillUse: nextConversationId || '(空字符串-首次对话)'
        },
        strictAlternatingCheck: {
          lastSpeakingBotFromRef: lastSpeakingBotRef.current,
          nextBotSelected: nextBotId,
          isValidAlternation: lastSpeakingBotRef.current !== nextBotId
        }
      })

      // 延迟1秒后继续下一轮对话
      setTimeout(() => {
        // 🔧 再次检查对话状态，使用ref获取最新值
        const stillActive = isConversationActiveRef.current
        console.log('⏰ 延迟后状态检查:', {
          stillActive,
          nextRound: round + 1,
          nextBot: getSelectedBotName(nextBotId)
        })
        
        if (stillActive) {
          startContinuousConversation(
            nextBotId,
            response, // 🔧 发送完整的回复消息给另一个bot
            nextConversationId || '',
            round + 1,
            bot1DetailParam || bot1Detail,
            bot2DetailParam || bot2Detail
          )
        } else {
          console.log('⏸️ 对话在延迟期间被停止')
        }
      }, 1000)

    } catch (error) {
      console.error('对话失败:', error)
      Message.error(`第${round}轮对话失败: ${error.message}`)
      setConversationActiveState(false)
      setIsLoading(false)
    }
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
      setConversationActiveState(true)
      setCurrentRound(1)
      setConversationHistory([])
      setBot1History([])
      setBot2History([])
      setCurrentSpeaker(2)
      // 🔧 关键：重置会话ID，让服务端在第一次对话时自动创建
      setConversationId1('')
      setConversationId2('')
      // 🔧 重置会话ID ref
      conversationId1Ref.current = ''
      conversationId2Ref.current = ''
      // 🔧 重置发言状态，允许重新开始对话
      setLastSpeakingBotState('')
      // 重置滚动状态
      setShouldAutoScroll(true)

      console.log('🔄 对话状态初始化完成:', {
        isConversationActive,
        isConversationActiveRef: isConversationActiveRef.current,
        conversationId1Ref: conversationId1Ref.current,
        conversationId2Ref: conversationId2Ref.current,
        lastSpeakingBotRef: lastSpeakingBotRef.current
      })

      // 加载两个Bot的详细信息
      console.log('正在加载Bot详细信息...')
      const [detail1, detail2] = await Promise.all([
        loadBotDetail(selectedBot1),
        loadBotDetail(selectedBot2)
      ])
      
      console.log('Bot详细信息加载完成:', {detail1, detail2})

      // 同步设置Bot详细信息，确保在调用sendMessageToBot前已设置
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
      
      // 让Bot2回复开场消息，第一次对话不传会话ID
      console.log('🎯 开始对话流程:', {
        openingMessageFrom: `Bot1(${getSelectedBotName(selectedBot1)})`,
        firstRespondent: `Bot2(${getSelectedBotName(selectedBot2)})`,
        conversationId1: '',  // 第一次为空
        conversationId2: '',  // 第一次为空
        selectedBot1,
        selectedBot2,
        detail1: !!detail1,
        detail2: !!detail2,
        isConversationActive,
        maxRounds
      })
      
      // 强制等待状态更新完成
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 第一次对话，传入空的会话ID，让服务端创建
      // 🔧 启动对话管理流程
      startContinuousConversation(selectedBot2, openingMessage, '', 1, detail1, detail2)
      
      console.log('对话管理流程已启动，等待bot回复...')
      
      // 🔧 第一轮对话启动后，立即设置loading为false，但保持conversation active
      setIsLoading(false)

    } catch (error) {
      console.error('Failed to start conversation:', error)
      Message.error(`启动对话失败: ${error.message}`)
      setConversationActiveState(false)
      setIsLoading(false)
    }
  }

  // 停止对话
  const stopConversation = () => {
    console.log('🛑 停止对话被触发')
    setConversationActiveState(false)
    if (abortControllerRef.current) {
      console.log('🔌 中止当前EventSource连接')
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
    console.log('✅ 对话已停止')
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
    // 🔧 重置会话ID为空，下次对话时将重新从服务端获取
    setConversationId1('')
    setConversationId2('')
    // 🔧 重置会话ID ref
    conversationId1Ref.current = ''
    conversationId2Ref.current = ''
    // 🔧 重置发言状态，允许重新开始对话
    setLastSpeakingBotState('')
    // 重置滚动状态
    setShouldAutoScroll(true)
    console.log('对话已重置，所有状态已清空:', {
      conversationHistoryCleared: true,
      botHistoriesCleared: true,
      botDetailsCleared: true,
      conversationIdsReset: true,
      lastSpeakingBotReset: true,
      conversationActiveRefReset: true,
      scrollStateReset: true
    })
  }

  const getSelectedBotName = (botId: string) => {
    return botList.find(b => b.id === botId)?.name || botId
  }

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50" style={{ minHeight: '100vh' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bot对话实验室</h2>
        <Text type="secondary">让两个Bot进行自主对话，观察它们的交流过程</Text>
      </div>

      {/* 配置区域 */}
      <Card className="mb-6 flex-shrink-0" title="对话配置">
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
        </Space>
      </Card>

      {/* 对话历史区域 */}
      <Card 
        title="对话历史" 
        className="flex-1"
        style={{ 
          minHeight: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}
        bodyStyle={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          <div 
            ref={conversationContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-white"
            style={{ 
              minHeight: '400px',
              maxHeight: '100%',
              scrollBehavior: 'smooth'
            }}
          >
            {conversationHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                暂无对话内容，请配置Bot并开始对话
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className="flex flex-col w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag color={msg.botId === selectedBot1 ? 'blue' : 'orange'}>
                        {msg.botName}
                      </Tag>
                      <Text type="secondary" className="text-xs">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Text>
                    </div>
                    <div 
                      className={`p-3 rounded-lg w-full ${
                        msg.botId === selectedBot1 
                          ? 'bg-blue-50 border-l-4 border-blue-400' 
                          : 'bg-orange-50 border-l-4 border-orange-400'
                      }`}
                      style={{ maxWidth: '100%', wordBreak: 'break-word' }}
                    >
                      <Text className="whitespace-pre-wrap break-words">{msg.content}</Text>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-center py-4">
                    <Text type="secondary">正在生成回复...</Text>
                  </div>
                )}
                {/* 用于自动滚动到底部的标记元素 */}
                <div ref={conversationEndRef} style={{ height: '1px' }} />
              </div>
            )}
          </div>

          {conversationHistory.length > 0 && (
            <div className="border-t p-3 bg-gray-100 flex-shrink-0">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <Text type="secondary" className="flex-shrink-0">
                  对话统计: 总计 {conversationHistory.length} 条消息，已进行 {currentRound} 轮对话
                  {(conversationId1 || conversationId2) && (
                    <span className="ml-2 text-xs text-gray-400 block sm:inline">
                      (会话: {getSelectedBotName(selectedBot1)}→{conversationId1 ? conversationId1.slice(-8) : '待创建'} | {getSelectedBotName(selectedBot2)}→{conversationId2 ? conversationId2.slice(-8) : '待创建'})
                    </span>
                  )}
                </Text>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!shouldAutoScroll && (
                    <Button 
                      size="small" 
                      type="primary" 
                      onClick={forceScrollToBottom}
                    >
                      回到底部
                    </Button>
                  )}
                  <Button
                    size="small"
                    icon={<IconRecordStop />}
                    onClick={stopConversation}
                    disabled={!isConversationActive}
                    status="warning"
                  >
                    停止对话
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default BotConversation 