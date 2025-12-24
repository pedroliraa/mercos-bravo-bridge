export default async function retry(fn, attempts = 3, delay = 300) {
  let tries = 0;

  while (tries < attempts) {
    try {
      return await fn();
    } catch (err) {
      tries++;
      if (tries === attempts) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
