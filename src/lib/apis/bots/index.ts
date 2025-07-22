import {apiFetch} from '~/utils/fetch'

export const getBotList = async (params) => {
  return apiFetch('/bot/list', params)
}

export const addBot = async (bot: object) => {
  return apiFetch(`/bot/create`, bot)
}

export const updateBot = async (bot: object) => {
  return apiFetch(`/bot/update`, bot)
}

export const deleteBot = async (bot: object) => {
  return apiFetch(`/bot/delete`, bot)
}

export const getBotConfig = async (bodId: string) => {
  return apiFetch(`/bot/${bodId}/get`, undefined, {
    method: 'GET',
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Content-Type': 'application/octet-stream; charset=utf-8',
    },
  })
}
// function getFilenameFromHeaders(headers) {
//   const disposition = headers.get('Content-Disposition')
//   const match = disposition?.match(/filename="?(.+?)"?$/)
//   return match ? match[1] : 'download.file'
// }

export const exportBotInfo = async (bodId: string) => {
  return apiFetch(`/bot/${bodId}/export`, undefined, {
    method: 'GET',
    returnType: 'blob',
  })
  // let error = null

  // const res = await fetch(`${WEBUI_API_BASE_URL}/bot/${bodId}/export`, {
  //   method: 'GET',
  //   headers: {
  //     authorization: `Bearer ${localStorage.token}`,
  //   },
  // })
  //   .then(async (result) => {
  //     if (!result.ok) throw await result.json()
  //     const blob = await result.blob()
  //     return {
  //       blob,
  //       filename: getFilenameFromHeaders(result.headers),
  //     }
  //   })
  //   .catch((err) => {
  //     error = err
  //     return null
  //   })

  // if (error) {
  //   throw error
  // }

  // return res
}

export const updateBotConfig = async (bot: object) => {
  return apiFetch(`/bot/model_config/update`, bot)
}

export const updateKnowledgeConfig = async (knowledge: object) => {
  return apiFetch('/bot/knowledge/update', knowledge)
}

export const getBotPromptTemplate = async (data) => {
  return apiFetch(`/bot/prompt-template?has_context=${data}`, undefined, {
    method: 'GET',
  })
}

export const exportBotDSL = async (bodId: string) => {
  return apiFetch(`/bot/${bodId}/export`, {})
}

export const importBotDSL = async ({files, space_id}) => {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  formData.append('space_id', space_id)

  return apiFetch(`/bot/import`, formData)
  // let error = null

  // const res = await fetch(`${WEBUI_API_BASE_URL}/bot/import`, {
  //   method: 'POST',
  //   headers: {
  //     authorization: `Bearer ${localStorage.token}`,
  //   },
  //   body: formData,
  // })
  //   .then(async (result) => {
  //     if (!result.ok) throw await result.json()
  //     return result.json()
  //   })
  //   .then((json) => {
  //     return json
  //   })
  //   .catch((err) => {
  //     error = err
  //     console.log(err)
  //     return null
  //   })

  // if (error) {
  //   throw error
  // }

  // return res
}

export const installBot = async (bot) => {
  return apiFetch(`/bot/install_bot`, bot)
}

export const getBotShareInfo = async (botId) => {
  return apiFetch(`/bot/${botId}/share`, {}, {method: 'GET'})
}

export const installStatus = async (bot) => {
  return apiFetch(`/bot/bot_status_query`, bot)
}

export const getLive2dLIst = async () => {
  return apiFetch(
    `/files/resources/live2d-models/live2d_models_conf.json`,
    {},
    {method: 'GET'}
  )
}

export const getTTS = async () => {
  return apiFetch('/tts/voices', {})
}

export const getTTSVoice = async (params) => {
  return apiFetch('/tts/tts', params)
}

export const getBalleVideoConfig = async () => {
  return apiFetch(
    '/files/resources/characters/video_config.json',
    {},
    {method: 'GET'}
  )
}
