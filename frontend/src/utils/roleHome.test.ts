import { describe, expect, it } from 'vitest'
import { roleHome } from './roleHome'

describe('roleHome',()=>{it('maps every staff role to its own dashboard',()=>{expect(roleHome('ADMIN')).toBe('/admin/dashboard');expect(roleHome('RECEPTIONIST')).toBe('/receptionist/dashboard');expect(roleHome('TECHNICIAN')).toBe('/technician/dashboard')})})
