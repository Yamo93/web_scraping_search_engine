import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import SearchDao from '@daos/Search/SearchDao';
import PageDb from '@entities/PageDb';
import FileService from 'src/services/FileService';
import Scraper from '@daos/Scraper/Scraper';

const pageDb = new PageDb();
const fileService = new FileService();
const scraper = new Scraper(fileService);
const searchDao = new SearchDao(pageDb, fileService, scraper);
const { BAD_REQUEST, OK } = StatusCodes;

/**
 * Search documents.
 * 
 * @param req 
 * @param res 
 * @returns 
 */
export function search (req: Request, res: Response) {
    const { query, mode = 'basic' } = req.body;
    let results;
    try {
        results = searchDao.search(query, mode);
        return res.status(OK).json({ results });
    } catch (error) {
        let errorMessage = 'Something went wrong.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(BAD_REQUEST).send({ error: errorMessage });
    }
}
