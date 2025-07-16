import * as PIXI from 'pixi.js'
import {Live2DModel} from 'pixi-live2d-display-lipsyncpatch'

const live2dModule = async () => {
  let model
  let app
  window.PIXI = PIXI

  async function init() {
    if (app) app.destory()
    const view = document.getElementById('canvas_view')?.getBoundingClientRect()
    app = new PIXI.Application({
      view: document.getElementById('canvas_view'),
      // 背景是否透明
      backgroundAlpha: 0,
      transparent: true,
      autoStart: true,
      width: view.width,
      height: view.height,
    } as any)
  }

  async function loadModel(modelInfo) {
    if (!app) {
      await init()
    }
    if (model) {
      // Remove old model
      app.stage.removeChild(model)
      model = ''
    }
    model = await Live2DModel.from(modelInfo.url)

    const scaleX = window.innerWidth * modelInfo.kScale * 0.8
    const scaleY = window.innerHeight * modelInfo.kScale * 0.8

    model.scale.set(Math.min(scaleX, scaleY))
    model.y = window.innerHeight * 0.01
    if (!modelInfo.initialXshift) modelInfo.initialXshift = 0
    if (!modelInfo.initialYshift) modelInfo.initialYshift = 0

    model.x = app.view.width / 2 - model.width / 2 + modelInfo.initialXshift
    model.y = app.view.height / 2 - model.height / 2 + modelInfo.initialYshift
    app.stage.addChild(model)

    model.on('hit', (hitAreas) => {
      if (hitAreas.includes('body')) {
        model.motion('tap_body')
      }

      if (hitAreas.includes('head')) {
        model.expression()
      }
    })
    app.renderer.render(app.stage)
  }

  function checkModelLoaded() {
    return model
  }
  // set expression of the model
  // @param {int} expressionIndex - the expression index defined in the emotionMap in modelDict.js
  function setExpression(expressionIndex = -1) {
    if (expressionIndex == null) {
      return
    }

    const model_expressions = model.internalModel.settings.expressions
    if (!model_expressions || model_expressions.length === 0) {
      return
    }

    if (expressionIndex < 0 || expressionIndex >= model_expressions.length) {
      model.expression()
    } else {
      model.expression(expressionIndex)
    }
  }

  // emotionMap may have __default__ motion
  // emotionMap: {"happy": [0,2,3]}, [0,2,3] means multi emotion idx
  function setExpressionWithText(emotionMap, text) {
    let emotionKey = '__default__' in emotionMap ? '__default__' : ''
    Object.keys(emotionMap).forEach((v) => {
      if (v.includes(text)) {
        emotionKey = v
      }
    })

    if (emotionKey === '') {
      return
    }

    const idx_list = emotionMap[emotionKey]
    const idx = idx_list[Math.floor(Math.random() * idx_list.length)]
    if (idx < 0) {
      model.expression()
    } else {
      model.expression(idx)
    }
  }

  // motion_label: tap_head
  // motion_index: 0,1,2..., motion index in motion_label configure
  function setMotion(motion_label = '', motion_index = -1) {
    motion_index = Number(motion_index)

    const model_motions = model.internalModel.settings.motions
    if (!model_motions) {
      return
    }

    if (!(motion_label in model_motions)) {
      // 使用第一个 key 对应的 motion
      const firstKey = Object.keys(model_motions)[0]
      model.motion(firstKey)
      return
    }

    if (!(motion_label in model_motions)) {
      return
    }

    if (
      motion_index < 0 ||
      motion_index >= model_motions[motion_label].length
    ) {
      model.motion(motion_label)
    } else {
      model.motion(motion_label, motion_index)
    }
  }

  // motionMap may have __default__ motion
  // motionMap: {"happy": {"motion_label": motion_idx}},

  // motion_idx=-1 means random motion with motion_label
  function setMotionWithText(motionMap, text) {
    let motionKey = '__default__' in motionMap ? '__default__' : ''
    Object.keys(motionMap).forEach((v) => {
      if (text.includes(v)) {
        motionKey = v
      }
    })
    if (motionKey === '') {
      return
    }

    const motion_info = motionMap[motionKey]
    const motion_label = Object.keys(motion_info)[0]
    const motion_index = motion_info[motion_label]
    if (motion_index < 0) {
      model.motion(motion_label)
    } else {
      model.motion(motion_label, motion_index)
    }
  }

  function setMouth(mouthY) {
    if (
      typeof model.internalModel.coreModel.setParameterValueById === 'function'
    ) {
      model.internalModel.coreModel.setParameterValueById(
        'ParamMouthOpenY',
        mouthY
      )
    } else {
      model.internalModel.coreModel.setParamFloat('PARAM_MOUTH_OPEN_Y', mouthY)
    }
  }

  function speak(voice) {
    if (!model) return null
    return new Promise((resolve) => {
      model.speak(`data:audio/wav;base64,${voice}`, {
        resetExpression: true,
        onFinish: () => {
          resolve(1)
        },
        onError: (error) => {
          console.error('Audio playback error:', error)
          resolve(1)
        },
      })
    })
  }

  function stopSpeaking() {
    if (model) {
      model.stopSpeaking()
    }
  }

  function destroyModel() {
    if (model) {
      app?.stage?.removeChild(model)
      model.destroy()
      model = null
    }
    if (app) {
      app.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true,
      })
      app = null
    }
  }

  return {
    init,
    loadModel,
    setExpression,
    setMotion,
    setMouth,
    setExpressionWithText,
    setMotionWithText,
    speak,
    destroyModel,
    checkModelLoaded,
    stopSpeaking,
  }
}

export default live2dModule
