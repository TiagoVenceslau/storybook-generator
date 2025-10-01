import { z } from "zod";

export enum CharacterRoles {
  Main = "main",
  Supporting = "supporting",
  Antagonist = "antagonist",
}

export const SceneLocation = z.object({
  name: z.string().describe("the location's name"),
  situational: z.array(z.string()).optional().describe("the location's situational characteristics"),
  timeOfDay: z.array(z.string()).describe("the location's time of day"),
})

export const Location = z.intersection(SceneLocation, z.object({
  description: z.string().describe("the location's description"),
  characteristics: z.array(z.string()).describe("the location's defining characteristics"),
}))

export const BaseCharacter = z.object({
  name: z.string().describe("the character's name"),
  situational: z.array(z.string()).describe("the character's situational physical characteristics"),
})

export const SceneCharacter = z.intersection(BaseCharacter, z.object({
  pose: z.string().describe("the character's pose"),
  expression: z.string().optional().describe("the character's expression"),
}))

export const Character = z.intersection(BaseCharacter, z.object({
  description: z.string().describe("the character's description"),
  characteristics: z.array(z.string()).describe("the character's defining physical characteristics"),
  role: z.enum(Object.values(CharacterRoles) as any).describe("the character's role"),
}))

export const Dialog = z.object({
  character: z.string().describe("the character's name"),
  attitude: z.string().describe("the character's attitude"),
  dialog: z.string().optional().describe("the dialog"),
})

export const Scene = z.object({
  page: z.number().describe("the page number"),
  sceneNumber: z.number().describe("the scene's number"),
  storyContent: z.string().describe("the scene's story content"),
  description: z.string().describe("the scene's description"),
  dialog: z.array(Dialog).describe("the scene's dialog"),
  characters: z.array(SceneCharacter).optional().describe("the characters in the scene and their situational features"),
  location: SceneLocation.describe("the location of the scene"),
  shotType: z.string().optional().describe("the shotType"),
  mood: z.string().optional().describe("the mood"),
  notes: z.array(z.string()).optional().describe("notes for illustrator"),
})

export const Storyboard = z.object({
  title: z.string().describe("the storyboard title"),
  scenes: z.array(Scene).describe("The scenes in the storyboard"),
  characters: z.array(Character).describe("All character's descriptions and defining physical characteristics"),
  locations: z.array(Location).optional().describe("All locations descriptions and defining features"),
  style: z.string().optional().describe("the visual style"),
})
