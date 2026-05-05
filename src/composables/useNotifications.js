let checkedThisSession = false

export function useNotifications() {
  async function requestPermission() {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  function checkDeadlines(projects) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (checkedThisSession) return
    checkedThisSession = true

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const active = projects.filter((p) => p.status === 'active' && p.deliveryDate && !p.waitingClose)

    for (const p of active) {
      const deadline = p.deliveryDate?.toDate?.() ?? new Date(p.deliveryDate)
      deadline.setHours(0, 0, 0, 0)
      const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))

      let title, body
      if (diff < 0) {
        title = 'Entrega vencida'
        body = `"${p.title}" vencio hace ${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? 's' : ''}.`
      } else if (diff === 0) {
        title = 'Entrega hoy'
        body = `"${p.title}" vence hoy.`
      } else if (diff === 1) {
        title = 'Entrega manana'
        body = `"${p.title}" vence manana.`
      } else if (diff <= 3) {
        title = `Entrega en ${diff} dias`
        body = `"${p.title}" vence el ${deadline.toLocaleDateString('es', { day: '2-digit', month: 'short' })}.`
      }

      if (title) {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: `deadline-${p.id}`,
        })
      }
    }
  }

  return { requestPermission, checkDeadlines }
}
