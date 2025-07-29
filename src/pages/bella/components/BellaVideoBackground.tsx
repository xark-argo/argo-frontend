import {Button, Dropdown, Menu} from '@arco-design/web-react'
import {IconCheckCircleFill, IconDown} from '@arco-design/web-react/icon'
import {useMemo} from 'react'

import {useVideoConfig} from '../hooks'

function BellaVideoBackground() {
  const {videoRef, characters, character, changeCharacter} = useVideoConfig()

  const dropList = useMemo(() => {
    return (
      <Menu>
        {characters.map(item => (
          <Menu.Item
            key={item}
            className="w-full"
            disabled={character === item}
            onClick={() => changeCharacter(item)}>
            {item === character && <IconCheckCircleFill />}
            {item}
          </Menu.Item>
        ))}
      </Menu>
    )
  }, [characters, character, changeCharacter])

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <video
        ref={videoRef}
        className="h-full object-cover transition-opacity duration-300"
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 opacity-25" />
      <div className="absolute right-4 top-10 transform -translate-y-1/2 z-10">
        <Dropdown droplist={dropList} position="br">
          <Button type="text">
            切换角色
            <IconDown />
          </Button>
        </Dropdown>
      </div>
    </div>
  )
}

BellaVideoBackground.displayName = 'BellaVideoBackground'

export default BellaVideoBackground
