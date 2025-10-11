import React from 'react'
import {useTranslation} from 'react-i18next'
import { LOGO } from '~/lib/constants'

function ContactUs() {
  const {t} = useTranslation()

  return (
    <div className="p-6">
      <div className="mb-6">
        {/* 混沌罗盘信息 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src={LOGO} 
                alt="混沌罗盘" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">混沌罗盘</h3>
              <p className="text-gray-600">智能对话平台</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">
            {t('We are committed to providing you with the best AI conversation experience. If you have any questions or suggestions, please feel free to contact us.')}
          </p>
        </div>

        {/* 联系方式 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 微信 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.5 12.5c0-.3.2-.5.5-.5s.5.2.5.5-.2.5-.5.5-.5-.2-.5-.5zm7 0c0-.3.2-.5.5-.5s.5.2.5.5-.2.5-.5.5-.5-.2-.5-.5z"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900">微信</h4>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              {t('Scan QR code to add WeChat')}
            </p>
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">QR Code</span>
            </div>
          </div>

          {/* QQ */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900">QQ</h4>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              {t('Add QQ group for support')}
            </p>
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">QQ Group</span>
            </div>
          </div>
        </div>

        {/* 其他联系方式 */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">{t('Other Contact Methods')}</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{t('Email')}: support@chaos-compass.com</p>
            <p>{t('Website')}: https://chaos-compass.com</p>
            <p>{t('Documentation')}: https://docs.chaos-compass.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactUs
