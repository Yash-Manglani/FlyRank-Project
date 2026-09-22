import axios from 'axios'
import { stringFormat } from 'zod';

class SocialPublisher{
    async publish(content){
        throw new Error("Method 'publish()' must be implemented.");
    }
}

class DiscordPublisher extends SocialPublisher{
    constructor(webhookUrl){
        super();
        this.webhookUrl = webhookUrl;
    }

    async publish(content){
        if(!this.webhookUrl){
            throw new Error("Discord_Webhook_Url is missing from the environment variables.");

        }

        const response = await axios.post(this.webhookUrl, {content});
        return { success: true, platform: 'discord', data: response.data || 'Sent successfully' };
    }
}

class MockXPublisher extends SocialPublisher{
    async publish(content){
        console.log(`[MOCK X PUBLISHER] Rendering post: "${content}"`);
        return { success: true, platform: 'mock_x', data: { preview: content, timestamp: new Date()} };
        
    }
}

class MockLinkedInPublisher extends SocialPublisher {
  async publish(content) {
    console.log(`[MOCK LINKEDIN PUBLISHER] Rendering post: "${content}"`);
    return { success: true, platform: 'mock_linkedin', data: { preview: content, timestamp: new Date() } };
  }
}

const getPublisher = (platform, config) => {
    switch(platform){
        case 'discord':
            return new DiscordPublisher(config.discordWebhook);

        case 'mock_x':
            return new MockXPublisher();

        case 'mock_linkedin':
            return new MockLinkedInPublisher();

        default:
            throw new Error(`Unknown platform adapter: ${platform}`);
    }
};

export default getPublisher;