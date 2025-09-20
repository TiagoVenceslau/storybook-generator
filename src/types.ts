export type Conversation = {
  user: "system" | "user",
  input: {
    type: "text" | "image_url",
    message?: string,
    image_data?: string
  }[]
}[]