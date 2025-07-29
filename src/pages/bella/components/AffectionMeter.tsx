import {useAtomValue} from 'jotai'
import {useTranslation} from 'react-i18next'

import {bellaAffection} from '../atoms'

function AffectionMeter() {
  const {t} = useTranslation()
  const value = useAtomValue(bellaAffection)

  // 根据好感度获取颜色
  const getAffectionColor = (val: number) => {
    if (val >= 80) return 'text-red-500'
    if (val >= 60) return 'text-orange-500'
    if (val >= 40) return 'text-yellow-500'
    if (val >= 20) return 'text-blue-500'
    return 'text-gray-500'
  }

  // 根据好感度获取状态文本
  const getAffectionText = (val: number) => {
    if (val >= 80) return t('Love')
    if (val >= 60) return t('Like')
    if (val >= 40) return t('Neutral')
    if (val >= 20) return t('Dislike')
    return t('Hate')
  }

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 w-24 text-center">
      {/* 好感度数值 */}
      <div className={`text-2xl font-bold mb-1 ${getAffectionColor(value)}`}>
        {value}
      </div>

      {/* 垂直渐变粉色进度条 */}
      <div className="h-[60vh] w-6 mx-auto bg-gray-300/30 rounded-full mb-2 flex items-end">
        <div
          className="w-6 rounded-full transition-all duration-300"
          style={{
            height: `${value}%`,
            background: 'linear-gradient(to top, #ff6fd8, #ffb86c, #fcb1e3)',
            minHeight: value > 0 ? '8px' : 0,
          }}
        />
      </div>

      {/* 状态文本 */}
      <div className="text-xs text-white/80 font-medium">
        {getAffectionText(value)}
      </div>
    </div>
  )
}

export default AffectionMeter
