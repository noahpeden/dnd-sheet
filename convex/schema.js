import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  characters: defineTable({
    userId: v.string(),

    info: v.object({
      name: v.string(),
      player: v.string(),
      race: v.string(),
      class_: v.string(),
      level: v.number(),
      alignment: v.string(),
      age: v.union(v.string(), v.number()),
      height: v.string(),
      weight: v.string(),
      sex: v.string(),
    }),

    racialStats: v.any(),
    initialTotal: v.number(),
    skills: v.any(),

    hp: v.object({
      max: v.number(),
      current: v.number(),
      temp: v.number(),
    }),

    inventory: v.array(v.any()),
    slotPositions: v.array(v.any()),
    bodySlots: v.any(),
    inventoryFolders: v.array(v.any()),

    currency: v.object({
      cp: v.number(),
      sp: v.number(),
      gp: v.number(),
      pp: v.number(),
      cr: v.optional(v.number()),
    }),

    abilities: v.array(v.any()),
    customAbilities: v.array(v.any()),

    charNotes: v.string(),
    sessionNotes: v.array(v.any()),
    levelLog: v.array(v.any()),

    theme: v.any(),
    textStyles: v.any(),
    bgImage: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
