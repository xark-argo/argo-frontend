import {atom} from 'jotai'

export const initBotDetail = () => ({
  icon: '',
  name: '',
  description: '',
  model_config: {
    agent_mode: {tools: []},
    prologue: '',
  },
})
export const botDetail = atom<any>({
  icon: '',
  name: '',
  description: '',
  model_config: {
    agent_mode: {tools: []},
    prologue: '',
    model: {name: '', provider: ''},
  },
})

export const selectedKnowledge = atom({id: ''})

// 全局连接存储
export const activeConnections = atom<Map<string, AbortController>>(new Map())

export const live2dModel = atom<any>()
export const currentModel = atom<any>({})

export const chatsLoading = atom('')

export const modelList = atom([])
