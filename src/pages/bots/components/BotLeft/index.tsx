import {Tooltip} from '@arco-design/web-react'
import {useAtom} from 'jotai'
import {memo, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link, useLocation} from 'react-router-dom'

import {activeChat, currentWorkspace} from '~/lib/stores'

import {MenuRoute} from '../../menuConfig'
import ChatList from '../ChatList'
import Settings from '~/components/settings'
import argoImage from '~/pages/models/images/argoImage'
import { LOGO } from '~/lib/constants'

const BotLeft = memo(() => {
  const {pathname} = useLocation()
  const {t} = useTranslation()
  const [$currentWorkspace] = useAtom(currentWorkspace)
  const [, setActiveChat] = useAtom(activeChat)

  const [settingsVisible, setSettingsVisible] = useState(false)

  return (
    <div className="bg-[#F9F9F9] flex flex-col flex-shrink-0 h-full overflow-hidden w-[250px] px-4">
      {/* 混沌罗盘LOGO区域 */}
      <div className="flex-shrink-0 py-4 mb-2">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
            <img 
              src={LOGO} 
              alt="混沌罗盘" 
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">混沌罗盘</h2>
            <p className="text-xs text-gray-500">{t('Intelligent Platform')}</p>
          </div>
        </div>
      </div>
      
      {/* 分隔线 */}
      <div className="h-[0.5px] bg-[#EBEBEB] w-full mb-2" />
      
      {MenuRoute.map((item) => (
        <Link
          key={item.name}
          to={item.path($currentWorkspace.id)}
          onClick={() => {
            setActiveChat({})
          }}
          className={`${item.path($currentWorkspace.id) === pathname ? 'bg-[#EBEBEB] font-600' : 'hover:bg-[#EBEBEB]'} cursor-pointer rounded-[8px] flex items-center px-[10px] py-[6px] mb-[10px] text-[#03060E] text-[14px]`}
        >
          <img
            src={item.icon}
            alt=""
            className="w-6 h-6 mr-[10px]"
          />
          <span className="transition-all duration-150 truncate">
            {t(item.name)}
          </span>
        </Link>
      ))}
      <div className="h-[0.5px] bg-[#EBEBEB] w-full my-[10px]" />
      <div className="text-[#03060E] text-[14px] font-700 leading-[17px] truncate p-3 w-full">
        {t('Chat History')}
      </div>
      <ChatList visibleMenu={true} />

      {/* 底部按钮区域：设置 / 联系我们 */}
      <div className="mt-2 w-full flex-shrink-0">
        <div className="space-y-2 pb-3">
          <button
            className="w-full justify-start px-[10px] h-[36px] rounded-[8px] bg-[#EBEBEB] hover:bg-[#E1E1E1] text-[#03060E] text-[14px] font-500 flex items-center"
            onClick={() => setSettingsVisible(true)}
          >
            {/* 简单齿轮图标 */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-[10px] w-4 h-4">
              <path fillRule="evenodd" d="M11.983 1.954a1 1 0 00-1.966 0l-.146.878a6.987 6.987 0 00-1.36.79l-.82-.472a1 1 0 00-1.366.366l-.982 1.7a1 1 0 00.366 1.366l.82.474a6.987 6.987 0 000 1.58l-.82.474a1 1 0 00-.366 1.366l.982 1.7a1 1 0 001.366.366l.82-.472c.43.32.88.586 1.36.79l.146.878a1 1 0 001.966 0l.146-.878c.48-.204.93-.47 1.36-.79l.82.472a1 1 0 001.366-.366l.982-1.7a1 1 0 00-.366-1.366l-.82-.474a6.987 6.987 0 000-1.58l.82-.474a1 1 0 00.366-1.366l-.982-1.7a1 1 0 00-1.366-.366l-.82.472a6.987 6.987 0 00-1.36-.79l-.146-.878zM10 12.25a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{t('Settings')}</span>
          </button>
        </div>
      </div>

      <Settings visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </div>
  )
})

export default BotLeft
