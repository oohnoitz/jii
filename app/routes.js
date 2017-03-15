import express from 'express'
import jiiData from '../lib/jii'
import config from '../config'

const routes = express.Router()

import apiFilesController from './controllers/api/v1/files'
routes.post('/api/v1/upload', apiFilesController.create)
routes.delete('/api/v1/upload/:guid/:hash', apiFilesController.remove)
routes.delete('/api/v1/delete/:guid/:hash', apiFilesController.remove)
routes.get('/api/v1/delete/:guid/:hash', apiFilesController.remove)
routes.get('/api/v1/upload/:guid', apiFilesController.select)

import pagesController from './controllers/pages'
if (config.web.ui) {
  routes.get('/about', pagesController.about)
  routes.get('/terms-of-service', pagesController.terms)
  routes.get('/privacy-policy', pagesController.privacy)
  routes.get('/', pagesController.index)
} else {
  routes.get('/', (req, res) => res.end())
}

import filesController from './controllers/files'
routes.get('/s/:guid/:algorithm/:passphrase', filesController.serveFile)
routes.get('/r/:guid', filesController.serveFile)

export default routes
