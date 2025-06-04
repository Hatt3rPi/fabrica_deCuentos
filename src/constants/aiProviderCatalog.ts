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
      },
      'flux-kontext-max': {
        id: 'flux-kontext-max',
        description: 'Flux Kontext Max',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-kontext-max',
          edit: 'https://api.bfl.ai/v1/flux-kontext-max',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro': {
        id: 'flux-pro',
        description: 'Flux Pro 1.0',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.1': {
        id: 'flux-pro-1.1',
        description: 'Flux Pro 1.1',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.1',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.1-ultra': {
        id: 'flux-pro-1.1-ultra',
        description: 'Flux Pro 1.1 Ultra',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.1-ultra',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.0-fill': {
        id: 'flux-pro-1.0-fill',
        description: 'Flux Pro 1.0 Fill',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.0-fill',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.0-expand': {
        id: 'flux-pro-1.0-expand',
        description: 'Flux Pro 1.0 Expand',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.0-expand',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.0-canny': {
        id: 'flux-pro-1.0-canny',
        description: 'Flux Pro 1.0 Canny',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.0-canny',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.0-depth': {
        id: 'flux-pro-1.0-depth',
        description: 'Flux Pro 1.0 Depth',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.0-depth',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-finetuned': {
        id: 'flux-pro-finetuned',
        description: 'Flux Pro 1.0 Finetuned',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-finetuned',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.0-depth-finetuned': {
        id: 'flux-pro-1.0-depth-finetuned',
        description: 'Flux Pro 1.0 Depth Finetuned',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.0-depth-finetuned',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.0-canny-finetuned': {
        id: 'flux-pro-1.0-canny-finetuned',
        description: 'Flux Pro 1.0 Canny Finetuned',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.0-canny-finetuned',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.0-fill-finetuned': {
        id: 'flux-pro-1.0-fill-finetuned',
        description: 'Flux Pro 1.0 Fill Finetuned',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.0-fill-finetuned',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-pro-1.1-ultra-finetuned': {
        id: 'flux-pro-1.1-ultra-finetuned',
        description: 'Flux Pro 1.1 Ultra Finetuned',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-pro-1.1-ultra-finetuned',
          result: 'https://api.bfl.ai/v1/get_result'
        }
      },
      'flux-dev': {
        id: 'flux-dev',
        description: 'Flux Dev',
        endpoints: {
          generate: 'https://api.bfl.ai/v1/flux-dev',
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
