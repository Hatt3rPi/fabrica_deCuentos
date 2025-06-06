
> **NOTA PARA EL AGENTE**
> 
> Antes de trabajar con cualquier proveedor de IA (ya sea Flux, OpenAI u otros), es **obligatorio** revisar y comprender completamente la documentación oficial del proveedor. Esto incluye pero no se limita a:
> 
> 1. **Parámetros admitidos** y sus valores por defecto
> 2. **Limitaciones y restricciones** del modelo
> 3. **Mejores prácticas** para la generación de imágenes
> 4. **Políticas de uso** y restricciones de contenido
> 5. **Consideraciones de costos** y límites de la API
> 
> No asumas el funcionamiento de los parámetros o características sin verificar la documentación correspondiente. Los proveedores actualizan frecuentemente sus APIs y modelos, por lo que es esencial trabajar con la información más reciente.

# Image Generation

FLUX.1 Kontext \[pro] can generate images directly from text input, allowing you to create entirely new visuals. This guide focuses on using the `/flux-kontext-pro` endpoint for its Text-to-Image capabilities.

To generate an image from text, you'll make a request to the `/flux-kontext-pro` endpoint.

## Examples of Image Generation

FLUX.1 Kontext \[pro] not only can edit images, but it can also generate images with a prompt. Here are a few examples of what you can create:

<Columns cols={4}>
  <Frame>
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/cat_art.png" />
  </Frame>

  <Frame>
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/robot_car.png" />
  </Frame>

  <Frame>
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/baby_elephant.png" />
  </Frame>

  <Frame>
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/woman_close_up.png" />
  </Frame>
</Columns>

**Prompts for the images above:**

• **Abstract cat artwork:** "Abstract expressionist painting Pop Art and cubism early 20 century, straight lines and solids, cute cat face without body, warm colors, green, intricate details, hologram floating in space, a vibrant digital illustration, black background, flat color, 2D, strong lines."

• **Robot and truck:** "A cute round rusted robot repairing a classic pickup truck, colorful, futuristic, vibrant glow, van gogh style"

• **Furry elephant:** "A small furry elephant pet looks out from a cat house"

• **Face paint portrait:** "A close-up of a face adorned with intricate black and blue patterns. The left side of the face is predominantly yellow, with symbols and doodles, while the right side is dark, featuring mechanical elements. The eye on the left is a striking shade of yellow, contrasting sharply with the surrounding patterns. The face is partially covered by a hooded garment, realistic style"

<Columns cols={4}>
  <Frame>
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/car_flux.png" />
  </Frame>

  <Frame>
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/samurai.png" />
  </Frame>

  <Frame>
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/car_petrol.png" />
  </Frame>

  <Frame>
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/retro_game.png" />
  </Frame>
</Columns>

**Prompts for the images above:**

• **Rainy car scene:** "Close-up of a vintage car hood under heavy rain, droplets cascading down the deep cherry-red paint, windshield blurred with streaks of water, glowing headlights diffused through mist, reflections of crimson neon signage spelling "FLUX" dancing across the wet chrome grille, steam rising from the engine, ambient red light enveloping the scene, moody composition, shallow depth of field, monochromatic red palette, cinematic lighting with glossy textures."

• **Burning temple warrior:** "A lone warrior, clad in bloodstained samurai armor, stands motionless before a massive pagoda engulfed in flames. Embers and ash swirl around him like ghosts of fallen enemies. The once-sacred temple is collapsing, its ornate carvings crumbling into the blaze as distant screams echo through the smoke-filled air. A tattered banner flutters beside him, the last symbol of a forgotten oath. The scene is both devastating and mesmerizing, with deep reds, burning oranges, and cold blue shadows creating a stark contrast. Cinematic composition, ultra-detailed textures, dynamic lighting, atmospheric fog, embers in the wind, dark fantasy realism, intense contrast."

• **Foggy gas station:** "Remote gas station swallowed by crimson fog, green glow from overhead lights staining the asphalt, new tiny smart car idling with taillights cutting through the mist, vending machine humming beside cracked fuel pumps, oily puddles reflecting distorted neon, shadows stretching unnaturally long, skeletal trees barely visible in the background, wide-angle cinematic shot, deep green monochromatic palette with faint charcoal accents, backlighting and heavy atmosphere, surreal and ominous mood."

• **Detective game character:** "Retro game style, man in old school suit, upper body, true detective, detailed character, nigh sky, crimson moon silhouette, american muscle car parked on dark street in background, complex background in style of Bill Sienkiewicz and Dave McKean and Carne Griffiths, extremely detailed, mysterious, grim, provocative, thrilling, dynamic, action-packed, fallout style, vintage, game theme, masterpiece, high contrast, stark. vivid colors, 16-bit, pixelated, textured, distressed"

## Using FLUX.1 Kontext API for Text-to-Image Generation

### Create a Request

<CodeGroup>
  ```bash create_request.sh
  # Install `curl` and `jq`, then run:
  # Ensure BFL_API_KEY is set
  # export BFL_API_KEY="your_api_key_here"

  request=$(curl -X POST \
    'https://api.bfl.ai/flux-kontext-pro' \
    -H 'accept: application/json' \
    -H "x-key: ${BFL_API_KEY}" \
    -H 'Content-Type: application/json' \
    -d '{
      "prompt": "A small furry elephant pet looks out from a cat house",
      "width": 1024,
      "height": 1024
  }')
  echo "Full request response:"
  echo $request
  request_id=$(jq -r .id <<< $request)
  echo "Request ID: ${request_id}"
  ```

  ```python create_request.py
  # Install `requests` (e.g. `pip install requests`) and `Pillow` (e.g. `pip install Pillow`), then run:

  import os
  import requests
  import base64
  from PIL import Image
  from io import BytesIO


  request = requests.post(
      'https://api.bfl.ai/v1/flux-kontext-pro',
      headers={
          'accept': 'application/json',
          'x-key': os.environ.get("BFL_API_KEY"),
          'Content-Type': 'application/json',
      },
      json={
          'prompt': 'A small furry elephant pet looks out from a cat house',
      },
  ).json()

  print(request)
  request_id = request["id"]
  ```
</CodeGroup>

A successful response will be a JSON object containing the request's `id`. This ID is used to retrieve the generated image.

### Poll for Result

After submitting a request, you need to poll the `/v1/get_result` endpoint using the `request_id` to check the status and retrieve the output when ready.

<CodeGroup>
  ```bash poll_result.sh
  while true
  do
    sleep 1.5
    result=$(curl -s -X 'GET' \
      "https://api.bfl.ai/v1/get_result?id=${request_id}" \
      -H 'accept: application/json' \
      -H "x-key: ${BFL_API_KEY}")
    status=$(jq -r .status <<< $result)
    echo "Status: $status"
    if [ "$status" == "Ready" ]
    then
      echo "Result: $(jq -r .result.sample <<< $result)"
      break
    elif [ "$status" != "Processing" ] && [ "$status" != "Queued" ] 
    then
      echo "An error or unexpected status occurred: $result"
      break
    fi
  done
  ```

  ```python poll_result.py
  # This assumes that the `request_id` variable is set.

  import time
  import os
  import requests

  # Ensure request_id is set from the previous step
  # request_id = "your_request_id_here" 

  while True:
      time.sleep(1.5)
      result = requests.get(
          'https://api.bfl.ai/v1/get_result',
          headers={
              'accept': 'application/json',
              'x-key': os.environ.get("BFL_API_KEY"),
          },
          params={'id': request_id},
      ).json()
      
      status = result.get("status")
      print(f"Status: {status}")

      if status == "Ready":
          print(f"Result: {result.get('result', {}).get('sample')}")
          break
      elif status not in ["Processing", "Queued"]: 
          print(f"An error or unexpected status occurred: {result}")
          break
  ```
</CodeGroup>

A successful response will be a json object containing the result, and `result['sample']` is a signed URL for retrieval.

<Warning>
  Our signed URLs are only valid for 10 minutes. Please retrieve your result within this timeframe.
</Warning>

### FLUX.1 Kontext Text-to-Image Parameters

<Tip>
  FLUX.1 Kontext creates 1024x1024 images by default. Use `aspect_ratio` to adjust the dimensions while keeping the same total pixels.
</Tip>

* **Supported Range**: Aspect ratios can range from 3:7 (portrait) to 7:3 (landscape).
* **Default Behavior**: If `aspect_ratio` is not specified, the model will default to a standard aspect ratio like 1:1 (e.g. 1024x1024).

