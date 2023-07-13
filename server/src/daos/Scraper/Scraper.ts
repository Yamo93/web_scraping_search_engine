import FileService from 'src/services/FileService';
import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import Article from '@entities/Article';
import { hasWikiUrl } from '@shared/functions';

class Scraper {
  fileService: FileService;
  articles: Article[];
  urls: string[];
  visited: Set<string>;

  constructor(fileService: FileService) {
    this.fileService = fileService;
    this.articles = [];
    this.urls = [];
    this.visited = new Set<string>();
  }

  public async initScraper(): Promise<Article[]> {
    console.log('Scraping articles...');
    await this.scrape();
    console.log('Saving scraped articles...');
    await this.fileService.saveArticles(this.articles);
    console.log('Generating datasets of text files...');
    await this.generateDatasets();
    return this.articles;
  }

  public async generateDatasets() {
    // parse html into bags of words
    for (const article of this.articles) {
      article.parseWords();
      article.parseLinks();
      await this.fileService.saveWords(article);
      await this.fileService.saveLinks(article);
    }
  }

  private getWikiUrl(end: string): string {
    const baseUrl = 'https://en.wikipedia.org';
    return baseUrl + end;
  }

  private async scrape(): Promise<void> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const MAX_ARTICLES_TO_SCRAPE = 200;
    this.articles = [];
    this.urls = [];
    this.visited = new Set<string>();
    while (this.articles.length < MAX_ARTICLES_TO_SCRAPE) {
      console.log('Scraping article ', this.articles.length);
      const url = this.getUrlToScrape();
      if (!url) break;
      await this.navigateToPage(page, url);
      this.visited.add(url);
      const content = await page.content();
      const title = await page.title();
      if (!this.articleExists(title)) {
        // store unique article
        this.articles.push(new Article(title, content));
        this.storeOutgoingLinks(content);
      }
    }
  }

  private articleExists(title: string): boolean {
    const article = this.articles.find((a) => a.title === title);
    return Boolean(article);
  }

  private getRecentUrl(): string {
    // avoid already visited articles
    let recent = this.urls.pop();
    while (recent && this.visited.has(recent)) {
      recent = this.urls.pop();
    }
    if (!recent) throw new Error('Url stack is empty.');
    return recent;
  }

  private storeOutgoingLinks(content: string) {
    const $ = cheerio.load(content);
    $('a').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href && hasWikiUrl(href)) {
        this.urls.push(href);
      }
    });
  }

  private getUrlToScrape() {
    // choose a random starting point
    const startUrl = '/';
    const url = !this.articles.length ? startUrl : this.getRecentUrl();
    return url;
  }

  private async navigateToPage(
    page: puppeteer.Page,
    url: string
  ): Promise<void> {
    await page.goto(this.getWikiUrl(url), {
      waitUntil: 'domcontentloaded',
    });
  }
}

export default Scraper;
