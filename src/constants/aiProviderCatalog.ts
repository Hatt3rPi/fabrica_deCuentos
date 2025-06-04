export interface AIModelInfo {
  id: string;
  description: string;
  endpoints: {
    generate?: string;
    edit?: string;
    variations?: string;
    result?: string;
  };
}

export interface ProviderInfo {
  name: 'openai' | 'flux' | 'stability';
  models: Record<string, AIModelInfo>;
}

export const aiProviderCatalog: Record<'openai' | 'flux' | 'stability', ProviderInfo> = {
  openai: {
    name: 'openai',
    models: {
      'gpt-image-1': {
        id: 'gpt-image-1',
        description: 'GPT Image 1',
        endpoints: {
          generate: 'https://api.openai.com/v1/images/generations',
          edit: 'https://api.openai.com/v1/images/edits',
          variations: 'https://api.openai.com/v1/images/variations'
        }
      },
      'dall-e-3': {
        id: 'dall-e-3',
        description: 'DALL-E 3',
        endpoints: {
          generate: 'https://api.openai.com/v1/images/generations',
          edit: 'https://api.openai.com/v1/images/edits',
          variations: 'https://api.openai.com/v1/images/variations'
        }
      },
      'dall-e-2': {
        id: 'dall-e-2',
        description: 'DALL-E 2',
        endpoints: {
          generate: 'https://api.openai.com/v1/images/generations',
          edit: 'https://api.openai.com/v1/images/edits',
          variations: 'https://api.openai.com/v1/images/variations'
        }
      }
    }
  },
  flux: {
    name: 'flux',
    models: {
      'flux-kontext-pro': {
        id: 'flux-kontext-pro',
        description: 'Flux Kontext Pro',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-kontext-pro',
          edit: 'https://api.bfl.ai/v1/flux-kontext-pro',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      }
    }
  },
  stability: {
    name: 'stability',
    models: {
      'stable-diffusion-3.5': {
        id: 'stable-diffusion-3.5',
        description: 'Stable Diffusion 3.5',
        endpoints: {
          generate: 'http://localhost:7860/sdapi/v1/txt2img',
          edit: 'http://localhost:7860/sdapi/v1/img2img'
        }
      }
    }
  }
};