| Parameter           | Type           | Default  | Description                                                                                                                       | Required |
| ------------------- | -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `prompt`            | string         |          | Text description of the desired image.                                                                                            | Yes      |
| `aspect_ratio`      | string / null  | `"1:1"`  | Desired aspect ratio (e.g., "16:9"). All outputs are \~1MP total. Supports ratios from 3:7 to 7:3.                                | No       |
| `seed`              | integer / null | `null`   | Seed for reproducibility. If `null` or omitted, a random seed is used. Accepts any integer.                                       | No       |
| `prompt_upsampling` | boolean        | `false`  | If true, performs upsampling on the prompt. Advised for T2I only currently; may not give optimal results for edit operations yet. | No       |
| `safety_tolerance`  | integer        | `2`      | Moderation level for inputs and outputs. Value ranges from 0 (most strict) to 2 (least strict for this endpoint).                 | No       |
| `output_format`     | string         | `"jpeg"` | Desired format of the output image. Can be "jpeg" or "png".                                                                       | No       |
| `webhook_url`       | string / null  | `null`   | URL for asynchronous completion notification. Must be a valid HTTP/HTTPS URL.                                                     | No       |
| `webhook_secret`    | string / null  | `null`   | Secret for webhook signature verification, sent in the `X-Webhook-Secret` header.                                                 | No       |

# Image Editing

FLUX.1 Kontext \[pro] is a model designed for Text-to-Image generation and **advanced Image Editing**. This guide focuses on its Image Editing capabilities. Unlike other models, you don't need to fine-tune or create complex workflows to achieve this - Flux.1 Kontext \[pro] handles it out of the box.

Kontext's image editing, accessed via the `/flux-kontext-pro` endpoint, provides the following key functionalities:

* **Simple Editing**: Change specific parts of an image while keeping the rest untouched
* **Smart Changes**: Make edits that look natural and fit with the rest of the image
* **Text in Images**: Add or modify text within your images

<Info>
  For comprehensive prompting techniques and advanced editing strategies, see our detailed [Prompting Guide - Image-to-Image](/guides/prompting_guide_kontext_i2i).
</Info>

## Examples of Editing

### Basic Object Modifications

FLUX.1 Kontext is really good at straightforward object modification, for example if we want to change the colour of an object, we can prompt it.

For example: `Change the car color to red`

<Columns cols={2}>
  <Frame caption="Before editing">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/yellow_car.png" />
  </Frame>

  <Frame caption="After editing">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/red_car.png" />
  </Frame>
</Columns>

### Iterative Editing

FLUX.1 Kontex excels at character consistency, even after multiple edits. Starting from a reference picture, we can see that the character is consistent throughout the sequence.

<Columns cols={2}>
  <Frame caption="First edit">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/face_image_1.png" />
  </Frame>

  <Frame caption="Second edit">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/face_image_2.png" />
  </Frame>
</Columns>

<Columns cols={2}>
  <Frame caption="Third edit">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/face_image_3.png" />
  </Frame>

  <Frame caption="Fourth edit">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/kontext/face_image_4.png" />
  </Frame>
</Columns>

### Text Editing

FLUX.1 Kontext can directly edit text that appears in images, making it easy to update signs, posters, labels, and more without recreating the entire image.

The most effective way to edit text is using quotation marks around the specific text you want to change:

**Prompt Structure**: `Replace '[original text]' with '[new text]'`

**Example -** We can see below where we have an input image with "Choose joy" written, and we replace "joy" with "BFL" - note the upper case format for BFL.

<Columns cols={2}>
  <Frame caption="Input image">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/guides/text_editing_1.png" alt="Input image: Sign saying 'Choose joy'" />
  </Frame>

  <Frame caption="JOY replaced with BFL">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/guides/text_editing_2.png" alt="Output image: Sign changed to 'Choose BFL'" />
  </Frame>
</Columns>

<Columns cols={2}>
  <Frame caption="Input image">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/guides/text_editing_3.jpg" alt="Input image:" />
  </Frame>

  <Frame caption="Sync & Bloom changed to 'FLUX & JOY'">
    <img src="https://mintlify.s3.us-west-1.amazonaws.com/bfl/images/guides/text_editing_4.png" alt="Output image: Text replaced with 'FLUX & JOY'" />
  </Frame>
</Columns>

## Using FLUX.1 Kontext API for Image Editing

This **requires both** a **text prompt** and **an input image** to work, with the input image serving as the base that will be edited according to your prompt.

To use Kontext for image editing, you'll make a request to the `/flux-kontext-pro` endpoint:

### Create Request

