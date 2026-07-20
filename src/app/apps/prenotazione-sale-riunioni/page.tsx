'use client'

import { useState, useEffect } from 'react'

// ============================================================================
// COMPONENTI (convertiti da JSX React a TypeScript Next.js App Router)
// ============================================================================

const ROOMS = [
  {
    id: 1, name: 'Sala 1', floor: 'ground', color: 'room_red',
    x: 44.4, y: 5.7, width: 34.0, height: 41.7,
    capacity: 12,
    description: 'Testo segnaposto: descrizione della sala, utilizzo consigliato e dotazioni.',
  },
  {
    id: 2, name: 'Sala 2', floor: 'ground', color: 'room_blue',
    x: 78.1, y: 5.8, width: 20.6, height: 93.1,
    capacity: 8,
    description: 'Testo segnaposto: descrizione della sala, utilizzo consigliato e dotazioni.',
  },
  {
    id: 3, name: 'Sala 3', floor: 'first', color: 'room_green',
    x: 21.3, y: 53.7, width: 12.1, height: 45.7,
    capacity: 8,
    description: 'Testo segnaposto: descrizione della sala, utilizzo consigliato e dotazioni.',
  },
  {
    id: 4, name: 'Sala 4', floor: 'first', color: 'room_orange',
    x: 33.6, y: 53.7, width: 12.6, height: 45.7,
    capacity: 6,
    description: 'Testo segnaposto: descrizione della sala, utilizzo consigliato e dotazioni.',
  },
]

const colorMap: Record<string, string> = {
  room_red: '#D85A5A',
  room_blue: '#4A90E2',
  room_green: '#4B7E5B',
  room_orange: '#E8935C',
}

const FLOORS = [
  { key: 'ground', label: 'Piano Terra', image: '/Assets/piano terra.png' },
  { key: 'first', label: 'Primo Piano', image: '/Assets/primo piano.png' },
]

// --- Header ---
function Header({ logo }: { logo: string }) {
  return (
    <header className="bg-white border-b border-gray-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Prenotazione Sale Riunioni</h1>
          <p className="text-gray-500 text-sm mt-1">Il tuo spazio, quando ti serve</p>
        </div>
        <img src={logo} alt="True Design" className="h-14 w-auto" />
      </div>
    </header>
  )
}

// --- Room Photo Placeholder ---
function RoomPhotoPlaceholder({ color }: { color: string }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: `${color}14` }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ color, opacity: 0.55 }}>
        <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M4 17.5l5-5 3.5 3.5L17 11l3.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// --- Room Card ---
interface RoomCardProps {
  room: typeof ROOMS[0]
  count: number
  hovered: boolean | number
  onEnter: () => void
  onLeave: () => void
  onSelect: () => void
}

function RoomCard({ room, count, hovered, onEnter, onLeave, onSelect }: RoomCardProps) {
  const color = colorMap[room.color]
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onSelect}
      className={`group cursor-pointer rounded-xl bg-white border overflow-hidden transition-all duration-300 ${
        hovered ? 'shadow-lg -translate-y-0.5 border-transparent' : 'border-gray-200'
      }`}
      style={hovered ? { boxShadow: `0 8px 24px -8px ${color}55` } : undefined}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <RoomPhotoPlaceholder color={color} />
        <div
          className="absolute left-0 top-0 h-full w-1 transition-all"
          style={{ backgroundColor: color, opacity: hovered ? 1 : 0.6 }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <p className="font-semibold text-dark">{room.name}</p>
          <span className="ml-auto text-xs text-gray-400">fino a {room.capacity} persone</span>
        </div>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{room.description}</p>
        <p className="text-xs text-gray-400 mt-2">
          {count} prenotazion{count === 1 ? 'e' : 'i'} · Clicca per prenotare
        </p>
      </div>
    </div>
  )
}

// --- Floor Plan ---
interface FloorPlanProps {
  onRoomSelect: (room: typeof ROOMS[0]) => void
  bookings: any[]
}

