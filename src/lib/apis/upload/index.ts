import {apiFetch} from '~/utils/fetch'

export const uploadFile = async (file: File) => {
  // const error = null

  const formData = new FormData()
  formData.append('file_path', file)

  return apiFetch('/file/upload', formData)
}

export const uploadFiles = async (files: File[]) => {
  // const error = null

  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  return apiFetch('/file/upload_multiple', formData)
}
