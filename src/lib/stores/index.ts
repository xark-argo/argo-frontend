import {atom} from 'jotai'

export const WEBUI_NAME = atom('Argo')

export const workspaces = atom([])
export const currentWorkspace = atom({id: 0, name: '', current: false})

export const i18nAtom = atom(undefined)
export const i18nLoading = atom(false)
export const user = atom<SessionUser | undefined>(undefined)

export const chatId = atom('')
export const activeChat = atom<any>({})

export const chats = atom([])
export const tags = atom([])

export const selectedTool = atom()
export const toolRefresh = atom(false)

export const showSidebar = atom(true)
export const showArchivedChats = atom(false)

export const modelList = atom({
  model_list: [],
})
export const selectModelProvider = atom({
  provider: 'ollama',
  custom_name: '',
  label: '',
  credentials: {
    api_key: '',
    base_url: '',
    custom_chat_models: [],
    custom_embedding_models: [],
    support_chat_models: [],
    support_embedding_models: [],
    icon_url: '',
    link_url: '',
    custom_name: '',
    enable: null,
    origin_url: '',
    doc_url: '',
    model_url: '',
  },
})

export const MCPToolsList = atom({
  server_list: [],
})
export const selectMCPTool = atom({
  id: '',
  name: '',
  description: '',
  config_type: '',
  command_type: '',
  json_command: '',
  command: '',
  headers: '',
  env: '',
  url: '',
  enable: false,
  preset: false,
  tools: [],
  install_status: 'not ready',
})

export const knowledgeList = atom({
  collection_info: [],
})

export const selectKnowledge = atom({
  collection_name: '',
  knowledge_name: '',
  description: '',
  embedding_model: '',
  update_at: '',
  similarity_threshold: '',
  top_k: null,
  folder: '',
})

type SessionUser = {
  id: string
  email: string
  name: string
  role: string
  profile_image_url: string
}

export const isLatestVersion = atom(true)
export const updateProgress = atom<any>(undefined)
export const isDownloaded = atom(false)

// artifact展示
export const artifacts = atom({
  type: '',
  content: '',
})

export const planMsg = atom({
  answer: '',
  agent_thoughts: [],
  id: '',
  reporterAnswer: false,
})
export const openPlan = atom(false)
