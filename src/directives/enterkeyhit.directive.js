export default {
  mounted(el, binding) {
    const input =
      el.querySelector('input') ||
      el.querySelector('textarea')

    if (input && binding.value) {
      input.setAttribute('enterkeyhint', binding.value)
    }
  },
  updated(el, binding) {
    const input =
      el.querySelector('input') ||
      el.querySelector('textarea')

    if (input && binding.value) {
      input.setAttribute('enterkeyhint', binding.value)
    }
  }
}
