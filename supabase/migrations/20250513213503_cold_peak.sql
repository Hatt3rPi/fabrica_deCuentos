/*
  # Store OpenAI Image Generation API Documentation

  1. New Settings
    - Stores OpenAI Image Generation API documentation in system_settings
    - Includes all endpoints, parameters, and examples
    - Structured as JSON for easy access and updates

  2. Security
    - Maintains existing RLS policies
    - Only admins can access this documentation
*/

INSERT INTO system_settings (id, key, value)
VALUES (
  gen_random_uuid(),
  'openai_image_docs',
  jsonb_build_object(
    'version', '2024-03',
    'endpoints', jsonb_build_array(
      jsonb_build_object(
        'name', 'Create image',
        'endpoint', '/v1/images/generations',
        'method', 'POST',
        'description', 'Creates an image given a prompt',
        'parameters', jsonb_build_object(
          'prompt', jsonb_build_object(
            'type', 'string',
            'required', true,
            'description', 'Text description of the desired image(s). Max length: 32000 chars for gpt-image-1, 1000 for dall-e-2, 4000 for dall-e-3'
          ),
          'model', jsonb_build_object(
            'type', 'string',
            'required', false,
            'default', 'dall-e-2',
            'options', array['dall-e-2', 'dall-e-3', 'gpt-image-1']
          ),
          'quality', jsonb_build_object(
            'type', 'string',
            'required', false,
            'default', 'auto',
            'options', jsonb_build_object(
              'gpt-image-1', array['high', 'medium', 'low'],
              'dall-e-3', array['hd', 'standard'],
              'dall-e-2', array['standard']
            )
          ),
          'size', jsonb_build_object(
            'type', 'string',
            'required', false,
            'default', 'auto',
            'options', jsonb_build_object(
              'gpt-image-1', array['1024x1024', '1536x1024', '1024x1536', 'auto'],
              'dall-e-3', array['1024x1024', '1792x1024', '1024x1792'],
              'dall-e-2', array['256x256', '512x512', '1024x1024']
            )
          ),
          'style', jsonb_build_object(
            'type', 'string',
            'required', false,
            'default', 'vivid',
            'options', array['vivid', 'natural'],
            'description', 'Only supported for dall-e-3'
          )
        )
      ),
      jsonb_build_object(
        'name', 'Create image edit',
        'endpoint', '/v1/images/edits',
        'method', 'POST',
        'description', 'Creates an edited or extended image given one or more source images and a prompt',
        'supported_models', array['gpt-image-1', 'dall-e-2'],
        'parameters', jsonb_build_object(
          'image', jsonb_build_object(
            'type', 'string or array',
            'required', true,
            'description', 'The image(s) to edit. For gpt-image-1: up to 16 images, <25MB each. For dall-e-2: one square PNG <4MB'
          ),
          'prompt', jsonb_build_object(
            'type', 'string',
            'required', true,
            'description', 'Text description of the desired image(s). Max length: 32000 chars for gpt-image-1, 1000 for dall-e-2'
          )
        )
      ),
      jsonb_build_object(
        'name', 'Create image variation',
        'endpoint', '/v1/images/variations',
        'method', 'POST',
        'description', 'Creates a variation of a given image',
        'supported_models', array['dall-e-2'],
        'parameters', jsonb_build_object(
          'image', jsonb_build_object(
            'type', 'file',
            'required', true,
            'description', 'The image to use as the basis for the variation(s). Must be a valid PNG file, less than 4MB, and square'
          )
        )
      )
    ),
    'response_format', jsonb_build_object(
      'created', 'integer (Unix timestamp)',
      'data', 'array of generated images',
      'usage', jsonb_build_object(
        'total_tokens', 'integer',
        'input_tokens', 'integer',
        'output_tokens', 'integer'
      )
    ),
    'examples', jsonb_build_object(
      'generate_image', 
      'const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: "A cute baby sea otter",
        n: 1,
        size: "1024x1024"
      });',
      'create_variation',
      'const response = await openai.images.createVariation({
        image: fs.createReadStream("image.png"),
        n: 1
      });'
    )
  )
) ON CONFLICT (key) DO UPDATE 
  SET value = EXCLUDED.value,
      updated_at = now();