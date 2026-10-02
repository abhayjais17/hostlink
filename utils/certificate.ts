/**
 * SSL certificate handling for both local development and Vercel deployment
 *
 * In Vercel serverless environment, files aren't accessible via filesystem.
 * This utility provides certificate from either:
 * 1. CA_CERT_BASE64 environment variable (base64-encoded ca.pem) - for Vercel
 * 2. Local ca.pem file - for local development
 */

import fs from 'fs/promises'
import path from 'path'

export interface CertificateOptions {
  ssl?: {
    ca?: string
  }
}

export async function getCertificateOptions(): Promise<CertificateOptions> {
  const base64Cert = process.env.CA_CERT_BASE64

  if (base64Cert) {
    // Vercel deployment: decode base64 certificate from environment variable
    try {
      const cert = Buffer.from(base64Cert, 'base64').toString('utf-8')
      return {
        ssl: {
          ca: cert
        }
      }
    } catch (error) {
      console.error('Failed to decode CA_CERT_BASE64:', error)
      // Fall through to try local file
    }
  }

  // Local development: read from ca.pem file
  try {
    const certPath = path.join(process.cwd(), 'ca.pem')
    const cert = await fs.readFile(certPath, 'utf-8')
    return {
      ssl: {
        ca: cert
      }
    }
  } catch (error) {
    console.error('Failed to read ca.pem file:', error)
    // Return empty options if no certificate available
    return {}
  }
}

export function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || ''

  // Remove sslcert parameter if it exists (we'll handle SSL via connection options)
  return baseUrl.replace(/\?.*$/, '').replace(/&sslca=.*/, '')
}