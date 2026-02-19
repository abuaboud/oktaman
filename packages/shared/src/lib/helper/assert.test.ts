import { describe, it, expect } from 'vitest'
import { assertNotNullOrUndefined } from './assert'

describe('assertNotNullOrUndefined', () => {
  it('should not throw for valid values', () => {
    expect(() => assertNotNullOrUndefined('hello', 'error')).not.toThrow()
    expect(() => assertNotNullOrUndefined(0, 'error')).not.toThrow()
    expect(() => assertNotNullOrUndefined(false, 'error')).not.toThrow()
    expect(() => assertNotNullOrUndefined([], 'error')).not.toThrow()
    expect(() => assertNotNullOrUndefined({}, 'error')).not.toThrow()
  })

  it('should throw for null', () => {
    expect(() => assertNotNullOrUndefined(null, 'Value is null')).toThrow('Value is null')
  })

  it('should throw for undefined', () => {
    expect(() => assertNotNullOrUndefined(undefined, 'Value is undefined')).toThrow('Value is undefined')
  })

  it('should narrow type correctly', () => {
    const value: string | null = 'test'
    assertNotNullOrUndefined(value, 'error')
    // TypeScript should now know that value is string, not string | null
    const length: number = value.length
    expect(length).toBe(4)
  })
})
