import {atom} from 'jotai'

// BotDetail 接口定义，描述机器人详细信息
export interface IBotDetail {
  id: string
  space_id: string
  name: string
  description: string
  icon: string
  category: string
  status: string
  locked: boolean
  background_img: string
  mode: string
  site?: {
    code: string
  }
  created_at: string
  model_config: unknown
}
export const bellaBotDetail = atom<IBotDetail>()

export const bellaAffection = atom<number>(20)

export const currentBellaMessage = atom<{
  content: string
  role: 'user' | 'assistant'
  is_end: boolean
}>({
  content: '',
  role: 'assistant',
  is_end: false,
})

export const bellaVideoConfig = atom<
  {
    actions: string
    url: string[]
  }[]
>([])

export const bellaTtsConfig = atom<{
  tts_type: string
  tts_params: {
    voice: string
  }
}>({
  tts_type: 'edge_tts',
  tts_params: {
    voice: 'zh-CN-XiaoxiaoNeural',
  },
})