<CodeGroup>
  ```bash create_request.sh
  # Install `curl` and `jq`, then run:
  request=$(curl -X POST \
    'https://api.bfl.ai/v1/flux-kontext-pro' \
    -H 'accept: application/json' \
    -H "x-key: ${BFL_API_KEY}" \
    -H 'Content-Type: application/json' \
    -d '{
      "prompt": "<What you want to edit on the image>",
      "input_image": "<base64 converted image>",
  }')
  echo $request
  request_id=$(jq -r .id <<< $request)
  ```

  ```python create_request.py
  # Install `requests` (e.g. `pip install requests`) 
  # and `Pillow` (e.g. `pip install Pillow`)

  import os
  import requests
  import base64
  from PIL import Image
  from io import BytesIO

  # Load and encode your image
  # Replace "<your_image.jpg>" with the path to your image file
  image = Image.open("<your_image.jpg>")
  buffered = BytesIO()
  image.save(buffered, format="JPEG") # Or "PNG" if your image is PNG
  img_str = base64.b64encode(buffered.getvalue()).decode()

  request = requests.post(
      'https://api.bfl.ai/v1/flux-kontext-pro',
      headers={
          'accept': 'application/json',
          'x-key': os.environ.get("BFL_API_KEY"),
          'Content-Type': 'application/json',
      },
      json={
          'prompt': '<What you want to edit on the image>',
          'input_image': img_str,
      },
  ).json()

  print(request)
  request_id = request["id"]
  ```
</CodeGroup>

<Note>
Al convertir imágenes a base64 en Deno se recomienda utilizar el helper `encode`
de `std/encoding/base64.ts` para evitar problemas con `btoa` en buffers grandes.
</Note>

A successful response will be a json object containing the request's id, that will be used to retrieve the actual result.

### Poll for Result

After submitting a request, you need to poll the `/v1/get_result` endpoint using the `request_id` to check the status and retrieve the output when ready.

<CodeGroup>
  ```bash poll_result.sh
  while true
  do
    sleep 1.5
    result=$(curl -s -X 'GET' \
      "https://api.bfl.ai/v1/get_result?id=${request_id}" \
      -H 'accept: application/json' \
      -H "x-key: ${BFL_API_KEY}")
    status=$(jq -r .status <<< $result)
    echo "Status: $status"
    if [ "$status" == "Ready" ]
    then
      echo "Result: $(jq -r .result.sample <<< $result)"
      break
    elif [ "$status" != "Processing" ] && [ "$status" != "Queued" ] 
    then
      echo "An error or unexpected status occurred: $result"
      break
    fi
  done
  ```

  ```python poll_result.py
  # This assumes that the `request_id` variable is set.

  import time
  import os
  import requests

  # Ensure request_id is set from the previous step
  # request_id = "your_request_id_here" 

  while True:
      time.sleep(1.5)
      result = requests.get(
          'https://api.bfl.ai/v1/get_result',
          headers={
              'accept': 'application/json',
              'x-key': os.environ.get("BFL_API_KEY"),
          },
          params={'id': request_id},
      ).json()
      
      status = result.get("status")
      print(f"Status: {status}")

      if status == "Ready":
          print(f"Result: {result.get('result', {}).get('sample')}")
          break
      elif status not in ["Processing", "Queued"]: 
          print(f"An error or unexpected status occurred: {result}")
          break
  ```
</CodeGroup>

A successful response will be a json object containing the result, and `result['sample']` is a signed URL for retrieval.

<Warning>
  Our signed URLs are only valid for 10 minutes. Please retrieve your result within this timeframe.
</Warning>

## FLUX.1 Kontext Image Editing Parameters (for /flux-kontext-pro)

List of Kontext parameters for image editing via the `/flux-kontext-pro` endpoint:

| Parameter          | Description                                   | Default  | Range         |
| ------------------ | --------------------------------------------- | -------- | ------------- |
| `prompt`           | Text description of what you want to generate | Required |               |
| `input_image`      | Base64 encoded image to use as reference      | Required |               |
| `seed`             | Optional seed for reproducibility             | None     | Any integer   |
| `safety_tolerance` | Moderation level (0=strict, 6=permissive)     | 2        | 0-6           |
| `output_format`    | Format of the output image                    | "jpeg"   | "jpeg", "png" |
| `safety_filter`    | Whether to apply safety filters              | true     | boolean       |
| `store`            | Whether to store the generated image        | true     | boolean       |

## Referencia de la API

Para una documentación más detallada de la API de Flux, incluyendo todos los endpoints disponibles, parámetros y esquemas de solicitud/respuesta, consulta el [Cookbook de la API de Flux](./Cookbook.md).

La documentación completa incluye:

- Especificación OpenAPI 3.1.0 completa
- Descripción detallada de todos los endpoints
- Esquemas de solicitud y respuesta
- Códigos de estado HTTP
- Esquemas de autenticación
- Ejemplos de solicitudes y respuestas

Esta documentación es especialmente útil para desarrolladores que necesitan integrar la API de Flux en sus aplicaciones o para entender en profundidad las capacidades del sistema.
