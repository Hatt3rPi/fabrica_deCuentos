# Proveedores de IA para Generación de Imágenes

Este documento proporciona una visión general de los proveedores de IA disponibles para la generación de imágenes en el proyecto, incluyendo sus endpoints y modelos soportados.

## Tabla de Contenidos
- [OpenAI](#openai)
- [Flux](#flux)
- [Stable Diffusion](#stable-diffusion)

## OpenAI

### Endpoints
- **Generación de Imágenes**: `https://api.openai.com/v1/images/generations`
- **Edición de Imágenes**: `https://api.openai.com/v1/images/edits`
- **Variaciones de Imágenes**: `https://api.openai.com/v1/images/variations`

### Modelos Disponibles

#### GPT Image 1
- **ID del modelo**: `gpt-image-1`
- **Descripción**: Modelo avanzado de generación de imágenes con soporte para fondos transparentes.
- **Características**:
  - Soporte para fondos transparentes (solo formatos PNG y WebP)
  - Múltiples tamaños de salida
  - Control de calidad (baja, media, alta)
  - Modo de moderación ajustable

#### DALL·E 3
- **ID del modelo**: `dall-e-3`
- **Descripción**: Última generación de DALL·E con mejoras en la calidad y detalle de las imágenes.

#### DALL·E 2
- **ID del modelo**: `dall-e-2`
- **Descripción**: Versión anterior de DALL·E, compatible con generación y edición de imágenes.

### Uso Recomendado
```python
from openai import OpenAI

client = OpenAI()

response = client.images.generate(
    model="gpt-image-1",
    prompt="Un gato en el espacio con un traje de astronauta",
    size="1024x1024",
    quality="standard",
    n=1,
)
```

## Flux

### Endpoints
- **Generación y Edición**: `https://api.bfl.ai/v1/flux-kontext-pro`
- **Consulta de Resultados**: `https://api.bfl.ai/v1/get_result`

### Modelos Disponibles

#### FLUX.1 Kontext [pro]
- **ID del modelo**: `flux-kontext-pro`
- **Descripción**: Modelo avanzado para generación y edición de imágenes con alta fidelidad.
- **Características**:
  - Soporte para edición de imágenes con máscaras
  - Generación de imágenes a partir de texto
  - Mantenimiento de consistencia en ediciones iterativas
  - Soporte para edición de texto en imágenes

### Uso Recomendado
```python
import requests

# Generar imagen
response = requests.post(
    'https://api.bfl.ai/v1/flux-kontext-pro',
    headers={'x-key': 'TU_API_KEY'},
    json={
        'prompt': 'Un paisaje futurista al atardecer',
        'aspect_ratio': '16:9',
        'output_format': 'jpeg'
    }
)

# Obtener resultado
request_id = response.json()['id']
result = requests.get(
    'https://api.bfl.ai/v1/get_result',
    params={'id': request_id},
    headers={'x-key': 'TU_API_KEY'}
)
```

## Stable Diffusion

### Endpoints
- **API WebUI**: `http://localhost:7860` (por defecto, configuración local)
- **API Directa**: Depende de la implementación

### Modelos Disponibles

#### Stable Diffusion 1.5
- **Descripción**: Versión estándar con buen equilibrio entre velocidad y calidad.
- **Recomendado para**: Casos de uso generales, prototipado rápido.

#### Stable Diffusion XL (SDXL)
- **Descripción**: Versión mejorada con mayor resolución y calidad de salida.
- **Recomendado para**: Producción donde se requiere alta calidad.

#### Modelos Especializados
- **Anime**: Variantes optimizadas para arte de estilo anime/manga
- **Realismo**: Modelos enfocados en fotorealismo
- **Arte Digital**: Estilos artísticos específicos

### Uso Recomendado (API WebUI)
```python
import requests

# Generar imagen
response = requests.post(
    'http://localhost:7860/sdapi/v1/txt2img',
    json={
        'prompt': 'un gato astronauta, detallado, arte digital',
        'negative_prompt': 'baja calidad, borroso',
        'steps': 20,
        'width': 512,
        'height': 512
    }
)

# Guardar la imagen resultante
import base64
from PIL import Image
from io import BytesIO

image_data = base64.b64decode(response.json()['images'][0])
image = Image.open(BytesIO(image_data))
image.save('gato_astronauta.png')
```

## Comparativa de Proveedores

| Característica          | OpenAI (GPT Image/DALL·E) | Flux Kontext | Stable Diffusion |
|-------------------------|---------------------------|--------------|------------------|
| Generación de Imágenes | ✅                        | ✅           | ✅               |
| Edición de Imágenes    | ✅                        | ✅           | ✅               |
| Fondos Transparentes   | ✅ (solo PNG/WebP)        | ❌          | ✅               |
| Modelo Local           | ❌                       | ❌          | ✅               |
| Costo                 | Por token                 | Por solicitud| Gratis (autoalojado) |
| Latencia              | Media-Alta                | Media        | Depende del hardware |

## Recomendaciones

1. **OpenAI**: Ideal para integraciones rápidas y cuando se necesita soporte oficial.
2. **Flux Kontext**: Excelente para ediciones consistentes y mantenimiento de estilo.
3. **Stable Diffusion**: Mejor opción para autoalojamiento y control total sobre el modelo.

## Notas Importantes

- Los modelos y características están sujetos a cambios. Consulta la documentación oficial de cada proveedor para información actualizada.
- Considera los costos asociados con cada proveedor antes de implementar en producción.
- Asegúrate de cumplir con los términos de servicio de cada plataforma.

---

*Última actualización: Junio 2024*