function FloorPlan({ onRoomSelect, bookings }: FloorPlanProps) {
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null)

  const getBookingCount = (roomId: number) => bookings.filter(b => b.room_id === roomId).length

  return (
    <div className="space-y-10">
      {/* Le 4 sale, con foto (segnaposto) e descrizione */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {ROOMS.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            count={getBookingCount(room.id)}
            hovered={hoveredRoom === room.id}
            onEnter={() => setHoveredRoom(room.id)}
            onLeave={() => setHoveredRoom(null)}
            onSelect={() => onRoomSelect(room)}
          />
        ))}
      </div>

      {/* Le due piante, affiancate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {FLOORS.map(floor => {
          const floorRooms = ROOMS.filter(r => r.floor === floor.key)
          return (
            <div key={floor.key}>
              <h2 className="text-lg font-semibold text-dark mb-3">{floor.label}</h2>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="relative inline-block w-full">
                  <img
                    src={floor.image}
                    alt={floor.label}
                    className="w-full h-auto block"
                  />

                  <svg className="absolute inset-0 w-full h-full cursor-pointer" style={{ pointerEvents: 'auto' }}>
                    {floorRooms.map(room => (
                      <g
                        key={room.id}
                        onMouseEnter={() => setHoveredRoom(room.id)}
                        onMouseLeave={() => setHoveredRoom(null)}
                        onClick={() => onRoomSelect(room)}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect
                          x={`${room.x}%`}
                          y={`${room.y}%`}
                          width={`${room.width}%`}
                          height={`${room.height}%`}
                          fill={colorMap[room.color]}
                          opacity={hoveredRoom === room.id ? 0.5 : 0.3}
                          stroke={colorMap[room.color]}
                          strokeWidth={hoveredRoom === room.id ? 3 : 2}
                          className="transition-all"
                        />
                        {hoveredRoom === room.id && (
                          <text
                            x={`${room.x + room.width / 2}%`}
                            y={`${room.y + room.height / 2}%`}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="20"
                            fontWeight="bold"
                            fill="#3a3a3a"
                            className="pointer-events-none"
                          >
                            {room.name}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Booking Modal ---
interface BookingModalProps {
  room: typeof ROOMS[0] | null
  onClose: () => void
  onSubmit: (data: any) => void
  bookings: any[]
}

function BookingModal({ room, onClose, onSubmit, bookings }: BookingModalProps) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [duration, setDuration] = useState('30')
  const [description, setDescription] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  if (!room) return null

  const handleSubmit = () => {
    if (!name || !date || !timeStart) {
      alert('Riempi tutti i campi obbligatori')
      return
    }

    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert('Le prenotazioni sono disponibili solo da lunedì a venerdì')
      return
    }

    onSubmit({
      room_id: room.id,
      name,
      date,
      time_start: timeStart,
      duration: parseInt(duration),
      description,
    })
  }

  const timeOptions = []
  for (let h = 8; h < 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-dark">{room.name}</h2>
        <p className="text-sm text-gray-600">Compila i dettagli della tua prenotazione</p>

        <div>
          <label className="block text-sm font-medium text-dark mb-1">Il tuo nome</label>
          <input
            type="text"
            placeholder="Es. Marco Rossi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-1">Ora inizio</label>
          <select
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Seleziona un'ora</option>
            {timeOptions.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-1">Durata</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="30">30 minuti</option>
            <option value="60">1 ora</option>
            <option value="90">1 ora 30 min</option>
            <option value="120">2 ore</option>
            <option value="150">2 ore 30 min</option>
            <option value="180">3 ore</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-1">Note (opzionale)</label>
          <textarea
            placeholder="Es. Riunione con il team di design..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-dark rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-dark text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Bookings List ---
interface BookingsListProps {
  bookings: any[]
  onDeleteBooking: (id: number) => void
}

function BookingsList({ bookings, onDeleteBooking }: BookingsListProps) {
  const today = new Date().toISOString().split('T')[0]
  const upcoming = bookings
    .filter(b => b.date >= today)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const ROOM_NAMES: Record<number, string> = { 1: 'Sala 1', 2: 'Sala 2', 3: 'Sala 3', 4: 'Sala 4' }
  const ROOM_COLORS: Record<number, string> = { 1: '#D85A5A', 2: '#4A90E2', 3: '#4B7E5B', 4: '#E8935C' }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-dark">Prenotazioni in programma</h2>
        <p className="text-sm text-gray-500">
          {upcoming.length > 0 ? `${upcoming.length} prenotazion${upcoming.length === 1 ? 'e' : 'i'} — clicca la X per disdire` : 'Nessuna prenotazione'}
        </p>
      </div>

      <div className="space-y-3">
        {upcoming.map((booking: any) => (
          <div key={booking.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: ROOM_COLORS[booking.room_id] }} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-dark">{ROOM_NAMES[booking.room_id]} · {booking.name}</p>
              <p className="text-xs text-gray-500">
                {new Date(booking.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })} · {booking.time_start}–
                {(() => {
                  const [h, m] = booking.time_start.split(':').map(Number)
                  const endH = h + Math.floor((m + booking.duration) / 60)
                  const endM = (m + booking.duration) % 60
                  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
                })()}
              </p>
              {booking.description && <p className="text-xs text-gray-600 mt-1">{booking.description}</p>}
            </div>
            <button
              onClick={() => {
                if (confirm(`Disdire la prenotazione di ${booking.name} (${ROOM_NAMES[booking.room_id]}, ${booking.date} ${booking.time_start})?`)) {
                  onDeleteBooking(booking.id)
                }
              }}
              className="flex-shrink-0 px-2 py-1 text-gray-500 hover:text-red-600 transition"
              aria-label="Disdici prenotazione"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Admin Panel ---
interface AdminPanelProps {
  bookings: any[]
  onDeleteBooking: (id: number) => void
}

function AdminPanel({ bookings, onDeleteBooking }: AdminPanelProps) {
  const ROOM_NAMES: Record<number, string> = { 1: 'Sala 1', 2: 'Sala 2', 3: 'Sala 3', 4: 'Sala 4' }
  const sorted = [...bookings].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-dark mb-6">Area Admin</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Data</th>
              <th className="border px-4 py-2 text-left">Ora</th>
              <th className="border px-4 py-2 text-left">Sala</th>
              <th className="border px-4 py-2 text-left">Nome</th>
              <th className="border px-4 py-2 text-left">Durata</th>
              <th className="border px-4 py-2 text-center">Azione</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b: any) => (
              <tr key={b.id} className="border hover:bg-gray-50">
                <td className="border px-4 py-2">{b.date}</td>
                <td className="border px-4 py-2">{b.time_start}</td>
                <td className="border px-4 py-2">{ROOM_NAMES[b.room_id]}</td>
                <td className="border px-4 py-2">{b.name}</td>
                <td className="border px-4 py-2">{b.duration} min</td>
                <td className="border px-4 py-2 text-center">
                  <button
                    onClick={() => onDeleteBooking(b.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// PAGINA PRINCIPALE (Page Component)
// ============================================================================

export default function PrenotazioneSaleRiunioniPage() {
  const [selectedRoom, setSelectedRoom] = useState<typeof ROOMS[0] | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Carica dal localStorage (in produzione, collegare a Supabase)
    const stored = localStorage.getItem('bookings_prenotazione')
    if (stored) {
      try {
        setBookings(JSON.parse(stored))
      } catch {
        setBookings([])
      }
    }
  }, [])

  const saveBookings = (data: any[]) => {
    setBookings(data)
    localStorage.setItem('bookings_prenotazione', JSON.stringify(data))
  }

  const handleRoomSelect = (room: typeof ROOMS[0]) => {
    setSelectedRoom(room)
    setShowBookingModal(true)
  }

  const handleBooking = (bookingData: any) => {
    const newBooking = {
      id: Date.now(),
      ...bookingData,
    }
    saveBookings([...bookings, newBooking])
    alert('✅ Prenotazione salvata!')
    setShowBookingModal(false)
  }

  const handleDeleteBooking = (id: number) => {
    saveBookings(bookings.filter(b => b.id !== id))
  }

  return (
    <div className="meeting-rooms-app min-h-screen bg-cream text-dark">
      <Header logo="/Assets/Logo True.png" />

      {!isAdmin ? (
        <>
          <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
            <div>
              <h1 className="text-3xl font-bold text-dark mb-8">Seleziona una sala</h1>
              <FloorPlan onRoomSelect={handleRoomSelect} bookings={bookings} />
            </div>
            <BookingsList bookings={bookings} onDeleteBooking={handleDeleteBooking} />
          </main>

          {showBookingModal && (
            <BookingModal
              room={selectedRoom}
              onClose={() => setShowBookingModal(false)}
              onSubmit={handleBooking}
              bookings={bookings}
            />
          )}
        </>
      ) : (
        <AdminPanel bookings={bookings} onDeleteBooking={handleDeleteBooking} />
      )}

      <button
        onClick={() => setIsAdmin(!isAdmin)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-dark text-white rounded text-sm"
      >
        {isAdmin ? 'Esci Admin' : 'Admin'}
      </button>
    </div>
  )
}
