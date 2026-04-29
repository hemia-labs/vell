import type { Media } from '@/domain/models/media.model'
import BaseService from '@/services/base/base.services'

const UPLOAD_ENDPOINT = '/api/v1/uploads'

export type UploadScope = 'library' | 'contents'

class FileUploadService extends BaseService {
  async upload(file: File, scope: UploadScope = 'library'): Promise<Media> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('scope', scope)

    const { data } = await this.client.post<Media>(UPLOAD_ENDPOINT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  }

  async uploadBatch(files: File[], scope: UploadScope = 'library'): Promise<Media[]> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('scope', scope)

    const { data } = await this.client.post<Media[]>(`${UPLOAD_ENDPOINT}/batch`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`${UPLOAD_ENDPOINT}/${id}`)
  }
}

export default FileUploadService
