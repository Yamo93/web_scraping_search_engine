import { hasWikiUrl } from '@shared/functions';
import cheerio from 'cheerio';

export default class Article {
  title: string;
  content: string;
  words: string[];
  links: string[];

  constructor(title: string, content: string) {
    this.title = title;
    this.content = content;
    this.words = [];
    this.links = [];
  }

  public getFileName(): string {
    const chunks = this.title.split('/');
    const chunk = chunks[chunks.length - 1];
    let nameWithUnderscores = chunk.replace(/ /g, '_');
    // remove the _-_Wikipedia suffix
    nameWithUnderscores = nameWithUnderscores.split('_').slice(0, -2).join('_');
    return nameWithUnderscores;
  }
  
  public linksToString(): string {
    return this.links.join('\n');
  }

  public wordsToString(): string {
    return this.words.join(' ');
  }

  public setWords(words: string[]) {
    this.words = words;
  }

  public setLinks(links: string[]) {
    this.links = links;
  }

  private isWord(str: string): boolean {
    return str.length > 1 && /^[a-zA-Z]+$/.test(str);
  }

  public parseWords() {
    const $ = cheerio.load(this.content);
    const words = $('html *')
      .contents()
      .map(function (_i, el) {
        return el.type === 'text' ? $(el).text().trim().toLowerCase() : '';
      })
      .filter((_, el) => Boolean(el) && this.isWord(el))
      .get();
    this.setWords(words);
    console.log('Parsed words for article ', this.getFileName())
  }

  public parseLinks() {
    const $ = cheerio.load(this.content);
    const links = $('html a')
      .map((_, el) => $(el).attr('href'))
      .filter((_, el) => Boolean(el) && hasWikiUrl(el))
      .get();
    this.setLinks(links);
  }
}
