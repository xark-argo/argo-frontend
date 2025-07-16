import {WEBUI_API_BASE_URL} from '~/lib/constants'
import {apiFetch} from '~/utils/fetch'

export const userSignIn = async (email: string, password: string) => {
  return apiFetch(`/auth/login`, {email, password})
}

// 暂时不需要注册。统一游客登陆
export const userSignUp = async (
  username: string,
  email: string,
  password: string
) => {
  let error = null

  const res = await fetch(`${WEBUI_API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  })
    .then(async (result) => {
      if (!result.ok) throw await result.json()
      return result.json()
    })
    .catch((err) => {
      error = err
      return null
    })

  if (error) {
    throw error
  }

  return res
}
