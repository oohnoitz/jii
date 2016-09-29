import express from 'express'
import jiiData from '../lib/jii'

const routes = express.Router()

import apiFilesController from './controllers/api/v1/files'
routes.post('/api/v1/upload', apiFilesController.create)

import pagesController from './controllers/pages'
routes.get('/about', pagesController.about)
routes.get('/terms-of-service', pagesController.terms)
routes.get('/privacy-policy', pagesController.privacy)
routes.get('/', pagesController.index)

import filesController from './controllers/files'
routes.get('/s/:guid/:algorithm/:passphrase', filesController.serveFile)
routes.get('/:guid', filesController.serveFile)

export default routes
