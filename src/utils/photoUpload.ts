import { supabase } from '@/lib/supabase'

const MAX_SIZE_PX = 800
const MAX_SIZE_KB = 200

/** Comprime uma imagem via Canvas e retorna um Blob */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      if (width > MAX_SIZE_PX || height > MAX_SIZE_PX) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE_PX) / width)
          width = MAX_SIZE_PX
        } else {
          width = Math.round((width * MAX_SIZE_PX) / height)
          height = MAX_SIZE_PX
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.85
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Falha ao comprimir imagem')); return }
          // Reduz qualidade se ainda muito grande
          if (blob.size > MAX_SIZE_KB * 1024 && quality > 0.5) {
            quality -= 0.15
            canvas.toBlob(
              (b2) => b2 ? resolve(b2) : reject(new Error('Falha ao comprimir imagem')),
              'image/jpeg',
              quality
            )
          } else {
            resolve(blob)
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    img.src = url
  })
}

/** Upload de foto do membro para Supabase Storage */
export async function uploadMemberPhoto(
  file: File,
  memberId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const blob = await compressImage(file)
    const ext = 'jpg'
    const path = `members/${memberId}.${ext}`

    const { error } = await supabase.storage
      .from('member-photos')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) return { url: null, error: error.message }

    const { data } = supabase.storage
      .from('member-photos')
      .getPublicUrl(path)

    // Cache-buster: força o browser a buscar a nova foto em vez de usar a versão em cache
    const url = `${data.publicUrl}?t=${Date.now()}`
    return { url, error: null }
  } catch (err) {
    return { url: null, error: String(err) }
  }
}

/** Upload de foto do auto-cadastro (bucket público para formulário sem login) */
export async function uploadRegistrationPhoto(
  file: File,
  registrationId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const blob = await compressImage(file)
    const path = `registrations/${registrationId}.jpg`

    const { error } = await supabase.storage
      .from('registration-photos')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true })

    if (error) return { url: null, error: error.message }

    const { data } = supabase.storage
      .from('registration-photos')
      .getPublicUrl(path)

    return { url: data.publicUrl, error: null }
  } catch (err) {
    return { url: null, error: String(err) }
  }
}
