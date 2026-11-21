// Only the payload's claims are read, never verified, so this is plain base64url JSON. Node's 'base64'
// decoder also accepts the URL-safe alphabet.
export const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'))
    return payload && typeof payload === 'object' ? payload : null
  } catch {
    return null
  }
}

export class Token {
  public token: string | undefined
  private decoded: Record<string, any> | null

  constructor(token: string) {
    this.token = token
    this.decoded = this.token ? decodeJwtPayload(token) : null
  }

  get login() {
    return this.decoded && this.decoded.sub
  }

  public isValid() {
    return this.decoded && this.decoded.exp && Number(this.decoded.exp) >= Date.now() / 1000
  }
}
