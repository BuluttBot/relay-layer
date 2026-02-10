export interface PinRequest {
  pin: string;
}

export interface PinResponse {
  success: boolean;
  pinToken?: string;
  error?: string;
}

export interface CodeRequest {
  pinToken: string;
}

export interface CodeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface VerifyRequest {
  pinToken: string;
  code: string;
}

export interface VerifyResponse {
  success: boolean;
  error?: string;
}

export interface AuthSession {
  id: string;
  token: string;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
}
