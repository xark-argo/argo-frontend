import {useSetAtom} from 'jotai'
import {useCallback, useEffect, useState} from 'react'
import {useParams} from 'react-router-dom'

import {userGuestLogin} from '~/lib/apis/auths'
import {getBotConfig} from '~/lib/apis/bots'

import {bellaBotDetail} from '../atoms'

export const useAuth = () => {
  const {botId} = useParams<{botId: string}>()
  const [authenticated, setAuthenticated] = useState(false)
  const setBotDetail = useSetAtom(bellaBotDetail)
  const handleAuth = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!botId) {
      throw new Error('botId is required')
    }
    const botDetail = await getBotConfig(botId)
    setBotDetail(botDetail)
    if (token) {
      setAuthenticated(true)
    } else if (botDetail.site?.code) {
      const res = await userGuestLogin(botDetail.site.code)
      if (res.token) {
        localStorage.setItem('token', res.token)
        setAuthenticated(true)
      } else {
        setAuthenticated(false)
      }
    } else {
      setAuthenticated(false)
    }
  }, [botId, setBotDetail])
  useEffect(() => {
    handleAuth()
  }, [handleAuth])

  return {authenticated}
}
