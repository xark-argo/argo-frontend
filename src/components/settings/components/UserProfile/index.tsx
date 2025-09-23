import {Button, Message} from '@arco-design/web-react'
import {useAtom} from 'jotai'
import React from 'react'
import {useTranslation} from 'react-i18next'
import {useHistory} from 'react-router-dom'

import {LOGO} from '~/lib/constants'
import {currentWorkspace, user} from '~/lib/stores'

function UserProfile() {
  const {t} = useTranslation()
  const history = useHistory()
  const [$user] = useAtom(user)
  const [$currentWorkspace] = useAtom(currentWorkspace)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    Message.success(t('Logged out successfully'))
    history.replace('/auth')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('User Profile')}</h2>
        
        {/* 用户信息卡片 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <img
                src={LOGO}
                alt="User Avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {$user?.name || 'User'}
              </h3>
              <p className="text-sm text-gray-500">
                {$user?.email || localStorage.getItem('email') || 'user@example.com'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('Role')}: {$user?.role || 'User'}
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('Workspace')}:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {$currentWorkspace.name || 'Default Workspace'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t('User ID')}:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {$user?.id || 'N/A'}
                </span>
              </div>
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
