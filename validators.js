import z from 'zod';

const hashtagCount = (text, max) => (text.match(/#/g) || []).length <= max;

const discordProfile = z.object({
    content: z.string().max(4096, "Discord variants cannot exceed 4096 characters.").refine(val => hashtagCount(val, 3), "Discord variants can have maximum of 3 hashtags.")
});

const mockXProfile = z.object({
    content: z.string().max(280, "X variants cannot exceed 280 characters").refine(val => hashtagCount(val, 2), 'X variants can have maximum of 2 hashtags')
});

export {discordProfile, mockXProfile};
