import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')

describe('Prenotazione Sale Riunioni', () => {
  it('associa una fotografia a ciascuna sala', () => {
    for (const roomNumber of [1, 2, 3, 4]) {
      expect(pageSource).toContain(`/Assets/sale-riunioni/sala-${roomNumber}.jpg`)
    }

    expect(pageSource).toContain('src={room.image}')
    expect(pageSource).toContain('object-cover')
  })

  it('reads shared bookings and subscribes to their live changes', () => {
    expect(pageSource).toContain('createRoomBookingsRepository')
    expect(pageSource).toContain("postgres_changes")
    expect(pageSource).not.toContain('bookings_prenotazione')
  })
})
