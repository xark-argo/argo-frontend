/* eslint-disable @typescript-eslint/no-unused-vars */
import {Image} from '@arco-design/web-react'
import React from 'react'
import {useTranslation} from 'react-i18next'

import FileIcons from '~/components/icons/FileIcons'

import EditMessage from '../EditMessage'

function UserMessage({
  message,
  fileList,
  loading = false,
  isEdit = false,
  changeIsEdit = (_: boolean) => {},
  handleEditConfirm = (_: any) => {},
}) {
  const {t} = useTranslation()
  return (
    <div className="flex w-full user-message">
      <div className="flex-shrink-0 mr-3">
        <div className="size-8 bg-gray-400 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="w-full overflow-hidden pl-1">
        <div className="prose w-full max-w-full">
          {isEdit ? (
            <EditMessage
              msg={message}
              handleCancel={() => {
                changeIsEdit(false)
              }}
              isCanSubmit={!loading}
              submitText={t('Save and send')}
              handleSubmit={handleEditConfirm}
            />
          ) : (
            <div className="w-full">
              <div className="flex space-x-2 py-[10px] px-[20px] rounded-[4px] bg-transparent border border-gray-200 shadow-sm font-600 rounded-lg">
                <div className="w-full text-16 leading-[26px] text-[#03060E] font-400">
                  {fileList.map((file) => {
                    const arr = file.name.split('.')
                    return (
                      <div
                        key={file.id}
                        className="h-16 my-2 w-[15rem] flex items-center space-x-3 px-2.5 rounded-xl border border-gray-200"
                      >
                        {file.type !== 'image' ? (
                          <FileIcons type={arr[arr.length - 1]} />
                        ) : (
                          <Image
                            width={42}
                            height={42}
                            src={file.url}
                            className="overflow-hidden"
                          />
                        )}

                        <div className="flex flex-col justify-center -space-y-0.5">
                          <div className="text-sm font-medium line-clamp-1">
                            {file.name}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {file.type !== 'image' ? t('Document') : t('Image')}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <pre>{message}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserMessage
