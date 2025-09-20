export class Character {
  name!: string;
  description!: string;
  role!: string;
  characteristics!: string[];
  situational?: string[];
}

export class SceneCharacter extends Character {
  pose!: string;
  situational: string[] = []
  expression!: string;
}

export const Alice = Object.assign(new Character(), {
  name: "Alice",
  description: "A tall beautiful blond haired middle aged woman, with a strategically located mole on the right side of her chin,\n    blue piecing eyes and a gorgeous smile, whenever she was willing to use it. Slim and elegant figure.\n    She is dressed only in a white man's shirt",
  characteristics: [
    "a noticeable scar on the right of her neck down to her right shoulder blade"
  ]
});

export const AliceDefault: SceneCharacter = Object.assign(new SceneCharacter(), Alice, {
  role: "Protagonist",
  expression: "neutral and calm",
  situational: [
    "wearing loose a white man's dress shirt, loosely buttoned. covering her until the mid of her tights",
    "wearing a loose red tie",
    "holding a gun on her right hand"
  ],
  pose: "full body neutral"
})


export const AlicePoster: SceneCharacter = Object.assign(new SceneCharacter(), Alice, {
  role: "Protagonist",
  expression: "mysterious and provocative",
  situational: [
    "wearing a long white woolen scarf",
    "wearing a long tight red cocktail dress",
    "holding a gun on her right hand"
  ],
  pose: "full body frontal and provocative"
})

