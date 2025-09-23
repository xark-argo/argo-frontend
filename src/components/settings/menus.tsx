import DataFileIcon from '../icons/DataFile'
import LanguageIcon from '../icons/LanguageIcon'
import MemberIcon from '../icons/MemberIcon'
import KnowledgeImg from '../../layout/assets/icon_knowledge.svg'
import ModelImg from '../../layout/assets/icon_model.svg'
import ToolImg from '../../layout/assets/icon_tool.svg'
import DataFile from './components/DataFile'
import Language from './components/Language'
import Members from './components/Members'
import Models from '~/pages/models/model'
import Knowledge from '~/pages/knowledgeRepository'
import Tools from '~/pages/MCPtools'

export const SettingMenus = [
  {
    text: 'ACCOUNT',
    children: [
      {
        value: 'members',
        text: 'Members',
        icon: MemberIcon,
        comp: () => <Members />,
      },
      {
        value: 'language',
        text: 'Language',
        icon: LanguageIcon,
        comp: () => <Language />,
      },
      {
        value: 'Data file',
        text: 'Data file',
        icon: DataFileIcon,
        comp: () => <DataFile />,
      },
    ],
  },
  {
    text: 'MANAGEMENT',
    children: [
      {
        value: 'models',
        text: 'Models',
        icon: () => <img src={ModelImg} alt="Models" className="w-4 h-4" />,
        comp: () => <Models />,
      },
      {
        value: 'knowledge',
        text: 'Knowledge',
        icon: () => <img src={KnowledgeImg} alt="Knowledge" className="w-4 h-4" />,
        comp: () => <Knowledge />,
      },
      {
        value: 'tools',
        text: 'Tools',
        icon: () => <img src={ToolImg} alt="Tools" className="w-4 h-4" />,
        comp: () => <Tools />,
      },
    ],
  },
]

export const MemberTypes = {normal: 'Normal User', admin: 'Admin User'}
