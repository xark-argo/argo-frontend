# Bella 风格对话页面

这是一个类似 Bella 项目的对话界面实现，提供了沉浸式的虚拟角色对话体验。

## 功能特性

### 1. 视频背景系统
- **多状态支持**: idle、happy、sad、angry、surprised、thinking 等
- **随机播放**: 每个状态可以配置多个视频，随机选择播放
- **自动循环**: idle 状态自动循环播放，其他状态播放完成后回到 idle
- **无缝切换**: 视频播放完成后自动切换状态

### 2. 实时 TTS 语音播放
- **分句处理**: 将机器人回复按句子分割
- **实时播放**: 每句话播放完成后自动播放下一句
- **音频同步**: 音频播放时显示对应的文字内容
- **播放动画**: 音频播放时显示动态指示器

### 3. 对话界面
- **简洁设计**: 只显示最新的用户消息和当前播放的句子
- **流式响应**: 支持实时流式对话
- **消息消失**: 句子播放完成后自动消失
- **输入优化**: 支持回车发送，禁用状态管理

### 4. 好感度系统
- **实时更新**: 根据对话内容动态调整好感度
- **可视化显示**: 右侧显示好感度数值和进度条
- **状态反馈**: 不同好感度显示不同表情和颜色
- **Mock 实现**: 当前为模拟实现，可根据需要接入真实逻辑

## 使用方法

### URL 格式
```
/bella/{botId}/{conversationId?}
```

- `botId`: 必需，机器人ID
- `conversationId`: 可选，会话ID（不提供则创建新会话）

### 示例
```
/bella/123                    # 创建新会话
/bella/123/456               # 继续现有会话
```

## 技术实现

### 核心组件
1. **BellaVideoBackground**: 视频背景管理
2. **BellaConversation**: 对话逻辑处理
3. **AffectionMeter**: 好感度显示

### 关键技术
- **fetchEventSource**: 流式对话
- **Web Audio API**: TTS 音频播放
- **Video API**: 视频状态管理
- **Jotai**: 状态管理

### 配置说明

#### 视频配置
在 `BellaVideoBackground.tsx` 中配置不同状态的视频：

```typescript
const VIDEO_CONFIG = {
  idle: [
    '/api/files/resources/videos/idle1.mp4',
    '/api/files/resources/videos/idle2.mp4',
  ],
  happy: [
    '/api/files/resources/videos/happy1.mp4',
    '/api/files/resources/videos/happy2.mp4',
  ],
  // ... 其他状态
}
```

#### TTS 配置
在 `BellaConversation.tsx` 中配置 TTS 参数：

```typescript
const {data: voice} = await getTTSVoice({
  tts_type: 'edge_tts',
  tts_params: {
    text: text.replaceAll('*', ''),
    voice: 'zh-CN-XiaoxiaoNeural', // 可调整语音
    rate: '+0%',
    volume: '+100%',
  },
})
```

## 扩展建议

1. **视频资源**: 添加更多状态视频，提升体验
2. **语音优化**: 支持多种语音选择
3. **好感度算法**: 实现真实的好感度计算逻辑
4. **动画效果**: 添加更多交互动画
5. **个性化**: 支持角色个性化配置

## 注意事项

1. 需要确保视频资源路径正确
2. TTS 服务需要正常运行
3. 浏览器需要支持 Web Audio API
4. 建议在 HTTPS 环境下使用 