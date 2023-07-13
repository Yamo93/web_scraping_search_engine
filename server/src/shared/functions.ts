import logger from './Logger';

export const pErr = (err: Error) => {
  if (err) {
    logger.err(err);
  }
};

export const getRandomInt = () => {
  return Math.floor(Math.random() * 1_000_000_000_000);
};

export function hasWikiUrl(href: string): boolean {
  if (href.includes('?') || href.includes(':')) return false;
  if (!href.startsWith('/wiki/')) return false;
  return href.includes('/wiki/');
}
