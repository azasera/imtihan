/**
 * Utilitas audio alert peringatan integritas untuk lembar ujian santri.
 * Menggunakan Web Audio API sintetis lokal browser (tanpa ketergantungan berkas audio eksternal).
 * Berjalan aman di lingkungan offline madrasah/pesantren dan tidak melempar galat bila diblokir browser.
 */

let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

  if (!AudioContextClass) {
    return null
  }

  try {
    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      sharedAudioContext = new AudioContextClass()
    }
    return sharedAudioContext
  } catch {
    return null
  }
}

export interface PlayIntegrityAlertOptions {
  /** Frekuensi nada awal dalam Hz (bawaan: 440 Hz). */
  frequency?: number
  /** Durasi nada dalam detik (bawaan: 0.25 detik). */
  duration?: number
  /** Tingkat volume (0.0 sampai 1.0, bawaan: 0.3 agar santun). */
  volume?: number
}

/**
 * Membunyikan nada peringatan halus dua ketukan saat santri terdeteksi meninggalkan fokus ujian.
 */
export function playIntegrityAlert(options: PlayIntegrityAlertOptions = {}): boolean {
  const { frequency = 440, duration = 0.25, volume = 0.3 } = options

  const ctx = getAudioContext()
  if (!ctx) {
    return false
  }

  try {
    if (ctx.state === "suspended") {
      // Usahakan resume jika diizinkan oleh gesture pengguna
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    // Pulsa nada pertama
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()

    osc1.type = "sine"
    osc1.frequency.setValueAtTime(frequency, now)
    osc1.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration * 0.5)

    gain1.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + duration)

    // Pulsa nada kedua (peringatan lebih tinggi)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()

    const secondStart = now + duration * 0.7
    const secondDuration = duration * 0.8

    osc2.type = "triangle"
    osc2.frequency.setValueAtTime(frequency * 1.8, secondStart)

    gain2.gain.setValueAtTime(Math.min(1, Math.max(0, volume * 0.8)), secondStart)
    gain2.gain.exponentialRampToValueAtTime(0.001, secondStart + secondDuration)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(secondStart)
    osc2.stop(secondStart + secondDuration)

    return true
  } catch {
    // Fail-safe: jika ada kebijakan autoplay browser atau kendala audio, jangan hentikan aplikasi
    return false
  }
}
