import {Message, Tooltip} from '@arco-design/web-react'
import {t} from 'i18next'
import {useAtom, useAtomValue} from 'jotai'
import {useEffect, useState} from 'react'

import {currentWorkspace, modelList, selectModelProvider} from '~/lib/stores'

function SidebarModelsPanel({
  LLMConnectError,
  editing,
  setEditing,
  handleAddProvider,
  sideListRef,
}) {
  const [$modelList] = useAtom(modelList)
  const [$selectModelProvider, setSelectModelProvider] =
    useAtom(selectModelProvider)
  const $currentWorkspace = useAtomValue(currentWorkspace)

  const isCurrentSelect = (item) => {
    const {provider, credentials} = $selectModelProvider

    if (provider?.includes('openai-api-compatible')) {
      return item.credentials.custom_name === credentials.custom_name
    }

    return item.provider === provider
  }

  const changeSelectProvider = (value) => {
    if (editing) {
      Message.warning(t('Please save current changes first'))
      return
    }
    setSelectModelProvider(value)
  }

  const modelItemLong = (item) => {
    return (
      <div
        className={`p-[10px] rounded-md hover:bg-[#EBEBEB] cursor-pointer ${isCurrentSelect(item) ? 'bg-[#EBEBEB]' : ''}`}
        onClick={() => changeSelectProvider(item)}
        key={item.provider}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="rounded-lg overflow-hidden gap-[6px]">
              <img
                src={item.credentials?.icon_url}
                alt=""
                className="w-6 h-6"
              />
            </div>
            <div className="text-[#03060E] ml-1 max-w-28 overflow-hidden text-ellipsis whitespace-nowrap">
              {item.credentials.custom_name || t(item.label)}
            </div>
          </div>
          {item.credentials.enable > 0 ? (
            <div className="text-[#133EBF] bg-[#F2F6FF] border-[0.5px] border-[rgba(19, 62, 191, 0.7)] w-[38px] h-[18px] leading-[18px] text-center rounded-[40px] text-12">
              ON
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F9F9F9] flex flex-col h-full overflow-hidden w-[250px]">
      <div className="mx-4">
        <div className="text-[#565759] leading-[40px] font-[600] ml-3">
          {t('Local LLM Provider')}
        </div>
        <div
          className={`p-[10px] rounded-lg hover:bg-[#EBEBEB] cursor-pointer ${$selectModelProvider.provider === 'ollama' ? 'bg-[#EBEBEB]' : ''}`}
          onClick={() => {
            const select = structuredClone($selectModelProvider)
            select.provider = 'ollama'
            select.custom_name = ''
            select.credentials.custom_name = ''
            changeSelectProvider(select)
          }}
        >
          <div className="flex justify-between">
            <div className="flex">
              <div className="rounded-md overflow-hidden w-6 h-6 bg-blue-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="text-[#03060E] font-[600] ml-1">
                ARGO-LLM
              </div>
            </div>
            {!LLMConnectError && (
              <div className="text-[#133EBF] bg-[#F2F6FF] border-[0.5px] border-[rgba(19, 62, 191, 0.7)] w-[38px] h-[18px] leading-[18px] text-center rounded-[40px] text-12">
                ON
              </div>
            )}
          </div>
          <div className="text-[#6F6F71] text-[10px] mt-1">
            {t('Download&Run Local Models Powered by Ollama')}
          </div>
        </div>
      </div>

      <div className="border-t-[0.5px] border-[#EBEBEB] my-[10px] mx-4" />

      <div className="mx-4">
        <div>
          <div className="text-[#565759] leading-[40px] font-[600] ml-3">
            {t('LLM API Provider')}
          </div>
          <div
            className="max-h-[calc(100vh-350px)] overflow-auto"
            ref={sideListRef}
          >
            {$modelList.model_list.map(modelItemLong)}
          </div>
        </div>
        <div
          className="text-[#03060E] h-10 leading-10 rounded-md border border-[#03060E] cursor-pointer text-center mt-[10px]"
          onClick={() => Message.info(t('Add provider feature coming soon'))}
        >
          {t('Add OpenAI-Compatible-API')}
        </div>
      </div>
    </div>
  )
}

export default SidebarModelsPanel
