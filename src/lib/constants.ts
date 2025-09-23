// import { browser, dev } from '$app/environment';
// import { version } from '../../package.json';

export const APP_NAME = 'Argo'

export const WEBUI_API_BASE_URL = `/api`

// export const WEBUI_VERSION = APP_VERSION;
// export const WEBUI_BUILD_HASH = APP_BUILD_HASH;
export const REQUIRED_OLLAMA_VERSION = '0.1.16'

export const LOGO = '/api/files/resources/icons/bot.jpeg'

// 用户头像SVG图标 - 用于用户资料页面（大尺寸，白色）
export const DEAULT_USER_ICON_SVG = '<svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>'

// 用户头像SVG图标 - 用于聊天对话（小尺寸，白色）
export const CHAT_USER_ICON_SVG = '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>'
// Source: https://kit.svelte.dev/docs/modules#$env-static-public
// This feature, akin to $env/static/private, exclusively incorporates environment variables
// that are prefixed with config.kit.env.publicPrefix (usually set to PUBLIC_).
// Consequently, these variables can be securely exposed to client-side code.
