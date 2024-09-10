import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('app', () => {
  it('should render without crashing', () => {
    render(<App />)
    const element = screen.getByTestId('gantt')
    expect(element).toBeInTheDocument()
  })
})

