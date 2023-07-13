import Article from '@entities/Article';
import { promises as fs } from 'fs';
import path from 'path';

export default class FileService {
  public async saveLinks(article: Article): Promise<void> {
    const fileName = article.getFileName();
    const filePath = this.getFilePath(fileName, 'Links', '');
    const links: string = article.linksToString();
    await fs.writeFile(filePath, links);
  }

  public async saveWords(article: Article): Promise<void> {
    const fileName = article.getFileName();
    const filePath = this.getFilePath(fileName, 'Words', '');
    const words: string = article.wordsToString();
    await fs.writeFile(filePath, words);
  }

  public async saveArticle(article: Article) {
    const fileName: string = article.getFileName();
    const filePath: string = this.getFilePath(fileName, 'html', '.html');
    await fs.writeFile(filePath, article.content);
  }

  public async saveArticles(articles: Article[]) {
    for (const article of articles) {
      await this.saveArticle(article);
    }
  }

  private getFilePath(
    title: string,
    folderName: string,
    extension: string
  ): string {
    return path.join(__dirname, '..', 'data', folderName, title + extension);
  }

  public async isHtmlDirectoryEmpty(): Promise<boolean> {
    const files = await fs.readdir(path.join(__dirname, '..', 'html'));
    return !files.length;
  }
}
