import {useAtom} from 'jotai'
import {useEffect, useState} from 'react'

import LatestVersionInstallModal from '~/components/LatestVersionInstallModal'

import {isDownloaded, isLatestVersion, updateProgress} from '../stores'

export const useUpdater = () => {
  const [, setIsLatestVersion] = useAtom(isLatestVersion)
  const [, setUpdateProgress]: any = useAtom(updateProgress)
  const [, setIsDownloaded] = useAtom(isDownloaded)
  const [visible, setVisible] = useState(true)
  // setVisible(true)

  useEffect(() => {
    if (window.argoBridge) {
      window.argoBridge.onNotificationUpdate((val) => {
        setIsLatestVersion(false)
        setIsDownloaded(false)
        setVisible(true)
        // Message.info('Discovered a new version, ready to update')
      })
      window.argoBridge.downloadProgress((v, progress) => {
        setUpdateProgress(progress)
        // Message.info(`正在下载：${progress.percent}`)
      })
      window.argoBridge.isDownloadedLatest(() => {
        setIsDownloaded(true)
        // Modal.confirm({
        //   title: '更新就绪',
        //   content: '立即重启应用完成安装？',
        //   okText: '立即重启',
        //   cancelText: '稍后',
        //   onOk: onOK,
        // })
      })
    }
  })
  return <LatestVersionInstallModal visible={visible} setVisible={setVisible} />
}
