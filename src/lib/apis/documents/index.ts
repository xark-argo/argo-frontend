import {apiFetch} from '~/utils/fetch'

export const uploadDocument = async ({
  files,
  collection_name,
  description = '',
  bot_id = '',
}) => {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  formData.append('collection_name', collection_name)
  formData.append('description', description)
  formData.append('bot_id', bot_id)
  return apiFetch(`/knowledge/upload_document`, formData)

  // const res = await fetch(`${WEBUI_API_BASE_URL}/knowledge/upload_document`, {
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

export const deleteDocument = async (params) => {
  return apiFetch(`/knowledge/drop_document`, params)
}

export const recoverDocument = async (params) => {
  return apiFetch(`/knowledge/restore_document`, params)
}

export const importDocsByUrl = async (params) => {
  return apiFetch(`/knowledge/upload_url`, params)
}
