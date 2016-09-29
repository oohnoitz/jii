import jiiData from '../../lib/jii'

const index = (req, res) => {
  res.render('index', jiiData)
}

const about = (req, res) => {
  res.render('pages/about', jiiData)
}

const terms = (req, res) => {
  res.render('pages/terms', jiiData)
}

const privacy = (req, res) => {
  res.render('pages/privacy', jiiData)
}

export default {
  index,
  about,
  terms,
  privacy,
}
