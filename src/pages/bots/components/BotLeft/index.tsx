import {Tooltip} from '@arco-design/web-react'
import {useAtom} from 'jotai'
import {memo, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Link, useLocation} from 'react-router-dom'

import SidebarClose from '~/components/icons/SidebarClose'
import {activeChat, currentWorkspace} from '~/lib/stores'

import {MenuRoute} from '../../menuConfig'
import ChatList from '../ChatList'
import Settings from '~/components/settings'

const BotLeft = memo(() => {
  const {pathname} = useLocation()
  const {t} = useTranslation()
  const [$currentWorkspace] = useAtom(currentWorkspace)
  const [, setActiveChat] = useAtom(activeChat)
  const [visibleMenu, setVisibleMenu] = useState<any>(
    localStorage.botMenuVisible !== undefined
      ? Boolean(localStorage.botMenuVisible)
      : true
  )

  const storageChange = (e) => {
    if (e.key === 'botMenuVisible') {
      setVisibleMenu(Boolean(localStorage.botMenuVisible))
    }
  }

  useEffect(() => {
    window.addEventListener('storage', storageChange)
    return () => {
      window.removeEventListener('storage', storageChange)
    }
  })

  const [settingsVisible, setSettingsVisible] = useState(false)

  return (
    <div
      className={`bg-[#F9F9F9] flex flex-col flex-shrink-0 h-full overflow-hidden ${visibleMenu ? 'w-[250px]' : 'w-[74px]'} px-4`}
    >
      <div
        onClick={() => {
          localStorage.setItem('botMenuVisible', !visibleMenu ? '1' : '')
          setVisibleMenu((pre) => !pre)
        }}
        className={`cursor-pointer w-6 h-6 my-7 ${visibleMenu ? 'ml-3' : 'mx-auto'}`}
      >
        <SidebarClose />
      </div>
      {MenuRoute.map((item) => (
        <Link
          key={item.name}
          to={item.path($currentWorkspace.id)}
          onClick={() => {
            setActiveChat({})
          }}
          className={`${item.path($currentWorkspace.id) === pathname ? 'bg-[#EBEBEB] font-600' : 'hover:bg-[#EBEBEB]'} cursor-pointer rounded-[8px] flex items-center px-[10px] py-[6px] mb-[10px] text-[#03060E] text-[14px]`}
        >
          <Tooltip position="right" content={visibleMenu ? '' : t(item.name)}>
            <img
              src={item.icon}
              alt=""
              className={`w-6 h-6 ${visibleMenu ? 'mr-[10px]' : 'mx-auto my-1'}`}
            />
          </Tooltip>
          {visibleMenu ? (
            <span className="transition-all duration-150 truncate">
              {t(item.name)}
            </span>
          ) : (
            ''
          )}
        </Link>
      ))}
      <div className="h-[0.5px] bg-[#EBEBEB] w-full my-[10px]" />
      {visibleMenu ? (
        <div
          className={`text-[#03060E] text-[14px] font-700 leading-[17px] truncate p-3 ${visibleMenu ? 'w-full' : 'w-0'} transition-all`}
        >
          {t('Chat History')}
        </div>
      ) : (
        ''
      )}
      <ChatList visibleMenu={visibleMenu} />

      {/* 底部按钮区域：设置 / 联系我们 */}
      <div className={`mt-2 ${visibleMenu ? 'w-full' : 'w-[42px] mx-auto'} flex-shrink-0`}>
        <div className={`${visibleMenu ? 'space-y-2' : 'space-y-2'} pb-3`}>
          <button
            className={`${visibleMenu ? 'w-full justify-start px-[10px]' : 'w-[42px] justify-center px-0'} h-[36px] rounded-[8px] bg-[#EBEBEB] hover:bg-[#E1E1E1] text-[#03060E] text-[14px] font-500 flex items-center`}
            onClick={() => setSettingsVisible(true)}
          >
            {/* 简单齿轮图标 */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`${visibleMenu ? 'mr-[10px]' : ''} w-4 h-4`}>
              <path fillRule="evenodd" d="M11.983 1.954a1 1 0 00-1.966 0l-.146.878a6.987 6.987 0 00-1.36.79l-.82-.472a1 1 0 00-1.366.366l-.982 1.7a1 1 0 00.366 1.366l.82.474a6.987 6.987 0 000 1.58l-.82.474a1 1 0 00-.366 1.366l.982 1.7a1 1 0 001.366.366l.82-.472c.43.32.88.586 1.36.79l.146.878a1 1 0 001.966 0l.146-.878c.48-.204.93-.47 1.36-.79l.82.472a1 1 0 001.366-.366l.982-1.7a1 1 0 00-.366-1.366l-.82-.474a6.987 6.987 0 000-1.58l.82-.474a1 1 0 00.366-1.366l-.982-1.7a1 1 0 00-1.366-.366l-.82.472a6.987 6.987 0 00-1.36-.79l-.146-.878zM10 12.25a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" clipRule="evenodd" />
            </svg>
            {visibleMenu ? <span className="truncate">{t('Settings')}</span> : null}
          </button>
          <button
            className={`${visibleMenu ? 'w-full justify-start px-[10px]' : 'w-[42px] justify-center px-0'} h-[36px] rounded-[8px] bg-[#EBEBEB] hover:bg-[#E1E1E1] text-[#03060E] text-[14px] font-500 flex items-center`}
            onClick={() => setSettingsVisible(true)}
          >
            {/* 简单联系图标 */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`${visibleMenu ? 'mr-[10px]' : ''} w-4 h-4`}>
              <path d="M2.003 5.884A2 2 0 014 4h12a2 2 0 011.997 1.884L10 10.882 2.003 5.884z" />
              <path d="M18 8.118 10.553 12.89a1 1 0 01-1.106 0L2 8.118V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            {visibleMenu ? <span className="truncate">{t('Contact us')}</span> : null}
          </button>
        </div>
      </div>

      <Settings visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </div>
  )
})

export default BotLeft
