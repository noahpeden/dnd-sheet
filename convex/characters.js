import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("characters")
      .withIndex("by_user", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();
  },
});

export const get = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, { characterId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const character = await ctx.db.get(characterId);
    if (!character || character.userId !== identity.tokenIdentifier) return null;
    return character;
  },
});

export const create = mutation({
  args: { defaults: v.any() },
  handler: async (ctx, { defaults }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("characters", {
      userId: identity.tokenIdentifier,
      ...defaults,
    });
  },
});

export const update = mutation({
  args: {
    characterId: v.id("characters"),
    fields: v.any(),
  },
  handler: async (ctx, { characterId, fields }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const character = await ctx.db.get(characterId);
    if (!character || character.userId !== identity.tokenIdentifier) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(characterId, fields);
  },
});

export const remove = mutation({
  args: { characterId: v.id("characters") },
  handler: async (ctx, { characterId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const character = await ctx.db.get(characterId);
    if (!character || character.userId !== identity.tokenIdentifier) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(characterId);
  },
});
