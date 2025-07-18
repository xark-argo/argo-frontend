import {Dropdown, Menu, Tooltip} from '@arco-design/web-react'
import {useAtom} from 'jotai'
import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useHistory} from 'react-router-dom'

import ArrowIcon from '~/components/icons/ArrowIcon'
import Settings from '~/components/settings'
import {currentWorkspace} from '~/lib/stores'

import WorkspaceList from './WorkspaceList'

function UserMenu({children}) {
  const history = useHistory()
  const {t} = useTranslation()
  const [$currentWorkspace] = useAtom(currentWorkspace)

  const [showSetting, setShowSetting] = useState(false)

  const renderContent = <WorkspaceList />

  const droplist = (
    <Menu
      onClick={(e) => e.stopPropagation()}
      className="w-full min-w-[240px] text-sm rounded-xl px-1 py-1.5 border border-gray-300/30 z-50 bg-white shadow"
    >
      <div className="px-1 py-1" role="none">
        <div className="mt-2 px-3 text-xs font-medium text-gray-500">
          {t('workspaces')}
        </div>
        <div className="relative w-full h-full">
          <Tooltip
            trigger="click"
            color="#fff"
            content={renderContent}
            className="rounded-xl"
            position="right"
          >
            <button
              className="flex items-center px-3 py-2 h-10 w-full group hover:bg-gray-50 cursor-pointer false rounded-lg"
              id="headlessui-menu-button-:r2e:"
              type="button"
            >
              <div
                className="shrink-0 mr-2 flex items-center justify-center w-6 h-6 bg-[#EFF4FF] rounded-md text-xs font-medium text-primary-600 "
                role="none"
              >
                {$currentWorkspace.name[0]}
              </div>
              <div
                className="grow mr-2 text-sm text-gray-700 text-left truncate"
                role="none"
              >
                {$currentWorkspace.name}
              </div>
              <ArrowIcon />
            </button>
          </Tooltip>
        </div>
      </div>
      <hr className="  my-1.5 p-0" />
      <button
        className="flex rounded-md py-2 px-3 w-full hover:bg-gray-50 transition"
        onClick={() => {
          setShowSetting(true)
        }}
      >
        <div className=" self-center mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div className=" self-center font-600">{t('Settings')}</div>
      </button>
      <hr className=" my-1.5 p-0" />
      <button
        aria-label="logout"
        className="flex rounded-md py-2 px-3 w-full hover:bg-gray-50 transition"
        onClick={() => {
          localStorage.removeItem('token')
          localStorage.removeItem('email')
          history.replace('/auth')
        }}
      >
        <div className=" self-center mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className=" self-center font-600">{t('Sign Out')}</div>
      </button>
    </Menu>
  )
  return (
    <div className="mx-auto">
      <Dropdown trigger="click" droplist={droplist}>
        {children}
      </Dropdown>
      <Settings
        visible={showSetting}
        onClose={() => {
          setShowSetting(false)
        }}
      />
    </div>
  )
}

export default UserMenu
