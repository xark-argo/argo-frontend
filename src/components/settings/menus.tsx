import DataFileIcon from '../icons/DataFile'
import LanguageIcon from '../icons/LanguageIcon'
import MemberIcon from '../icons/MemberIcon'
import KnowledgeImg from '../../layout/assets/icon_knowledge.svg'
import ModelImg from '../../layout/assets/icon_model.svg'
import ToolImg from '../../layout/assets/icon_tool.svg'
import DataFile from './components/DataFile'
import Language from './components/Language'
import Members from './components/Members'
import UserProfile from './components/UserProfile'
import ContactUs from './components/ContactUs'
import Models from '~/pages/models/model'
import Knowledge from '~/pages/knowledgeRepository'
import Tools from '~/pages/MCPtools'

export const SettingMenus = [
  {
    text: 'ACCOUNT',
    children: [
      {
        value: 'profile',
        text: 'User Profile',
        icon: () => (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        comp: () => <UserProfile />,
      },
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
      {
        value: 'contact',
        text: 'Contact Us',
        icon: () => (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        comp: () => <ContactUs />,
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
