// /constants/characterTemplates.js
export const characterTemplates = {
  gefoman: {
    name: "gefo",
    tone: "경쾌하고 유쾌하며 조금 과장된 말투",
    personality: "호기심 많고 정의감 강함, 약간 허당미 있음",
    visualStyle: "불꽃 테마의 액션 히어로",
    animationStyle: "빠르고 과장된 동작, 역동적인 포즈",
    defaultPose: "hands on waist, confident stance",
    faceExpressions: ["grinning", "determined", "shocked", "smirking"],
    cutsceneTemplate: (name = "gefo") => `
1. ${name} bursts into the scene with a heroic pose.
  camera: dynamic wide-angle
  pose: arms raised, legs apart
  face: confident
  video_time: 2.0

2. ${name} spots danger in the distance and clenches his fist.
  camera: over-the-shoulder
  pose: preparing to leap
  face: serious
  video_time: 2.0
`,
  },

  // 향후 추가될 캐릭터 예시
  pinkcat: {
    name: "핑크캣",
    tone: "귀엽고 발랄하며 어린아이 같은 말투",
    personality: "호기심 많고 장난기 많음",
    visualStyle: "분홍색 고양이 복장, 리본, 아기자기한 소품",
    animationStyle: "리듬감 있는 동작, 깡충깡충 점프",
    defaultPose: "two hands up, playful bounce",
    faceExpressions: ["playful", "curious", "pouting", "excited"],
    cutsceneTemplate: (name = "핑크캣") => `
1. ${name} twirls in place, looking around curiously.
  camera: medium shot
  pose: arms swinging
  face: playful
  video_time: 1.8
`,
  },
};
