import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'archivos')

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  // path.basename strips any directory components from the filename
  const filename = path.basename(file.name)
  if (!filename) {
    return Response.json({ error: 'Invalid filename' }, { status: 400 })
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)

  return Response.json({ filename }, { status: 201 })
}
