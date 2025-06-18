import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create authenticated Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const url = new URL(req.url)
    const storyId = url.pathname.split('/').pop()

    if (!storyId) {
      throw new Error('Story ID is required')
    }

    // Get story data with pages
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        *,
        story_pages (
          id,
          page_number,
          text,
          image_url,
          prompt
        )
      `)
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (storyError || !story) {
      throw new Error('Story not found or access denied')
    }

    // Check if story is completed
    if (story.status !== 'completed') {
      throw new Error('Story must be completed before export')
    }

    // Sort pages by page number
    const sortedPages = story.story_pages.sort((a: any, b: any) => a.page_number - b.page_number)

    // Create PDF content (simplified - in real implementation you'd use a PDF library)
    const pdfContent = {
      title: story.title || 'Mi Cuento',
      pages: sortedPages.map((page: any) => ({
        pageNumber: page.page_number,
        text: page.text,
        imageUrl: page.image_url
      })),
      metadata: {
        theme: story.theme,
        targetAge: story.target_age,
        literaryStyle: story.literary_style,
        centralMessage: story.central_message,
        createdAt: story.created_at
      }
    }

    // For now, return the story data as JSON
    // In a real implementation, you would generate a PDF and store it in storage
    const fileName = `cuento-${storyId}-${Date.now()}.json`
    
    // Store in export bucket (create a simple JSON export for now)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('export')
      .upload(fileName, JSON.stringify(pdfContent, null, 2), {
        contentType: 'application/json',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Export failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('export')
      .getPublicUrl(fileName)

    // Update story with export info
    await supabase
      .from('stories')
      .update({ 
        export_url: urlData.publicUrl,
        exported_at: new Date().toISOString()
      })
      .eq('id', storyId)

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: urlData.publicUrl,
        fileName,
        message: 'Story exported successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})