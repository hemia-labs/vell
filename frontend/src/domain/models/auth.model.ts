export interface AuthResponse {
  token: string
  user: UserResponse
}

export interface UserResponse {
  id: string
  email: string
  name: string
}

export interface User {
  user: UserProfile
  authorization: UserAuthorization
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  emailVerified: boolean
}

export interface UserAuthorization {
  roles: string[]
  permissions: string[]
}
