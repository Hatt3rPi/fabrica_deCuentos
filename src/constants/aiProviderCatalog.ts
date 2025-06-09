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
      // Modelos de imagen
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
      },
      // Modelos de texto más recientes
      'gpt-4.1': {
        id: 'gpt-4.1',
        description: 'GPT-4.1',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'gpt-4.1-mini': {
        id: 'gpt-4.1-mini',
        description: 'GPT-4.1 Mini',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'gpt-4.1-nano': {
        id: 'gpt-4.1-nano',
        description: 'GPT-4.1 Nano',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'gpt-4.5-preview': {
        id: 'gpt-4.5-preview',
        description: 'GPT-4.5 Preview',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'gpt-4o': {
        id: 'gpt-4o',
        description: 'GPT-4o',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'gpt-4o-mini': {
        id: 'gpt-4o-mini',
        description: 'GPT-4o Mini',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'o1': {
        id: 'o1',
        description: 'O1',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'o1-pro': {
        id: 'o1-pro',
        description: 'O1 Pro',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'o3': {
        id: 'o3',
        description: 'O3',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'o4-mini': {
        id: 'o4-mini',
        description: 'O4 Mini',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'o3-mini': {
        id: 'o3-mini',
        description: 'O3 Mini',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'o1-mini': {
        id: 'o1-mini',
        description: 'O1 Mini',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'codex-mini-latest': {
        id: 'codex-mini-latest',
        description: 'Codex Mini Latest',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      // Modelos GPT-4 anteriores
      'gpt-4-turbo': {
        id: 'gpt-4-turbo',
        description: 'GPT-4 Turbo',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'gpt-4': {
        id: 'gpt-4',
        description: 'GPT-4',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'gpt-4-1106-preview': {
        id: 'gpt-4-1106-preview',
        description: 'GPT-4 Turbo Preview',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      // Modelos GPT-3.5
      'gpt-3.5-turbo': {
        id: 'gpt-3.5-turbo',
        description: 'GPT-3.5 Turbo',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'gpt-3.5-turbo-instruct': {
        id: 'gpt-3.5-turbo-instruct',
        description: 'GPT-3.5 Turbo Instruct',
        endpoints: {
          generate: 'https://api.openai.com/v1/completions'
        }
      },
      'gpt-3.5-turbo-16k-0613': {
        id: 'gpt-3.5-turbo-16k-0613',
        description: 'GPT-3.5 Turbo 16K',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      'gpt-3.5-turbo-1106': {
        id: 'gpt-3.5-turbo-1106',
        description: 'GPT-3.5 Turbo (Latest)',
        endpoints: {
          generate: 'https://api.openai.com/v1/chat/completions'
        }
      },
      // Modelos legacy
      'davinci-002': {
        id: 'davinci-002',
        description: 'Davinci 002',
        endpoints: {
          generate: 'https://api.openai.com/v1/completions'
        }
      },
      'babbage-002': {
        id: 'babbage-002',
        description: 'Babbage 002',
        endpoints: {
          generate: 'https://api.openai.com/v1/completions'
        }
      },
      // Modelos de audio
      'gpt-4o-audio-preview': {
        id: 'gpt-4o-audio-preview',
        description: 'GPT-4o Audio Preview',
        endpoints: {
          generate: 'https://api.openai.com/v1/audio/speech'
        }
      },
      'gpt-4o-mini-audio-preview': {
        id: 'gpt-4o-mini-audio-preview',
        description: 'GPT-4o Mini Audio Preview',
        endpoints: {
          generate: 'https://api.openai.com/v1/audio/speech'
        }
      },
      'gpt-4o-realtime-preview': {
        id: 'gpt-4o-realtime-preview',
        description: 'GPT-4o Realtime Preview',
        endpoints: {
          generate: 'https://api.openai.com/v1/realtime'
        }
      },
      'gpt-4o-mini-realtime-preview': {
        id: 'gpt-4o-mini-realtime-preview',
        description: 'GPT-4o Mini Realtime Preview',
        endpoints: {
          generate: 'https://api.openai.com/v1/realtime'
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
