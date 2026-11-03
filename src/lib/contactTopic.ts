/**
 * Tiny event bus: lets any "Request service" button pre-select a topic
 * in the contact composer, then scrolls to the contact section.
 */
const EVENT = 'as:contact-topic';

export function requestContactTopic(topicId: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: topicId }));
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function onContactTopic(handler: (topicId: string) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
