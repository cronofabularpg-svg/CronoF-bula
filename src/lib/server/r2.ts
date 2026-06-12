// Cliente Cloudflare R2 (S3-compatible). Server-only — nunca importar em
// componentes 'use client'. As chaves vêm de src/lib/server/env.ts (r2Env),
// que já valida que nenhuma delas usa o prefixo NEXT_PUBLIC_.

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Env, isR2Configured } from './env'

if (typeof window !== 'undefined') {
  throw new Error('src/lib/server/r2.ts não pode ser importado no client.')
}

let cachedClient: S3Client | null = null

export function getR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 não está configurado (variáveis de ambiente ausentes).')
  }

  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: `https://${r2Env.accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: r2Env.accessKeyId,
        secretAccessKey: r2Env.secretAccessKey,
      },
      // O AWS SDK v3 recente adiciona automaticamente parâmetros de checksum
      // (x-amz-checksum-crc32 / x-amz-sdk-checksum-algorithm) a comandos S3,
      // inclusive em URLs pré-assinadas. O R2 não implementa esses checksums
      // e rejeita o PUT com 403. "WHEN_REQUIRED" só calcula/valida checksum
      // quando explicitamente pedido via ChecksumAlgorithm (que não usamos).
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
  }

  return cachedClient
}

/**
 * Junta a URL pública/CDN do bucket (`CLOUDFLARE_R2_PUBLIC_URL`) com a storage
 * key de um objeto, evitando barras duplicadas (`//`) ou ausentes entre os
 * dois (`...comcampaigns/...`) — independente de `baseUrl` terminar ou não
 * com `/` e de `key` começar ou não com `/`.
 */
export function joinR2PublicUrl(baseUrl: string, key: string): string {
  const base = baseUrl.replace(/\/+$/, '')
  const cleanKey = key.replace(/^\/+/, '')
  return `${base}/${cleanKey}`
}

/** Monta a URL pública de um objeto a partir da sua storage key. */
export function getR2PublicUrl(key: string): string {
  return joinR2PublicUrl(r2Env.publicUrl, key)
}

/** Sanitiza um nome de arquivo para uso seguro em uma storage key do R2. */
export function sanitizeR2FileName(fileName: string): string {
  const cleaned = fileName
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
  return cleaned.slice(-100) || 'arquivo'
}

/** Gera a storage key padrão `campaigns/{campaignId}/{usageType}/{uuid}-{nome}`. */
export function buildR2StorageKey(campaignId: string, usageType: string, fileName: string, uuid: string): string {
  return `campaigns/${campaignId}/${usageType}/${uuid}-${sanitizeR2FileName(fileName)}`
}

export type PresignedUploadParams = {
  key: string
  contentType: string
  expiresInSeconds?: number
}

/** Gera uma URL assinada de PUT para upload direto ao bucket R2. */
export async function createPresignedUploadUrl({
  key,
  contentType,
  expiresInSeconds = 300,
}: PresignedUploadParams): Promise<string> {
  const client = getR2Client()

  const command = new PutObjectCommand({
    Bucket: r2Env.bucket,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

export type DirectUploadParams = {
  key: string
  contentType: string
  body: Buffer
}

/**
 * Faz o upload de um objeto diretamente do servidor para o R2 (sem URL
 * assinada). Usado como fallback quando o PUT direto do browser falha por
 * CORS/checksum — o arquivo passa pelo Route Handler em vez de ir do
 * navegador direto ao bucket.
 */
export async function uploadObjectToR2({ key, contentType, body }: DirectUploadParams): Promise<void> {
  const client = getR2Client()

  const command = new PutObjectCommand({
    Bucket: r2Env.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  })

  await client.send(command)
}
