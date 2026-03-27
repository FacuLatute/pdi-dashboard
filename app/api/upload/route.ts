import { createClient } from '@/lib/supabase/server'
import path from 'path'

const BUCKET = 'archivos'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const filename = path.basename(file.name)
  if (!filename) return Response.json({ error: 'Invalid filename' }, { status: 400 })

  // Namespace by user to avoid collisions
  const storagePath = `${user.id}/${Date.now()}-${filename}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  return Response.json({ publicUrl }, { status: 201 })
}
