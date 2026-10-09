// Copy buttons: copy the prompt next to the button. If the clipboard is not
// available, select the text so the person can copy it by hand.
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]")
  if (!button) return
  const text = button.closest(".prompt")?.querySelector(".txt")
  if (!text) return
  try {
    await navigator.clipboard.writeText(text.innerText.trim())
    button.textContent = "Copied"
  } catch {
    const range = document.createRange()
    range.selectNodeContents(text)
    getSelection().removeAllRanges()
    getSelection().addRange(range)
    button.textContent = "Select and copy"
  }
  setTimeout(() => { button.textContent = "Copy" }, 2000)
})
