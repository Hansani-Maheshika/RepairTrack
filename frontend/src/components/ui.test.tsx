import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './ui'

describe('StatusBadge',()=>{it('shows readable repair status text',()=>{render(<StatusBadge status="READY_FOR_COLLECTION"/>);expect(screen.getByText('Ready For Collection')).toBeInTheDocument()})})
