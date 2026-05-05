export async function callSarvamTranslate(
  text: string,
  apiKey: string,
  targetLanguageCode: string,
): Promise<string> {
  if (targetLanguageCode === 'en-IN') return text

  const resp = await fetch('https://api.sarvam.ai/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      input: text,
      source_language_code: 'en-IN',
      target_language_code: targetLanguageCode,
      model: 'sarvam-translate:v1',
    }),
  })

  if (!resp.ok) {
    let errMsg = `Translate HTTP ${resp.status}`
    try {
      const errJson = await resp.json()
      errMsg = errJson?.error?.message ?? errJson?.message ?? errMsg
    } catch {}
    throw new Error(errMsg)
  }

  const json = await resp.json()
  if (!json.translated_text) throw new Error('No translated_text in response')
  return json.translated_text
}
