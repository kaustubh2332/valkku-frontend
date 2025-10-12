/**
 * Centralized event type configurations
 * Includes colors, icons, labels, and type mappings
 */

// Event type configurations
export const EVENT_TYPES = {
  practise: {
    value: 'practise',
    color: '#1e88e5', // Blue
    icon: 'mdi-account-group', // Team training/practice icon
    labelKey: 'events.practise',
    noStartAndEnd: false
  },
  match: {
    value: 'match',
    color: '#e53935', // Red
    icon: 'mdi-trophy', // Competition/game icon
    labelKey: 'events.match',
    noStartAndEnd: false
  },
  meeting: {
    value: 'meeting',
    color: '#8e24aa', // Purple
    icon: 'mdi-account-multiple', // Meeting icon
    labelKey: 'events.meeting',
    noStartAndEnd: false
  },
  self_training: {
    value: 'self_training',
    color: '#43a047', // Green
    icon: 'mdi-run', // Individual training icon
    labelKey: 'events.self_directed_training',
    noStartAndEnd: true
  },
  other_event: {
    value: 'other_event',
    color: '#757575', // Grey
    icon: 'mdi-calendar-blank', // Generic event icon
    labelKey: 'events.other_event',
    noStartAndEnd: false
  }
}

// Backend type aliases (if backend uses different naming)
const TYPE_ALIASES = {
  game: 'match',
  team_training: 'practise',
  other: 'other_event'
}

/**
 * Normalize event type value (handle backend aliases)
 */
export function normalizeEventType(type) {
  if (!type) return 'other_event'
  return TYPE_ALIASES[type] || type
}

/**
 * Get event type configuration
 */
export function getEventTypeConfig(type) {
  const normalizedType = normalizeEventType(type)
  return EVENT_TYPES[normalizedType] || EVENT_TYPES.other_event
}

/**
 * Get event type color
 */
export function getEventTypeColor(type) {
  return getEventTypeConfig(type).color
}

/**
 * Get event type icon
 */
export function getEventTypeIcon(type) {
  return getEventTypeConfig(type).icon
}

/**
 * Get event type label key for i18n
 */
export function getEventTypeLabelKey(type) {
  return getEventTypeConfig(type).labelKey
}

/**
 * Get localized event type label
 */
export function getEventTypeLabel(type, $t) {
  const labelKey = getEventTypeLabelKey(type)
  return $t ? $t(labelKey) : labelKey
}

/**
 * Check if event type has no start/end time requirement
 */
export function eventTypeHasNoStartAndEnd(type) {
  return getEventTypeConfig(type).noStartAndEnd
}

/**
 * Get all event types as array (for dropdowns, etc.)
 */
export function getEventTypesArray($t) {
  return Object.values(EVENT_TYPES).map(type => ({
    title: $t ? $t(type.labelKey) : type.labelKey,
    value: type.value,
    color: type.color,
    icon: type.icon,
    noStartAndEnd: type.noStartAndEnd
  }))
}
