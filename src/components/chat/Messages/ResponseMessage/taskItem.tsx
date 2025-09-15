import {t} from 'i18next'
import {jsonrepair} from 'jsonrepair'
import {useEffect, useState} from 'react'

export default function TaskItem({message, onViewReport, showViewReport = false}) {
  const [messagePlan, setMessagePlan] = useState(null)
  const [expandedDescriptions, setExpandedDescriptions] = useState({})

  useEffect(() => {
    if (message) {
      try {
        const parsed = JSON.parse(message)
        setMessagePlan(parsed)
      } catch (err) {
        const repaired = jsonrepair(message)
        setMessagePlan(JSON.parse(repaired))
      }
    }
  }, [message])

  const toggleDescription = (index) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const taskStep = (obj, index) => {
    const isCompleted = !!obj?.execution_res
    const isExpanded = expandedDescriptions[index]

    return (
      <div
        key={index}
        className={`p-3 mb-2 rounded-lg border ${
          isCompleted 
            ? 'border-green-300 bg-green-50/50' 
            : 'border-gray-300 hover:border-gray-400 bg-white'
        } transition-all duration-200 flex items-start group`}
      >
        {/* 状态指示器 */}
        <div
          className={`mr-3 mt-0.5 flex-shrink-0 ${
            isCompleted ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
          }`}
        >
          {isCompleted ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="10" cy="10" r="8" />
            </svg>
          )}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <div
              className={`font-medium text-sm ${
                isCompleted ? 'text-gray-600' : 'text-gray-800'
              } mb-1 flex-1`}
            >
              {obj?.title}
            </div>
            {obj?.description && obj?.description.trim() && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleDescription(index)
                }}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={isExpanded ? '收缩描述' : '展开描述'}
                type="button"
              >
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
          {obj?.description && (
            <div className="text-gray-600 text-xs leading-relaxed">
              <div 
                className="transition-all duration-200"
                style={{
                  display: isExpanded ? 'block' : 'none'
                }}
              >
                {obj?.description}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return message ? (
    <div className="bg-white rounded-lg border border-gray-300 p-4 w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {messagePlan?.title}
        </h2>
        <p className="text-gray-600 text-sm italic leading-relaxed">{messagePlan?.thought}</p>
      </div>

      <div className="mt-4">
        <div className="space-y-2">
          {messagePlan?.steps?.map((step, index) => taskStep(step, index))}
        </div>
      </div>

      {showViewReport && onViewReport && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={onViewReport}
            className="w-full text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-md hover:bg-blue-50 transition-colors duration-200 text-sm"
          >
            {t('View report')}
          </button>
        </div>
      )}
    </div>
  ) : null
}
