import {Message, Tooltip} from '@arco-design/web-react'
import {t} from 'i18next'
import {useAtom, useAtomValue} from 'jotai'
import {useEffect, useState} from 'react'
import {useParams} from 'react-router-dom'

import CreateCustomModel from '~/components/settings/components/ModelProvider/ModelCard/CreateCustomModel'
import {updateModelProviders} from '~/lib/apis/settings'
import {uploadFile} from '~/lib/apis/upload'
import {currentWorkspace, modelList, selectModelProvider} from '~/lib/stores'

import AddImage from '../../images/addImage'
import ArgoImage from '../../images/argoImage'
import ConfirmAction from '../ConfirmAction'

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
  const [openCreatModal, setOpenCreatModal] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [clickProvider, setClickProvider] = useState(null)
  const $currentWorkspace = useAtomValue(currentWorkspace)
  const {spaceId}: any = useParams()

  const colorList = [
    '#2972F4',
    '#319B62',
    '#F5C400',
    '#F88825',
    '#00A3F5',
    '#9A38D7',
  ]

  const isCurrentSelect = (item) => {
    const {provider, credentials} = $selectModelProvider

    if (provider?.includes('openai-api-compatible')) {
      return item.credentials.custom_name === credentials.custom_name
    }

    return item.provider === provider
  }

  const onOK = (value) => {
    setShowConfirm(false)
    setEditing(false)
    if (value === 'add') {
      setOpenCreatModal(true)
      return
    }
    setSelectModelProvider(value)
    if (
      value.provider === 'ollama' ||
      value.provider.includes('openai-api-compatible')
    ) {
      window.history.pushState({}, '', `/space/${spaceId}/models`)
    } else {
      window.history.pushState(
        {},
        '',
        `/space/${spaceId}/models?provider=${value.provider}&customName=${value.credentials.custom_name}`
      )
    }
  }

  const changeSelectProvider = (value) => {
    setClickProvider(value)
    if (editing) {
      setShowConfirm(true)
      return
    }

    if (value === 'add') {
      setOpenCreatModal(true)
    } else {
      onOK(value)
    }
  }

  const createDivAndConvertToImage = async (inputChar) => {
    const canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 240
    const ctx = canvas.getContext('2d')

    const bgColor = colorList[Math.floor(Math.random() * colorList.length)]

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, 240, 240)

    ctx.font = '600 160px SF Pro Display'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(inputChar, 120, 120)

    const url = canvas.toDataURL('image/png')

    const byteString = atob(url.split(',')[1])
    const mimeString = url.split(',')[0].split(':')[1].split(';')[0]
    const uint8Array = Uint8Array.from(byteString, (char) => char.charCodeAt(0))

    const blob = new Blob([uint8Array], {type: mimeString})

    const file = new File([blob], 'image.png', {type: mimeString})
    const {file_url} = await uploadFile(file)
    return file_url
  }

  const handleCreate = async (v) => {
    const url = await createDivAndConvertToImage(v.custom_name[0])
    v.icon_url = url
    try {
      await updateModelProviders($currentWorkspace.id, {
        credentials: v,
        provider: 'openai-api-compatible',
      })
      $selectModelProvider.provider = 'openai-api-compatible'
      $selectModelProvider.credentials.custom_name = v.custom_name
      setSelectModelProvider($selectModelProvider)
      handleAddProvider()
      Message.success(t('Set Success'))
      setOpenCreatModal(false)
    } catch (err) {
      Message.error(err.msg || 'Server error, try again later')
    }
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
    <>
      <div className="bg-[#F9F9F9] flex flex-col h-[100vh] overflow-hidden w-[250px]">
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
                <div className="rounded-md overflow-hidden">
                  <ArgoImage />
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
            onClick={() => changeSelectProvider('add')}
          >
            {t('Add OpenAI-Compatible-API')}
          </div>
        </div>
      </div>
      <CreateCustomModel
        visible={openCreatModal}
        onClose={() => setOpenCreatModal(false)}
        onSubmit={handleCreate}
        credentials={{
          custom_name: '',
          base_url: '',
          api_key: '',
        }}
      />
      <ConfirmAction
        onClose={() => setShowConfirm(false)}
        onOK={() => onOK(clickProvider)}
        visible={showConfirm}
        text={t(
          'The current API modification has not been checked. Are you sure you want to leave?'
        )}
      />
    </>
  )
}

export default SidebarModelsPanel
