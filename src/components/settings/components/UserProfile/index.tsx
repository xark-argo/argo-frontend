import {Button, Message} from '@arco-design/web-react'
import {useAtom, useSetAtom} from 'jotai'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useHistory} from 'react-router-dom'

import {LOGO, DEAULT_USER_ICON_SVG} from '~/lib/constants'
import {currentWorkspace, user} from '~/lib/stores'

function UserProfile() {
  const {t} = useTranslation()
  const history = useHistory()
  const [$user] = useAtom(user)
  const [$currentWorkspace] = useAtom(currentWorkspace)
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    role: 'User',
    id: ''
  })

  // 获取用户信息
  useEffect(() => {
    const getUserInfo = () => {
      // 从localStorage获取基本信息
      const email = localStorage.getItem('email') || ''
      const token = localStorage.getItem('token')
      
      // 如果有token，尝试从token中解析用户信息
      if (token) {
        try {
          // 简单的token解析（实际项目中可能需要更复杂的解析）
          const tokenParts = token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            setUserInfo({
              name: payload.name || payload.username || email.split('@')[0] || 'User',
              email: payload.email || email,
              role: payload.role || 'User',
              id: payload.id || payload.sub || 'N/A'
            })
            return
          }
        } catch (error) {
          console.warn('Failed to parse token:', error)
        }
      }
      
      // 回退到localStorage信息
      setUserInfo({
        name: email.split('@')[0] || 'User',
        email: email || 'user@example.com',
        role: 'User',
        id: 'N/A'
      })
    }

    getUserInfo()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    Message.success(t('Logged out successfully'))
    history.replace('/auth')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        {/* 用户信息卡片 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <div 
                dangerouslySetInnerHTML={{ __html: DEAULT_USER_ICON_SVG }}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {userInfo.name}
              </h3>
              <p className="text-sm text-gray-500">
                {userInfo.email}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('Role')}: {userInfo.role}
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <Button
          type="primary"
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700"
        >
          {t('Sign Out')}
        </Button>
        <Button
          onClick={() => {
            // 可以添加编辑个人信息的逻辑
            Message.info(t('Edit profile feature coming soon'))
          }}
        >
          {t('Edit Profile')}
        </Button>
      </div>
    </div>
  )
}

export default UserProfile
